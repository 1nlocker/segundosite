// Configuração do Supabase
const SUPABASE_URL = 'https://cdnlwbolfyiuxvwchhri.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkbmx3Ym9sZnlpdXh2d2NoaHJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4MDQ4OTEsImV4cCI6MjA2MDM4MDg5MX0.KQM44Vn_wr63AQE2mSkW99D4Af8rctmK1cvmapUmCX4';

// Inicialização do cliente Supabase
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Verificar autenticação
async function verificarAutenticacao() {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
        console.error('Erro ao verificar autenticação:', error);
        return null;
    }
    
    return user;
}

// Verificar se o usuário é administrador
async function verificarAdmin(userId) {
    if (!userId) return false;
    
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
}

// Funções de redirecionamento de acordo com o perfil
function redirecionarParaAdmin() {
    window.location.href = '/pages/admin/dashboard.html';
}

function redirecionarParaCliente() {
    window.location.href = '/pages/cliente/painel.html';
}

function redirecionarParaLogin() {
    window.location.href = '/pages/cliente/login.html';
}

// Função para formatar datas
function formatarData(dataString) {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
}

// Função para formatar valores em reais
function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Exibir notificações
function mostrarNotificacao(mensagem, tipo = 'info') {
    // Implementação simples de notificação que pode ser melhorada futuramente
    alert(`[${tipo.toUpperCase()}] ${mensagem}`);
} 