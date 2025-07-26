-- Substituir completamente as políticas RLS da tabela `clients`
-- Certifique-se de que o RLS está ativado
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Remover todas as políticas existentes (se necessário)
DROP POLICY IF EXISTS "Inserir Cliente Público" ON clients;
DROP POLICY IF EXISTS "Companies can manage their clients" ON clients;
DROP POLICY IF EXISTS "Selecionar Cliente" ON clients;
DROP POLICY IF EXISTS "Atualizar Cliente" ON clients;
DROP POLICY IF EXISTS "Excluir Cliente" ON clients;

-- Política para INSERT público (clientes sem login)
CREATE POLICY "Inserir Cliente Público"
ON clients
FOR INSERT
TO public
WITH CHECK (true);

-- Política para SELECT somente para o comerciante autenticado
CREATE POLICY "Selecionar Cliente"
ON clients
FOR SELECT
TO authenticated
USING (auth.uid() = company_id);

-- Política para UPDATE somente para o comerciante autenticado
CREATE POLICY "Atualizar Cliente"
ON clients
FOR UPDATE
TO authenticated
USING (auth.uid() = company_id)
WITH CHECK (auth.uid() = company_id);

-- Política para DELETE somente para o comerciante autenticado
CREATE POLICY "Excluir Cliente"
ON clients
FOR DELETE
TO authenticated
USING (auth.uid() = company_id);