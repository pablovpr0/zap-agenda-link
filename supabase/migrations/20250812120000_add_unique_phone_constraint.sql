-- Adicionar constraint única para telefone normalizado por empresa
-- Isso previne duplicação de clientes com mesmo telefone

-- Primeiro, limpar possíveis duplicatas existentes
-- Manter apenas o cliente mais antigo para cada telefone duplicado
WITH duplicates AS (
  SELECT 
    company_id,
    normalized_phone,
    MIN(created_at) as first_created
  FROM clients 
  WHERE normalized_phone IS NOT NULL
  GROUP BY company_id, normalized_phone
  HAVING COUNT(*) > 1
),
to_delete AS (
  SELECT c.id
  FROM clients c
  INNER JOIN duplicates d ON c.company_id = d.company_id 
    AND c.normalized_phone = d.normalized_phone
    AND c.created_at > d.first_created
)
DELETE FROM clients WHERE id IN (SELECT id FROM to_delete);

-- Agora adicionar constraint única
ALTER TABLE clients 
ADD CONSTRAINT unique_company_normalized_phone 
UNIQUE (company_id, normalized_phone);

-- Comentário explicativo
COMMENT ON CONSTRAINT unique_company_normalized_phone ON clients IS 
'Garante que cada empresa tenha apenas um cliente por telefone normalizado, evitando duplicação';