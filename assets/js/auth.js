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

// Verifica se o usuário está logado em páginas protegidas
async function verificarPaginaProtegida() {
    // Lista de páginas que requerem autenticação
    const paginasProtegidas = [
        'painel.html', 
        'pedidos.html', 
        'perfil.html'
    ];
    
    // Lista de páginas que requerem autenticação de admin
    const paginasAdmin = [
        'dashboard.html', 
        'servicos-admin.html', 
        'categorias.html', 
        'pedidos-admin.html',
        'usuarios.html'
    ];
    
    // Obtém o nome da página atual
    const paginaAtual = window.location.pathname.split('/').pop();
    
    // Verifica se a página atual requer autenticação
    if (paginasProtegidas.includes(paginaAtual) || paginasAdmin.includes(paginaAtual)) {
        try {
            const user = await verificarAutenticacao();
            
            // Se não estiver logado, redireciona para login
            if (!user) {
                redirecionarParaLogin();
                return;
            }
            
            // Para páginas de admin, verifica se o usuário é admin
            if (paginasAdmin.includes(paginaAtual)) {
                const isAdmin = await verificarAdmin(user.id);
                
                if (!isAdmin) {
                    // Redireciona para painel do cliente se não for admin
                    window.location.href = '../cliente/painel.html';
                }
            }
        } catch (error) {
            console.error('Erro ao verificar autenticação:', error);
            redirecionarParaLogin();
        }
    }
}

// Função para mostrar mensagem de erro no formulário
function mostrarMensagemErro(mensagem) {
    const container = document.querySelector('.auth-card');
    
    const msgElement = document.createElement('div');
    msgElement.className = 'auth-message error';
    msgElement.textContent = mensagem;
    
    // Insere no início do contêiner
    container.insertBefore(msgElement, container.firstChild);
}

// Função para mostrar mensagem de sucesso no formulário
function mostrarMensagemSucesso(mensagem) {
    const container = document.querySelector('.auth-card');
    
    const msgElement = document.createElement('div');
    msgElement.className = 'auth-message success';
    msgElement.textContent = mensagem;
    
    // Insere no início do contêiner
    container.insertBefore(msgElement, container.firstChild);
}

// Função para limpar mensagens
function limparMensagens() {
    document.querySelectorAll('.auth-message').forEach(msg => msg.remove());
} 