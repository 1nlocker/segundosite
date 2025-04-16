// Aguarda o carregamento do DOM
document.addEventListener('DOMContentLoaded', () => {
    // Se estiver na página de login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Se estiver na página de cadastro
    const cadastroForm = document.getElementById('cadastro-form');
    if (cadastroForm) {
        cadastroForm.addEventListener('submit', handleCadastro);
    }
    
    // Se estiver na página de recuperação de senha
    const recuperarSenhaForm = document.getElementById('recuperar-senha-form');
    if (recuperarSenhaForm) {
        recuperarSenhaForm.addEventListener('submit', handleRecuperarSenha);
    }
    
    // Adiciona evento ao botão de login com Google
    const googleLoginBtn = document.getElementById('google-login');
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', handleGoogleLogin);
    }
    
    // Verifica se o usuário está logado em páginas protegidas
    verificarPaginaProtegida();
});

// Função para lidar com o login
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Remove mensagens de erro anteriores
    limparMensagens();
    
    try {
        // Tenta fazer login no Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) throw error;
        
        // Redireciona com base no tipo de usuário
        const { data: userData, error: userError } = await supabase
            .from('usuarios')
            .select('role')
            .eq('id', data.user.id)
            .single();
            
        if (userError) throw userError;
        
        if (userData.role === 'admin') {
            window.location.href = '../admin/dashboard.html';
        } else {
            window.location.href = 'painel.html';
        }
        
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        mostrarMensagemErro('Email ou senha incorretos. Tente novamente.');
    }
}

// Função para lidar com o login via Google
async function handleGoogleLogin() {
    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/pages/cliente/callback.html'
            }
        });
        
        if (error) throw error;
        
    } catch (error) {
        console.error('Erro ao fazer login com Google:', error);
        mostrarMensagemErro('Erro ao fazer login com Google. Tente novamente.');
    }
}

// Função para processar o login após redirecionamento do provedor OAuth
async function processOAuthCallback() {
    // Esta função será chamada na página de callback
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
        console.error('Erro ao processar autenticação:', error);
        window.location.href = '/pages/cliente/login.html';
        return;
    }
    
    if (data?.session) {
        // Verifica se é um novo usuário para salvar na tabela usuarios
        const { data: userData, error: userError } = await supabase
            .from('usuarios')
            .select('*')
            .eq('id', data.session.user.id)
            .single();
            
        if (userError && userError.code === 'PGRST116') {
            // Usuário não existe na tabela, então é novo
            const novoUsuario = {
                id: data.session.user.id,
                nome: data.session.user.user_metadata.full_name || data.session.user.email.split('@')[0],
                email: data.session.user.email,
                role: 'cliente',
                created_at: new Date().toISOString()
            };
            
            const { error: insertError } = await supabase
                .from('usuarios')
                .insert([novoUsuario]);
                
            if (insertError) console.error('Erro ao registrar usuário:', insertError);
        }
        
        // Redireciona com base no tipo de usuário
        const { data: roleData, error: roleError } = await supabase
            .from('usuarios')
            .select('role')
            .eq('id', data.session.user.id)
            .single();
            
        if (roleData?.role === 'admin') {
            window.location.href = '/pages/admin/dashboard.html';
        } else {
            window.location.href = '/pages/cliente/painel.html';
        }
    } else {
        window.location.href = '/pages/cliente/login.html';
    }
}

// Função para lidar com o cadastro
async function handleCadastro(event) {
    event.preventDefault();
    
    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const telefone = document.getElementById('telefone').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    // Remove mensagens de erro anteriores
    limparMensagens();
    
    // Verifica se as senhas conferem
    if (password !== confirmPassword) {
        mostrarMensagemErro('As senhas não conferem.');
        return;
    }
    
    try {
        // Registra o usuário no Supabase Auth
        const { data, error } = await supabase.auth.signUp({
            email,
            password
        });
        
        if (error) throw error;
        
        // Salva informações adicionais do usuário na tabela "usuarios"
        const { error: profileError } = await supabase
            .from('usuarios')
            .insert([
                {
                    id: data.user.id,
                    nome: nome,
                    email: email,
                    telefone: telefone,
                    role: 'cliente', // Papel padrão é cliente
                    created_at: new Date().toISOString()
                }
            ]);
            
        if (profileError) throw profileError;
        
        // Mostra mensagem de sucesso
        mostrarMensagemSucesso('Cadastro realizado com sucesso! Verifique seu email para confirmar sua conta.');
        
        // Limpa o formulário
        document.getElementById('cadastro-form').reset();
        
    } catch (error) {
        console.error('Erro ao cadastrar:', error);
        mostrarMensagemErro('Erro ao realizar cadastro. ' + error.message);
    }
}

