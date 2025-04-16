// JavaScript para o dashboard administrativo

// Aguarda o carregamento do DOM
document.addEventListener('DOMContentLoaded', () => {
    // Carrega os dados do dashboard
    carregarDadosDashboard();
    
    // Carrega os pedidos recentes
    carregarPedidosRecentes();
    
    // Carrega os serviços populares
    carregarServicosPopulares();
});

// Carrega os dados principais do dashboard
async function carregarDadosDashboard() {
    try {
        // Obter data atual para calcular pedidos de hoje
        const dataAtual = new Date();
        const inicioHoje = new Date(dataAtual.setHours(0, 0, 0, 0)).toISOString();
        const fimHoje = new Date(dataAtual.setHours(23, 59, 59, 999)).toISOString();
        
        // Obter data do início do mês atual para calcular faturamento mensal
        const inicioMes = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), 1).toISOString();
        const fimMes = new Date(dataAtual.getFullYear(), dataAtual.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
        
        // Obter pedidos de hoje
        const { data: pedidosHoje, error: errorHoje } = await supabase
            .from('pedidos')
            .select('count')
            .gte('created_at', inicioHoje)
            .lte('created_at', fimHoje);
            
        if (errorHoje) throw errorHoje;
        
        // Obter pedidos em andamento
        const { data: pedidosAndamento, error: errorAndamento } = await supabase
            .from('pedidos')
            .select('count')
            .eq('status', 'em_andamento');
            
        if (errorAndamento) throw errorAndamento;
        
        // Obter pedidos concluídos
        const { data: pedidosConcluidos, error: errorConcluidos } = await supabase
            .from('pedidos')
            .select('count')
            .eq('status', 'concluido');
            
        if (errorConcluidos) throw errorConcluidos;
        
        // Obter faturamento mensal
        const { data: faturamento, error: errorFaturamento } = await supabase
            .from('pedidos')
            .select('valor_total')
            .gte('created_at', inicioMes)
            .lte('created_at', fimMes)
            .eq('status', 'concluido');
            
        if (errorFaturamento) throw errorFaturamento;
        
        // Calcular faturamento total
        const faturamentoTotal = faturamento.reduce((total, pedido) => total + parseFloat(pedido.valor_total), 0);
        
        // Atualiza a UI
        atualizarCardsDashboard({
            pedidosHoje: pedidosHoje[0]?.count || 0,
            pedidosAndamento: pedidosAndamento[0]?.count || 0,
            pedidosConcluidos: pedidosConcluidos[0]?.count || 0,
            faturamentoMensal: faturamentoTotal
        });
        
    } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
    }
}

// Atualiza os cards do dashboard
function atualizarCardsDashboard({ pedidosHoje, pedidosAndamento, pedidosConcluidos, faturamentoMensal }) {
    const elPedidosHoje = document.getElementById('pedidos-hoje');
    const elPedidosAndamento = document.getElementById('pedidos-andamento');
    const elPedidosConcluidos = document.getElementById('pedidos-concluidos');
    const elFaturamentoMensal = document.getElementById('faturamento-mensal');
    
    if (elPedidosHoje) elPedidosHoje.textContent = pedidosHoje;
    if (elPedidosAndamento) elPedidosAndamento.textContent = pedidosAndamento;
    if (elPedidosConcluidos) elPedidosConcluidos.textContent = pedidosConcluidos;
    if (elFaturamentoMensal) elFaturamentoMensal.textContent = formatarMoeda(faturamentoMensal);
}

// Carrega pedidos recentes
async function carregarPedidosRecentes() {
    // Usar a função genérica de carregar tabela do admin.js
    await window.adminUtils.carregarTabela({
        tableId: 'pedidos-recentes-table',
        queryFn: () => supabase
            .from('pedidos')
            .select(`
                id,
                valor_total,
                status,
                created_at,
                usuarios (
                    nome
                ),
                itens_pedido (
                    servico_id,
                    servicos (
                        nome
                    )
                )
            `)
            .order('created_at', { ascending: false })
            .limit(5),
        renderRowFn: (pedido) => {
            // Obter o primeiro serviço do pedido
            const primeiroServico = pedido.itens_pedido.length > 0 
                ? pedido.itens_pedido[0].servicos.nome 
                : 'N/A';
            
            return `
                <td>${pedido.id.substring(0, 8)}...</td>
                <td>${pedido.usuarios.nome}</td>
                <td>${window.adminUtils.truncarTexto(primeiroServico, 30)}</td>
                <td>${formatarMoeda(pedido.valor_total)}</td>
                <td>${window.adminUtils.criarBadgeStatus(pedido.status)}</td>
                <td>${formatarData(pedido.created_at)}</td>
                <td>
                    <div class="table-actions">
                        <a href="pedido-detalhe.html?id=${pedido.id}" class="btn-table-action btn-view">Ver</a>
                    </div>
                </td>
            `;
        },
        emptyMessage: 'Nenhum pedido recente encontrado.',
        errorMessage: 'Erro ao carregar pedidos recentes.'
    });
}

// Carrega serviços populares
async function carregarServicosPopulares() {
    const servicosContainer = document.getElementById('servicos-populares-list');
    if (!servicosContainer) return;
    
    try {
        // Busca os serviços mais vendidos
        // Para este exemplo, vamos obter os serviços mais requisitados nos pedidos
        const { data: servicos, error } = await supabase
            .from('itens_pedido')
            .select(`
                servico_id,
                servicos (
                    id,
                    nome,
                    preco
                )
            `)
            .limit(100);  // Buscamos vários e contamos no lado do cliente para evitar complexidade no SQL
            
        if (error) throw error;
        
        // Conta a frequência de cada serviço
        const servicosContagem = {};
        servicos.forEach(item => {
            const servicoId = item.servico_id;
            if (servicosContagem[servicoId]) {
                servicosContagem[servicoId].count += 1;
            } else {
                servicosContagem[servicoId] = {
                    servico: item.servicos,
                    count: 1
                };
            }
        });
        
        // Converte para array e ordena
        const servicosPopulares = Object.values(servicosContagem)
            .sort((a, b) => b.count - a.count)
            .slice(0, 4);  // Pega os 4 mais populares
        
        // Limpa o container
        servicosContainer.innerHTML = '';
        
        // Se não houver serviços
        if (servicosPopulares.length === 0) {
            servicosContainer.innerHTML = '<p class="loading-data">Nenhum serviço popular encontrado.</p>';
            return;
        }
        
        // Renderiza os serviços populares
        servicosPopulares.forEach(item => {
            const card = document.createElement('div');
            card.className = 'servico-popular-card';
            
            card.innerHTML = `
                <h3>${window.adminUtils.truncarTexto(item.servico.nome, 20)}</h3>
                <p class="servico-preco">${formatarMoeda(item.servico.preco)}</p>
                <p class="servico-vendas">${item.count} venda${item.count !== 1 ? 's' : ''}</p>
            `;
            
            servicosContainer.appendChild(card);
        });
        
    } catch (error) {
        console.error('Erro ao carregar serviços populares:', error);
        servicosContainer.innerHTML = '<p class="loading-data">Erro ao carregar serviços populares.</p>';
    }
} 