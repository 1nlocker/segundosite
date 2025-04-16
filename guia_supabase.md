# Guia de Configuração do Supabase

Este guia apresenta os passos para configurar corretamente o Supabase para o Portal de Desbloqueio de Celular.

## 1. Acesso ao Supabase

1. Acesse sua conta no [Supabase](https://app.supabase.io/)
2. Selecione o projeto correspondente ao Portal de Desbloqueio de Celular ou crie um novo projeto

## 2. Executando o Esquema SQL

1. No menu lateral, clique em **SQL Editor**
2. Clique em **+ New Query**
3. Copie todo o conteúdo do arquivo `supabase_schema.sql` do projeto
4. Cole o conteúdo no editor SQL
5. Clique em **RUN** para executar o script

![Supabase SQL Editor](https://supabase.com/docs/img/reference/javascript/query-raw.png)

## 3. Configurando as Políticas de Segurança (RLS)

Para garantir que as políticas de segurança estejam corretamente configuradas:

1. No menu lateral, clique em **SQL Editor**
2. Clique em **+ New Query**
3. Copie todo o conteúdo do arquivo `post_install_rls.sql` do projeto
4. Cole o conteúdo no editor SQL
5. Clique em **RUN** para executar o script

Este script configura todas as políticas de segurança (RLS) necessárias para que a aplicação funcione corretamente, garantindo que:
- Os usuários só possam acessar seus próprios dados
- Administradores tenham acesso a todos os dados necessários
- As tabelas de categorias e serviços sejam acessíveis publicamente

## 4. Verificação da Instalação

Para verificar se o esquema foi criado corretamente:

1. No menu lateral, clique em **Table Editor**
2. Você deve ver as seguintes tabelas:
   - `usuarios`
   - `categorias`
   - `servicos`
   - `pedidos`
   - `itens_pedido`
   - `historico_status`

3. Para verificar as políticas RLS, clique em **Authentication** > **Policies**
   - Cada tabela deve ter as políticas correspondentes conforme definido no script

## 5. Configuração da Autenticação

1. No menu lateral, clique em **Authentication** > **Providers**
2. Habilite o método **Email**:
   - Desmarque a opção "Secure email template" para testes
   - Marque a opção "Confirm email" para produção

3. Configure as URLs de redirecionamento:
   - Vá para **URL Configuration**
   - Adicione sua URL base, por exemplo: `http://localhost:3000`
   - Adicione URLs específicas para redirecionamento após login/registro:
     - `http://localhost:3000/pages/cliente/callback.html`
     - `http://seudominio.com/pages/cliente/callback.html` (para produção)

## 6. Criação de Usuário Administrador

Para criar um usuário administrador:

1. Crie uma conta normalmente através da interface do site
2. Após criar a conta, acesse o **SQL Editor** no Supabase
3. Execute o seguinte comando SQL (substituindo pelo email real):

```sql
UPDATE public.usuarios 
SET role = 'admin' 
WHERE email = 'seu-email@exemplo.com';
```

## 7. Teste de Integração

Para verificar se tudo está funcionando conforme esperado:

1. Execute a aplicação localmente usando `npm start`
2. Tente criar uma nova conta de usuário
3. Verifique se o registro de usuário está funcionando corretamente
4. Navegue pelas categorias e serviços disponíveis
5. Crie um pedido de teste

## Solução de Problemas

### Erro de Migração SQL

Se encontrar erros ao executar o script SQL:

1. Execute o script em partes menores
2. Verifique se não há conflitos com tabelas existentes
3. Se necessário, use `DROP TABLE` para limpar tabelas existentes antes de recriar:

```sql
DROP TABLE IF EXISTS public.historico_status;
DROP TABLE IF EXISTS public.itens_pedido;
DROP TABLE IF EXISTS public.pedidos;
DROP TABLE IF EXISTS public.servicos;
DROP TABLE IF EXISTS public.categorias;
DROP TABLE IF EXISTS public.usuarios;
```

### Erro de Conexão

Se o site não conseguir conectar ao Supabase:

1. Verifique se as credenciais no arquivo `.env` estão corretas
2. Confirme se o projeto Supabase está ativo
3. Verifique as configurações de CORS no Supabase:
   - Vá para **Settings** > **API**
   - Configure o cabeçalho `Access-Control-Allow-Origin` com sua URL

### Erro na Criação de Usuários

Se os usuários não estiverem sendo criados corretamente:

1. Verifique se o trigger de criação automática está funcionando:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```

2. Se necessário, recrie o trigger manualmente usando o script `post_install_rls.sql`

## Links Úteis

- [Documentação do Supabase](https://supabase.com/docs)
- [Referência JavaScript do Supabase](https://supabase.com/docs/reference/javascript)
- [Guia de Políticas RLS](https://supabase.com/docs/guides/auth/row-level-security) 