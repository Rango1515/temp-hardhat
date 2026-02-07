-- Add purpose column to distinguish partner signup tokens from client referral links
ALTER TABLE voip_partner_tokens ADD COLUMN purpose text NOT NULL DEFAULT 'client_referral';

-- Mark existing partner signup tokens (the first token per partner with max_uses=1)
UPDATE voip_partner_tokens t
SET purpose = 'partner_signup'
WHERE t.max_uses = 1
AND t.id = (
  SELECT MIN(t2.id) FROM voip_partner_tokens t2 WHERE t2.partner_id = t.partner_id
);