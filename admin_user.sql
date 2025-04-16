-- Primeiro, vamos inserir um usuário no sistema de autenticação do Supabase
-- Você terá que primeiro registrar o usuário pelo site ou pela interface do Supabase
-- Após o registro, pegue o ID do usuário e use-o na consulta abaixo

-- ATENÇÃO: Após registrar o usuário pelo site ou pela interface do Supabase Auth, 
-- execute este comando substituindo o UUID pela ID do usuário

-- Para verificar se o usuário já existe na tabela auth.users:
SELECT * FROM auth.users WHERE email = '1nlocker.ia@gmail.com';

-- Se o usuário não existir na tabela usuarios, mas existir em auth.users, 
-- execute isto (substituindo o UUID correto):
INSERT INTO public.usuarios (id, nome, email, telefone, role)
VALUES 
    ('UUID_DO_USUARIO_AUTH', 'Administrador', '1nlocker.ia@gmail.com', '(00) 00000-0000', 'admin');

-- OU, se o usuário já existir na tabela usuarios, simplesmente faça o update:
UPDATE public.usuarios 
SET role = 'admin' 
WHERE email = '1nlocker.ia@gmail.com';

-- Verifique se o usuário foi registrado corretamente:
SELECT * FROM public.usuarios WHERE email = '1nlocker.ia@gmail.com'; 