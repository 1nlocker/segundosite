// Configuração do Supabase
export const SUPABASE_URL = 'https://cdnlwbolfyiuxvwchhri.supabase.co';
export const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkbmx3Ym9sZnlpdXh2d2NoaHJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4MDQ4OTEsImV4cCI6MjA2MDM4MDg5MX0.KQM44Vn_wr63AQE2mSkW99D4Af8rctmK1cvmapUmCX4';

// Para debugging
console.log('Configurações Supabase carregadas:', SUPABASE_URL ? 'Sim' : 'Não');

// Verificar autenticação
export async function verificarAutenticacao() {
    // Inicialização do cliente Supabase quando necessário
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    
    try {
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
    
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    
    try {
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
    // Implementação simples de notificação que pode ser melhorada futuramente
    alert(`[${tipo.toUpperCase()}] ${mensagem}`);
} 