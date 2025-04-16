// Configuração do Supabase
// Tenta carregar as variáveis do .env se estiver em ambiente Node.js
// Ou usa os valores definidos diretamente para ambiente browser
export const SUPABASE_URL = typeof process !== 'undefined' && process.env.SUPABASE_URL 
    ? process.env.SUPABASE_URL 
    : 'https://cdnlwbolfyiuxvwchhri.supabase.co';

export const SUPABASE_KEY = typeof process !== 'undefined' && process.env.SUPABASE_KEY
    ? process.env.SUPABASE_KEY
    : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkbmx3Ym9sZnlpdXh2d2NoaHJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4MDQ4OTEsImV4cCI6MjA2MDM4MDg5MX0.KQM44Vn_wr63AQE2mSkW99D4Af8rctmK1cvmapUmCX4';

// Ambiente atual
export const NODE_ENV = typeof process !== 'undefined' && process.env.NODE_ENV
    ? process.env.NODE_ENV
    : 'development';

// Para debugging
console.log(`Ambiente: ${NODE_ENV}`);
console.log('Configurações Supabase carregadas:', SUPABASE_URL ? 'Sim' : 'Não');

// Inicialização do cliente Supabase - lazy loading para melhor performance
let supabaseClient = null;

export function getSupabase() {
    if (!supabaseClient) {
        if (!window.supabase) {
            throw new Error('Supabase não foi carregado corretamente.');
        }
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }
    return supabaseClient;
}

// Verificar autenticação
export async function verificarAutenticacao() {
    try {
        const supabase = getSupabase();
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
            console.error('Erro ao verificar autenticação:', error);
            return null;
        }
        
        console.log('Usuário autenticado:', user ? 'Sim' : 'Não');
        return user;
    } catch (e) {
        console.error('Erro inesperado ao verificar autenticação:', e);
        return null;
    }
}

// Verificar se o usuário é administrador
export async function verificarAdmin(userId) {
    if (!userId) return false;
    
    try {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from('usuarios')
            .select('role')
            .eq('id', userId)
            .single();
        
        if (error) {
            console.error('Erro ao verificar administrador:', error);
            return false;
        }
        
        return data && data.role === 'admin';
    } catch (e) {
        console.error('Erro inesperado ao verificar administrador:', e);
        return false;
    }
}

// Funções de redirecionamento de acordo com o perfil
export function redirecionarParaAdmin() {
    window.location.href = '/pages/admin/dashboard.html';
}

export function redirecionarParaCliente() {
    window.location.href = '/pages/cliente/painel.html';
}

export function redirecionarParaLogin() {
    window.location.href = '/pages/cliente/login.html';
}

// Função para formatar datas
export function formatarData(dataString) {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
}

// Função para formatar valores em reais
export function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Exibir notificações
export function mostrarNotificacao(mensagem, tipo = 'info') {
    // Implementação mais elaborada de notificação
    const notificacaoDiv = document.createElement('div');
    notificacaoDiv.className = `notificacao ${tipo}`;
    notificacaoDiv.innerHTML = `
        <div class="notificacao-conteudo">
            <span class="notificacao-tipo">${tipo.toUpperCase()}</span>
            <span class="notificacao-mensagem">${mensagem}</span>
        </div>
        <button class="notificacao-fechar">&times;</button>
    `;
    
    document.body.appendChild(notificacaoDiv);
    
    // Botão para fechar a notificação
    const fecharBtn = notificacaoDiv.querySelector('.notificacao-fechar');
    fecharBtn.addEventListener('click', () => {
        notificacaoDiv.remove();
    });
    
    // Auto-fechar após 5 segundos
    setTimeout(() => {
        if (document.body.contains(notificacaoDiv)) {
            notificacaoDiv.remove();
        }
    }, 5000);
} 