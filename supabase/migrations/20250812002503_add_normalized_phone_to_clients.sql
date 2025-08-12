-- Add normalized_phone column to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS normalized_phone TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_clients_normalized_phone ON clients(company_id, normalized_phone);

-- Create index for company_id and normalized_phone combination
CREATE INDEX IF NOT EXISTS idx_clients_company_normalized_phone ON clients(company_id, normalized_phone) WHERE normalized_phone IS NOT NULL;