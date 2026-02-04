-- Drop and recreate the function with renamed return columns to avoid ambiguity
DROP FUNCTION IF EXISTS public.assign_next_lead(integer);

CREATE OR REPLACE FUNCTION public.assign_next_lead(p_worker_id integer)
 RETURNS TABLE(out_lead_id integer, out_name text, out_phone text, out_email text, out_website text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_lead_id INTEGER;
BEGIN
    -- First, release any expired locks
    UPDATE voip_leads
    SET status = 'NEW', assigned_to = NULL, assigned_at = NULL, locked_until = NULL
    WHERE status = 'ASSIGNED' 
    AND locked_until < now()
    AND id NOT IN (
        SELECT DISTINCT vc.lead_id FROM voip_calls vc WHERE vc.lead_id IS NOT NULL
    );
    
    -- Find and lock an available lead atomically
    SELECT l.id INTO v_lead_id
    FROM voip_leads l
    WHERE l.status = 'NEW'
    AND l.id NOT IN (
        SELECT wlh.lead_id FROM voip_worker_lead_history wlh WHERE wlh.worker_id = p_worker_id
    )
    ORDER BY l.created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;
    
    IF v_lead_id IS NULL THEN
        RETURN;
    END IF;
    
    -- Assign the lead to the worker
    UPDATE voip_leads
    SET status = 'ASSIGNED',
        assigned_to = p_worker_id,
        assigned_at = now(),
        locked_until = now() + interval '10 minutes'
    WHERE id = v_lead_id;
    
    -- Record in worker history to prevent repeat
    INSERT INTO voip_worker_lead_history (worker_id, lead_id)
    VALUES (p_worker_id, v_lead_id)
    ON CONFLICT (worker_id, lead_id) DO NOTHING;
    
    -- Return the lead details
    RETURN QUERY
    SELECT 
        l.id,
        l.name,
        l.phone,
        l.email,
        l.website
    FROM voip_leads l
    WHERE l.id = v_lead_id;
END;
$function$;