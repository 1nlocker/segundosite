# Portal de Desbloqueio de Celular

Sistema web para gerenciamento de serviços de desbloqueio de celular, com áreas de administrador e cliente.

## Tecnologias Utilizadas

- HTML5
- CSS3
- JavaScript (vanilla)
- Supabase (Banco de dados e autenticação)
- GitHub (Controle de versão)
- Service Worker (Funcionalidades offline)
- PWA (Progressive Web App)

## Estrutura do Projeto

```
/
├── assets/
│   ├── css/
│   │   ├── styles.css        # Estilos globais
│   │   ├── auth.css          # Estilos para autenticação
│   │   ├── admin.css         # Estilos para área administrativa
│   │   └── cliente.css       # Estilos para área do cliente
│   ├── js/
│   │   ├── config.js         # Configuração do Supabase
│   │   ├── main.js           # JavaScript principal
│   │   ├── auth.js           # JavaScript de autenticação
│   │   ├── admin.js          # JavaScript da área administrativa
│   │   ├── cliente.js        # JavaScript da área do cliente
│   │   └── dashboard.js      # JavaScript do dashboard
│   ├── images/               # Imagens do site
│   └── favicon/              # Ícones e favicons
├── pages/
│   ├── admin/
│   │   └── dashboard.html    # Dashboard administrativo
│   └── cliente/
│       ├── login.html        # Página de login
│       ├── cadastro.html     # Página de cadastro
│       ├── painel.html       # Painel do cliente
│       └── callback.html     # Callback de autenticação
├── index.html                # Página inicial
├── admin.html                # Página administrativa
├── cliente.html              # Página do cliente
├── offline.html              # Página para modo offline
├── serviceWorker.js          # Service Worker para funcionalidades offline
├── manifest.json             # Configuração do PWA
├── .env                      # Variáveis de ambiente (não versionado)
├── .env.example              # Exemplo de variáveis de ambiente
├── package.json              # Configuração de dependências e scripts
├── supabase_schema.sql       # Esquema SQL para Supabase
└── README.md                 # Este arquivo
```

## Configuração do Projeto

### 1. Configuração do Ambiente

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/portal-desbloqueio-celular.git
cd portal-desbloqueio-celular
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```
Edite o arquivo `.env` com suas credenciais do Supabase.

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
   
6. Atualize o arquivo `.env` com suas credenciais do Supabase.

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

### Desenvolvimento

Para executar o projeto em ambiente de desenvolvimento:

```bash
npm start
```

Isso iniciará um servidor local na porta 5000. Acesse [http://localhost:5000](http://localhost:5000) para visualizar o site.

### Build para Produção

Para gerar uma versão otimizada para produção:

```bash
npm run build
```

Os arquivos otimizados serão gerados na pasta `dist/`.

### Deploy

Para fazer o deploy usando GitHub Pages:

```bash
npm run deploy
```

## Recursos PWA

O site funciona como um Progressive Web App (PWA), o que significa que:

- Pode ser instalado na tela inicial de dispositivos móveis
- Funciona offline (recursos limitados)
- Tem uma experiência semelhante a um aplicativo nativo

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
- Melhorar a experiência offline
- Implementar testes automatizados 