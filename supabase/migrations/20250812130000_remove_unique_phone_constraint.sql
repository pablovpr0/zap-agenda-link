-- Remover constraint única que está impedindo atualizações de clientes
-- O controle de duplicação será feito pela aplicação, não pelo banco

-- Remover a constraint única
ALTER TABLE clients 
DROP CONSTRAINT IF EXISTS unique_company_normalized_phone;

-- Manter apenas o índice para performance (sem unicidade)
CREATE INDEX IF NOT EXISTS idx_clients_company_normalized_phone_lookup 
ON clients(company_id, normalized_phone) 
WHERE normalized_phone IS NOT NULL;

-- Comentário explicativo
COMMENT ON TABLE clients IS 
'Controle de duplicação por telefone é feito pela aplicação. Um telefone = um cliente por empresa, mas controlado via código.';