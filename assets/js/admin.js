// JavaScript principal para o painel administrativo

// Aguarda o carregamento do DOM
document.addEventListener('DOMContentLoaded', () => {
    // Verifica se o usuário está autenticado e é admin
    verificarAutenticacaoAdmin();
    
    // Configura o botão de logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
});

// Verifica se o usuário está autenticado e é admin
async function verificarAutenticacaoAdmin() {
    try {
        const user = await verificarAutenticacao();
        
        // Se não estiver logado, redireciona para login
        if (!user) {
            redirecionarParaLogin();
            return;
        }
        
        // Verifica se é admin
        const isAdmin = await verificarAdmin(user.id);
        
        if (!isAdmin) {
            // Redireciona para painel do cliente se não for admin
            window.location.href = '../cliente/painel.html';
            return;
        }
        
        // Carrega informações do usuário
        await carregarInfoUsuario(user.id);
        
    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        redirecionarParaLogin();
    }
}

// Carrega informações do usuário
async function carregarInfoUsuario(userId) {
    try {
        const { data, error } = await supabase
            .from('usuarios')
            .select('nome')
            .eq('id', userId)
            .single();
            
        if (error) throw error;
        
        // Atualiza o nome do usuário na UI
        const adminNome = document.getElementById('admin-nome');
        if (adminNome) {
            adminNome.textContent = data.nome;
        }
        
    } catch (error) {
        console.error('Erro ao carregar informações do usuário:', error);
    }
}

// Função para lidar com o logout
async function handleLogout(event) {
    event.preventDefault();
    
    try {
        const { error } = await supabase.auth.signOut();
        
        if (error) throw error;
        
        // Redireciona para a página de login
        redirecionarParaLogin();
        
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
        mostrarNotificacao('Erro ao fazer logout. Tente novamente.', 'error');
    }
}

// Função para formatar status do pedido
function formatarStatus(status) {
    const statusMap = {
        'pendente': 'Pendente',
        'em_andamento': 'Em Andamento',
        'concluido': 'Concluído',
        'cancelado': 'Cancelado'
    };
    
    return statusMap[status] || status;
}

// Função para criar um badge de status
function criarBadgeStatus(status) {
    return `<span class="status-badge status-${status}">${formatarStatus(status)}</span>`;
}

// Função para truncar texto
function truncarTexto(texto, maxLength = 50) {
    if (!texto) return '';
    
    if (texto.length <= maxLength) return texto;
    
    return texto.substring(0, maxLength) + '...';
}

// Função genérica para carregar e renderizar tabela
async function carregarTabela({
    tableId,
    queryFn,
    renderRowFn,
    emptyMessage = 'Nenhum registro encontrado.',
    errorMessage = 'Erro ao carregar dados. Tente novamente mais tarde.'
}) {
    const tableBody = document.getElementById(tableId);
    if (!tableBody) return;
    
    try {
        const { data, error } = await queryFn();
        
        if (error) throw error;
        
        // Limpa a tabela
        tableBody.innerHTML = '';
        
        // Se não houver dados
        if (!data || data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="100%" class="loading-data">${emptyMessage}</td></tr>`;
            return;
        }
        
        // Renderiza as linhas
        data.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = renderRowFn(item);
            tableBody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Erro ao carregar tabela:', error);
        tableBody.innerHTML = `<tr><td colspan="100%" class="loading-data">${errorMessage}</td></tr>`;
    }
}

// Função para confirmar ação
function confirmarAcao(mensagem) {
    return window.confirm(mensagem);
}

// Exporta funções que serão usadas por outras páginas
window.adminUtils = {
    carregarTabela,
    formatarStatus,
    criarBadgeStatus,
    truncarTexto,
    confirmarAcao,
    formatarData,
    formatarMoeda
}; 