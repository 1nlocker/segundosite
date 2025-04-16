// Importando configurações e funções do Supabase
import { SUPABASE_URL, SUPABASE_KEY, verificarAutenticacao, verificarAdmin, redirecionarParaLogin } from './config.js';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Inicializando o cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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
    let telefone = document.getElementById('telefone').value;
    const password = document.getElementById('password').value;
    
    // Remove mensagens de erro anteriores
    limparMensagens();
    
    // Formata o telefone para o padrão (00) 00000-0000
    telefone = formatarTelefone(telefone);
    
    // Valida o telefone
    if (!validarTelefone(telefone)) {
        mostrarMensagemErro('Número de telefone inválido. Use o formato (00) 00000-0000.');
        return;
    }
    
    try {
        // Tenta fazer login no Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) throw error;
        
        // Verifica o telefone cadastrado
        const { data: userData, error: userError } = await supabase
            .from('usuarios')
            .select('role, telefone')
            .eq('id', data.user.id)
            .single();
            
        if (userError) throw userError;
        
        // Formata o telefone do banco para comparar
        const telefoneBanco = formatarTelefone(userData.telefone);
        
        // Verifica se o telefone corresponde ao usuário (após formatação)
        if (telefoneBanco !== telefone) {
            mostrarMensagemErro('O telefone informado não corresponde ao cadastrado para este usuário.');
            return;
        }
        
        // Redireciona com base no tipo de usuário
        if (userData.role === 'admin') {
            window.location.href = '../admin/dashboard.html';
        } else {
            window.location.href = 'painel.html';
        }
        
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        mostrarMensagemErro('Email, telefone ou senha incorretos. Tente novamente.');
    }
}

// Função para validar telefone brasileiro (aceita vários formatos)
function validarTelefone(telefone) {
    // Remove espaços em branco, parênteses, traços e outros caracteres especiais
    const numeroLimpo = telefone.replace(/\D/g, '');
    
    // Verifica se o número tem entre 10 e 11 dígitos (com ou sem DDD)
    if (numeroLimpo.length < 10 || numeroLimpo.length > 11) {
        return false;
    }
    
    return true;
}

// Função para formatar o telefone no padrão (00) 00000-0000 ou (00) 0000-0000
function formatarTelefone(telefone) {
    // Remove todos os caracteres não numéricos
    const numeroLimpo = telefone.replace(/\D/g, '');
    
    // Se o telefone não tiver o tamanho adequado, retorna o original
    if (numeroLimpo.length < 10 || numeroLimpo.length > 11) {
        return telefone;
    }
    
    // Formata para (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
    if (numeroLimpo.length === 11) {
        return `(${numeroLimpo.substring(0, 2)}) ${numeroLimpo.substring(2, 7)}-${numeroLimpo.substring(7)}`;
    } else {
        return `(${numeroLimpo.substring(0, 2)}) ${numeroLimpo.substring(2, 6)}-${numeroLimpo.substring(6)}`;
    }
}

// Função para lidar com o login via Google
async function handleGoogleLogin() {
    try {
        console.log("Iniciando login com Google...");
        
        // Mostrar um feedback visual para o usuário
        mostrarMensagemSucesso("Redirecionando para autenticação do Google...");
        
        const redirectUrl = window.location.origin + '/pages/cliente/callback.html';
        console.log("URL de redirecionamento:", redirectUrl);
        
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: redirectUrl,
                queryParams: {
                    // Salvamos esta info para saber que precisamos solicitar telefone na callback
                    requires_phone: 'true'
                }
            }
        });
        
        if (error) {
            console.error("Erro detalhado:", error);
            throw error;
        }
        
        console.log("Resposta do login:", data);
        
    } catch (error) {
        console.error('Erro ao fazer login com Google:', error);
        mostrarMensagemErro('Erro ao fazer login com Google: ' + error.message);
    }
}

