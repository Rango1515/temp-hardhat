// Supabase database helper using the service role for VoIP tables
import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper to run queries similar to the old MariaDB interface
export async function query<T = Record<string, unknown>>(
  table: string,
  options?: {
    select?: string;
    filter?: Record<string, unknown>;
    eq?: [string, unknown][];
    order?: { column: string; ascending?: boolean };
    limit?: number;
    offset?: number;
    single?: boolean;
  }
): Promise<T[]> {
  let q = supabase.from(table).select(options?.select || "*");

  if (options?.eq) {
    for (const [col, val] of options.eq) {
      q = q.eq(col, val);
    }
  }

  if (options?.filter) {
    for (const [key, value] of Object.entries(options.filter)) {
      q = q.eq(key, value);
    }
  }

  if (options?.order) {
    q = q.order(options.order.column, { ascending: options.order.ascending ?? false });
  }

  if (options?.limit) {
    q = q.limit(options.limit);
  }

  if (options?.offset) {
    q = q.range(options.offset, options.offset + (options.limit || 20) - 1);
  }

  const { data, error } = options?.single ? await q.maybeSingle() : await q;

  if (error) {
    console.error(`[DB Query Error] ${table}:`, error);
    throw error;
  }

  if (options?.single) {
    return data ? [data as T] : [];
  }

  return (data || []) as T[];
}

export async function insert<T = Record<string, unknown>>(
  table: string,
  values: Record<string, unknown>
): Promise<{ data: T | null; id?: number }> {
  const { data, error } = await supabase
    .from(table)
    .insert(values)
    .select()
    .single();

  if (error) {
    console.error(`[DB Insert Error] ${table}:`, error);
    throw error;
  }

  return { data: data as T, id: data?.id };
}

export async function update(
  table: string,
  values: Record<string, unknown>,
  filter: Record<string, unknown>
): Promise<{ count: number }> {
  let q = supabase.from(table).update(values);

  for (const [key, value] of Object.entries(filter)) {
    q = q.eq(key, value);
  }

  const { error, count } = await q;

  if (error) {
    console.error(`[DB Update Error] ${table}:`, error);
    throw error;
  }

  return { count: count || 0 };
}

export async function deleteRow(
  table: string,
  filter: Record<string, unknown>
): Promise<{ count: number }> {
  let q = supabase.from(table).delete();

  for (const [key, value] of Object.entries(filter)) {
    q = q.eq(key, value);
  }

  const { error, count } = await q;

  if (error) {
    console.error(`[DB Delete Error] ${table}:`, error);
    throw error;
  }

  return { count: count || 0 };
}

export async function testConnection(): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await supabase.from("voip_users").select("id").limit(1);
    if (error) throw error;
    return { ok: true };
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return { ok: false, error: errMsg };
  }
}