# Portal de Desbloqueio de Celular

Sistema web para gerenciamento de serviços de desbloqueio de celular, com áreas de administrador e cliente.

## Tecnologias Utilizadas

- HTML5
- CSS3
- JavaScript (vanilla)
- Supabase (Banco de dados e autenticação)
- GitHub (Controle de versão)

## Estrutura do Projeto

```
/
├── assets/
│   ├── css/
│   │   ├── styles.css        # Estilos globais
│   │   └── auth.css          # Estilos para autenticação
│   ├── js/
│   │   ├── config.js         # Configuração do Supabase
│   │   ├── main.js           # JavaScript principal
│   │   └── auth.js           # JavaScript de autenticação
│   └── images/               # Imagens do site
├── pages/
│   ├── admin/                # Páginas administrativas
│   ├── cliente/              # Páginas do cliente
│   └── ...                   # Outras páginas
├── index.html                # Página inicial
├── supabase_schema.sql       # Esquema SQL para Supabase
└── README.md                 # Este arquivo
```

## Configuração do Projeto

### 1. Configuração do GitHub

1. Crie um novo repositório no GitHub.
2. Inicialize o repositório local e sincronize com o GitHub:

```bash
git init
git add .
git commit -m "Commit inicial"
git branch -M main
git remote add origin https://github.com/seu-usuario/portal-desbloqueio-celular.git
git push -u origin main
```

### 2. Configuração do Supabase

1. Crie uma conta no [Supabase](https://supabase.com/) caso ainda não tenha.
2. Crie um novo projeto no Supabase.
3. No painel do Supabase, vá para o SQL Editor e execute o script `supabase_schema.sql` completo.
4. Vá para "Authentication" > "Settings" e configure:
   - Habilite "Email Auth" para permitir cadastro/login com email e senha
   - Personalize os templates de email se desejar
   - Configure o redirecionamento de URL para sua aplicação

5. Vá para "Settings" > "API" e obtenha:
   - URL da API
   - Chave anon (public)
   
6. Atualize o arquivo `assets/js/config.js` com as suas credenciais do Supabase:

```javascript
const SUPABASE_URL = 'https://sua-url-do-projeto.supabase.co';
const SUPABASE_KEY = 'sua-chave-anon-key';
```

### 3. Configurando um Usuário Administrador

Para criar o primeiro usuário administrador, você pode:

1. Registre-se normalmente através da interface do site
2. No SQL Editor do Supabase, execute o seguinte comando para promover seu usuário a administrador:

```sql
UPDATE public.usuarios 
SET role = 'admin' 
WHERE email = 'seu-email@exemplo.com';
```

## Executando o Projeto

Por ser um projeto com HTML, CSS e JavaScript puro, você pode:

1. Abrir diretamente o arquivo `index.html` em seu navegador para testes locais.
2. Para ambiente de produção, fazer deploy em qualquer serviço de hospedagem estática como:
   - GitHub Pages
   - Netlify
   - Vercel
   - Firebase Hosting
   - etc.

## Funcionalidades Implementadas

### Área do Administrador
- Dashboard administrativo
- Gerenciamento de serviços
- Gerenciamento de categorias
- Gestão de pedidos

### Área do Cliente
- Cadastro e login
- Visualização de serviços
- Realização de pedidos
- Acompanhamento de status dos pedidos

## Próximos Passos

- Implementar sistema de notificações
- Adicionar chat em tempo real
- Incluir sistema de avaliações
- Integrar métodos de pagamento 