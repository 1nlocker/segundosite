-- Remover a política de RLS existente que está causando problemas
DROP POLICY IF EXISTS "Usuários podem ver seus próprios dados" ON "public"."usuarios";

-- Criar uma nova política que permite aos usuários ver apenas seus próprios dados
CREATE POLICY "Usuários podem ver seus próprios dados" 
ON "public"."usuarios"
FOR SELECT 
USING (auth.uid() = id);

-- Adicionar política para permitir aos usuários atualizar seus próprios dados
CREATE POLICY "Usuários podem atualizar seus próprios dados" 
ON "public"."usuarios"
FOR UPDATE
USING (auth.uid() = id);

-- Certificar que RLS está habilitado para a tabela
ALTER TABLE "public"."usuarios" ENABLE ROW LEVEL SECURITY; 