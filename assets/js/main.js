// Aguarda o carregamento completo do DOM
document.addEventListener('DOMContentLoaded', () => {
    // Verifica autenticação e ajusta UI
    verificarUsuarioLogado();
    
    // Carrega serviços em destaque
    carregarServicosFavoritos();
});

// Verifica se usuário está logado e ajusta a interface
async function verificarUsuarioLogado() {
    const user = await verificarAutenticacao();
    const loginBtn = document.querySelector('.btn-login');
    
    if (user) {
        // Verifica se é admin
        const isAdmin = await verificarAdmin(user.id);
        
        if (isAdmin) {
            loginBtn.textContent = 'Painel Admin';
            loginBtn.href = './pages/admin/dashboard.html';
        } else {
            loginBtn.textContent = 'Minha Conta';
            loginBtn.href = './pages/cliente/painel.html';
        }
    }
}

// Carrega serviços marcados como favoritos pelo administrador
async function carregarServicosFavoritos() {
    const servicosContainer = document.getElementById('servicos-favoritos');
    
    try {
        const { data: servicos, error } = await supabase
            .from('servicos')
            .select('*')
            .eq('favorito', true)
            .order('nome');
        
        if (error) throw error;
        
        // Remove o loader
        servicosContainer.innerHTML = '';
        
        // Se não houver serviços favoritos
        if (servicos.length === 0) {
            servicosContainer.innerHTML = '<p class="no-results">Nenhum serviço em destaque no momento.</p>';
            return;
        }
        
        // Renderiza os serviços favoritos
        servicos.forEach(servico => {
            servicosContainer.appendChild(criarCardServico(servico));
        });
        
    } catch (error) {
        console.error('Erro ao carregar serviços favoritos:', error);
        servicosContainer.innerHTML = '<p class="error">Erro ao carregar serviços. Tente novamente mais tarde.</p>';
    }
}

// Cria um card de serviço para exibição
function criarCardServico(servico) {
    const card = document.createElement('div');
    card.className = 'servico-card';
    
    const imagemBg = servico.imagem_url || `../images/servicos/default.jpg`;
    
    card.innerHTML = `
        <div class="servico-imagem" style="background-image: url('${imagemBg}')"></div>
        <div class="servico-info">
            <h3>${servico.nome}</h3>
            <p>${servico.descricao_curta || 'Sem descrição disponível'}</p>
            <div class="preco">${formatarMoeda(servico.preco)}</div>
            <a href="./pages/servicos.html?id=${servico.id}" class="btn-secundario">Ver detalhes</a>
        </div>
    `;
    
    return card;
} 