// Função para lidar com a recuperação de senha
async function handleRecuperarSenha(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    
    // Remove mensagens de erro anteriores
    limparMensagens();
    
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/pages/cliente/redefinir-senha.html'
        });
        
        if (error) throw error;
        
        // Mostra mensagem de sucesso
        mostrarMensagemSucesso('Enviamos um email com instruções para redefinir sua senha. Verifique sua caixa de entrada.');
        
        // Limpa o formulário
        document.getElementById('recuperar-senha-form').reset();
        
    } catch (error) {
        console.error('Erro ao recuperar senha:', error);
        mostrarMensagemErro('Erro ao solicitar redefinição de senha. ' + error.message);
    }
}

// Função para verificar se a página atual é protegida e requer autenticação
async function verificarPaginaProtegida() {
    const paginasProtegidas = [
        '/pages/cliente/painel.html',
        '/pages/admin/dashboard.html'
    ];
    
    // Verifica se a página atual está na lista de páginas protegidas
    const paginaAtual = window.location.pathname;
    const ehPaginaProtegida = paginasProtegidas.some(pagina => paginaAtual.endsWith(pagina));
    
    if (ehPaginaProtegida) {
        const user = await verificarAutenticacao();
        
        if (!user) {
            // Usuário não está autenticado, redireciona para o login
            redirecionarParaLogin();
            return;
        }
        
        // Se for uma página de admin, verifica se o usuário é administrador
        if (paginaAtual.includes('/admin/')) {
            const ehAdmin = await verificarAdmin(user.id);
            
            if (!ehAdmin) {
                // Usuário não é administrador, redireciona para o painel de cliente
                window.location.href = '/pages/cliente/painel.html';
            }
        }
    }
}

// Função para mostrar mensagem de erro
function mostrarMensagemErro(mensagem) {
    const messageContainer = document.querySelector('.message-container');
    
    if (!messageContainer) {
        // Cria o container de mensagem se não existir
        const container = document.createElement('div');
        container.className = 'message-container';
        
        const message = document.createElement('div');
        message.className = 'message error';
        message.textContent = mensagem;
        
        container.appendChild(message);
        
        // Adiciona o container antes do formulário
        const form = document.querySelector('form');
        form.parentNode.insertBefore(container, form);
    } else {
        // Atualiza o container existente
        const message = document.createElement('div');
        message.className = 'message error';
        message.textContent = mensagem;
        
        messageContainer.innerHTML = '';
        messageContainer.appendChild(message);
    }
}

// Função para mostrar mensagem de sucesso
function mostrarMensagemSucesso(mensagem) {
    const messageContainer = document.querySelector('.message-container');
    
    if (!messageContainer) {
        // Cria o container de mensagem se não existir
        const container = document.createElement('div');
        container.className = 'message-container';
        
        const message = document.createElement('div');
        message.className = 'message success';
        message.textContent = mensagem;
        
        container.appendChild(message);
        
        // Adiciona o container antes do formulário
        const form = document.querySelector('form');
        form.parentNode.insertBefore(container, form);
    } else {
        // Atualiza o container existente
        const message = document.createElement('div');
        message.className = 'message success';
        message.textContent = mensagem;
        
        messageContainer.innerHTML = '';
        messageContainer.appendChild(message);
    }
}

// Função para limpar mensagens
function limparMensagens() {
    const messageContainer = document.querySelector('.message-container');
    
    if (messageContainer) {
        messageContainer.innerHTML = '';
    }
} 