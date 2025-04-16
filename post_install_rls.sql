-- Script para ajustar as políticas de RLS após instalação principal
-- Executar este script após o supabase_schema.sql

-- Garantir que RLS está habilitado em todas as tabelas
ALTER TABLE "public"."usuarios" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."categorias" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."servicos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."pedidos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."itens_pedido" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."historico_status" ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso anônimo a categorias (leitura)
DROP POLICY IF EXISTS "Acesso público de leitura para categorias" ON "public"."categorias";
CREATE POLICY "Acesso público de leitura para categorias"
ON "public"."categorias"
FOR SELECT
TO PUBLIC
USING (true);

-- Política para permitir acesso anônimo a serviços (leitura)
DROP POLICY IF EXISTS "Acesso público de leitura para serviços" ON "public"."servicos";
CREATE POLICY "Acesso público de leitura para serviços"
ON "public"."servicos"
FOR SELECT
TO PUBLIC
USING (true);

-- Política para permitir aos usuários ver seus próprios pedidos
DROP POLICY IF EXISTS "Usuários podem ver seus próprios pedidos" ON "public"."pedidos";
CREATE POLICY "Usuários podem ver seus próprios pedidos"
ON "public"."pedidos"
FOR SELECT
USING (auth.uid() = usuario_id);

-- Política para permitir aos usuários criar pedidos
DROP POLICY IF EXISTS "Usuários podem criar pedidos" ON "public"."pedidos";
CREATE POLICY "Usuários podem criar pedidos"
ON "public"."pedidos"
FOR INSERT
WITH CHECK (auth.uid() = usuario_id);

-- Política para permitir aos administradores ver todos os pedidos
DROP POLICY IF EXISTS "Administradores podem ver todos os pedidos" ON "public"."pedidos";
CREATE POLICY "Administradores podem ver todos os pedidos"
ON "public"."pedidos"
FOR SELECT
USING (
    auth.uid() IN (
        SELECT id FROM public.usuarios WHERE role = 'admin'
    )
);

-- Política para permitir aos administradores atualizar pedidos
DROP POLICY IF EXISTS "Administradores podem atualizar pedidos" ON "public"."pedidos";
CREATE POLICY "Administradores podem atualizar pedidos"
ON "public"."pedidos"
FOR UPDATE
USING (
    auth.uid() IN (
        SELECT id FROM public.usuarios WHERE role = 'admin'
    )
);

-- Política para itens de pedido (leitura pelo usuário)
DROP POLICY IF EXISTS "Usuários podem ver itens de seus pedidos" ON "public"."itens_pedido";
CREATE POLICY "Usuários podem ver itens de seus pedidos"
ON "public"."itens_pedido"
FOR SELECT
USING (
    pedido_id IN (
        SELECT id FROM public.pedidos WHERE usuario_id = auth.uid()
    )
);

-- Política para permitir aos usuários inserir itens em seus pedidos
DROP POLICY IF EXISTS "Usuários podem inserir itens em seus pedidos" ON "public"."itens_pedido";
CREATE POLICY "Usuários podem inserir itens em seus pedidos"
ON "public"."itens_pedido"
FOR INSERT
WITH CHECK (
    pedido_id IN (
        SELECT id FROM public.pedidos WHERE usuario_id = auth.uid()
    )
);

-- Política para administradores verem todos os itens de pedidos
DROP POLICY IF EXISTS "Administradores podem ver todos os itens de pedidos" ON "public"."itens_pedido";
CREATE POLICY "Administradores podem ver todos os itens de pedidos"
ON "public"."itens_pedido"
FOR SELECT
USING (
    auth.uid() IN (
        SELECT id FROM public.usuarios WHERE role = 'admin'
    )
);

-- Política para histórico de status (leitura pelo usuário)
DROP POLICY IF EXISTS "Usuários podem ver histórico de seus pedidos" ON "public"."historico_status";
CREATE POLICY "Usuários podem ver histórico de seus pedidos"
ON "public"."historico_status"
FOR SELECT
USING (
    pedido_id IN (
        SELECT id FROM public.pedidos WHERE usuario_id = auth.uid()
    )
);

-- Política para administradores verem todo o histórico
DROP POLICY IF EXISTS "Administradores podem ver todo o histórico" ON "public"."historico_status";
CREATE POLICY "Administradores podem ver todo o histórico"
ON "public"."historico_status"
FOR SELECT
USING (
    auth.uid() IN (
        SELECT id FROM public.usuarios WHERE role = 'admin'
    )
);

-- Certifique-se de que a função de gatilho está funcionando
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.usuarios (id, nome, email, role)
  VALUES (new.id, new.raw_user_meta_data->>'nome', new.email, 'cliente');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Adiciona o gatilho para criar um registro de usuário quando um usuário auth é criado
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 