// Função para processar o login após redirecionamento do provedor OAuth
export async function processOAuthCallback() {
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
            
        const isNewUser = userError && userError.code === 'PGRST116';
        
        const url = new URL(window.location.href);
        const requiresPhone = url.searchParams.get('requires_phone') === 'true';
        
        // Se é novo usuário ou se requer telefone, solicita o telefone
        if (isNewUser || requiresPhone) {
            // Mostra um formulário para solicitar o telefone
            mostrarFormularioTelefone(data.session.user);
            return;
        }
            
        if (isNewUser) {
            // Usuário não existe na tabela, então é novo
            const novoUsuario = {
                id: data.session.user.id,
                nome: data.session.user.user_metadata.full_name || data.session.user.email.split('@')[0],
                email: data.session.user.email,
                telefone: '', // Telefone vazio temporariamente
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

// Função para mostrar o formulário de telefone após login com Google
function mostrarFormularioTelefone(user) {
    // Esconde o loader
    document.querySelector('.loader')?.remove();
    
    // Pega o container de autenticação
    const authCard = document.querySelector('.auth-card');
    
    // Limpa o conteúdo atual
    authCard.innerHTML = `
        <h2>Complete seu cadastro</h2>
        <p>Por favor, informe seu telefone para continuar:</p>
        <form id="telefone-form">
            <div class="form-group">
                <label for="telefone">Telefone</label>
                <input type="tel" id="telefone" name="telefone" placeholder="(00) 00000-0000" required>
                <small class="form-hint">Formatos aceitos: 00000000000, (00) 00000-0000, 00 00000-0000</small>
            </div>
            <div class="form-actions">
                <button type="submit" class="btn-primary">Continuar</button>
            </div>
        </form>
    `;
    
    // Adiciona o evento de submit ao formulário
    const telefoneForm = document.getElementById('telefone-form');
    telefoneForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        let telefone = document.getElementById('telefone').value;
        
        // Formata o telefone
        telefone = formatarTelefone(telefone);
        
        // Valida o telefone
        if (!validarTelefone(telefone)) {
            mostrarMensagemErro('Número de telefone inválido. O número deve ter entre 10 e 11 dígitos incluindo DDD.');
            return;
        }
        
        try {
            // Verifica se o usuário já existe na tabela usuarios
            const { data: userData, error: userError } = await supabase
                .from('usuarios')
                .select('*')
                .eq('id', user.id)
                .single();
                
            if (userError && userError.code === 'PGRST116') {
                // Usuário não existe, insere
                const { error: insertError } = await supabase
                    .from('usuarios')
                    .insert([{
                        id: user.id,
                        nome: user.user_metadata.full_name || user.email.split('@')[0],
                        email: user.email,
                        telefone: telefone,
                        role: 'cliente',
                        created_at: new Date().toISOString()
                    }]);
                    
                if (insertError) throw insertError;
            } else {
                // Usuário existe, atualiza o telefone
                const { error: updateError } = await supabase
                    .from('usuarios')
                    .update({ telefone: telefone })
                    .eq('id', user.id);
                    
                if (updateError) throw updateError;
            }
            
            // Redireciona com base no tipo de usuário
            const { data: roleData, error: roleError } = await supabase
                .from('usuarios')
                .select('role')
                .eq('id', user.id)
                .single();
                
            if (roleData?.role === 'admin') {
                window.location.href = '/pages/admin/dashboard.html';
            } else {
                window.location.href = '/pages/cliente/painel.html';
            }
        } catch (error) {
            console.error('Erro ao salvar telefone:', error);
            mostrarMensagemErro('Erro ao salvar telefone. Por favor, tente novamente.');
        }
    });
}

// Função para lidar com o cadastro
async function handleCadastro(event) {
    event.preventDefault();
    
    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    let telefone = document.getElementById('telefone').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    // Remove mensagens de erro anteriores
    limparMensagens();
    
    // Formata o telefone
    telefone = formatarTelefone(telefone);
    
    // Valida o telefone
    if (!validarTelefone(telefone)) {
        mostrarMensagemErro('Número de telefone inválido. O número deve ter entre 10 e 11 dígitos incluindo DDD.');
        return;
    }
    
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
    mostrarMensagem(mensagem, 'erro');
}

// Função para mostrar mensagem de sucesso
function mostrarMensagemSucesso(mensagem) {
    mostrarMensagem(mensagem, 'sucesso');
}

// Função para mostrar mensagem
function mostrarMensagem(mensagem, tipo = 'info', tempo = 5000) {
    // Criar elemento de mensagem se não existir
    let mensagemEl = document.getElementById('mensagem-flutuante');
    
    if (!mensagemEl) {
        mensagemEl = document.createElement('div');
        mensagemEl.id = 'mensagem-flutuante';
        document.body.appendChild(mensagemEl);
    }
    
    // Definir ícone baseado no tipo
    let icone = '';
    switch (tipo) {
        case 'sucesso':
            icone = '<i class="fas fa-check-circle"></i>';
            break;
        case 'erro':
            icone = '<i class="fas fa-exclamation-circle"></i>';
            break;
        case 'alerta':
            icone = '<i class="fas fa-exclamation-triangle"></i>';
            break;
        default: // info
            icone = '<i class="fas fa-info-circle"></i>';
            break;
    }
    
    // Atualizar conteúdo e classe
    mensagemEl.innerHTML = `${icone} <span>${mensagem}</span>`;
    mensagemEl.className = `mensagem-flutuante ${tipo}`;
    mensagemEl.style.display = 'flex';
    
    // Botão para fechar
    const btnFechar = document.createElement('button');
    btnFechar.className = 'btn-fechar-mensagem';
    btnFechar.innerHTML = '&times;';
    btnFechar.addEventListener('click', () => {
        mensagemEl.style.opacity = '0';
        setTimeout(() => {
            mensagemEl.style.display = 'none';
        }, 300);
    });
    mensagemEl.appendChild(btnFechar);
    
    // Resetar animação anterior se existir
    clearTimeout(mensagemEl.timeoutId);
    mensagemEl.style.opacity = '0';
    
    // Animar aparecimento
    setTimeout(() => {
        mensagemEl.style.opacity = '1';
        
        // Configurar desaparecimento após o tempo definido
        mensagemEl.timeoutId = setTimeout(() => {
            mensagemEl.style.opacity = '0';
            
            // Ocultar completamente após a transição
            setTimeout(() => {
                mensagemEl.style.display = 'none';
            }, 300);
        }, tempo);
    }, 100);
}

// Função para limpar mensagens
function limparMensagens() {
    const messageContainer = document.querySelector('.message-container');
    
    if (messageContainer) {
        messageContainer.innerHTML = '';
    }
} 