// JavaScript principal para o painel administrativo

// Inicialização do cliente Supabase
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Elementos do DOM
const loginContainer = document.getElementById('loginContainer');
const adminPanel = document.getElementById('adminPanel');
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const senhaInput = document.getElementById('senha');
const userName = document.getElementById('userName');
const logoutBtn = document.getElementById('logoutBtn');
const pendingOrdersTable = document.getElementById('pendingOrdersTable');
const historyOrdersTable = document.getElementById('historyOrdersTable');
const noPendingOrdersMessage = document.getElementById('noPendingOrdersMessage');
const noHistoryOrdersMessage = document.getElementById('noHistoryOrdersMessage');
const refreshPendingBtn = document.getElementById('refreshPendingBtn');
const refreshHistoryBtn = document.getElementById('refreshHistoryBtn');
const mensagemToast = document.getElementById('mensagemToast');

// Verifica se o usuário está autenticado ao carregar a página
document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
        // Verifica se o usuário é um administrador
        const { data: usuario, error } = await supabase
            .from('usuarios')
            .select('nome, role')
            .eq('user_id', session.user.id)
            .single();

        if (error || !usuario || usuario.role !== 'admin') {
            // Se não for administrador, fazer logout
            await supabase.auth.signOut();
            mostrarMensagem('Acesso negado. Apenas administradores podem acessar este painel.', 'error');
            mostrarTelaLogin();
            return;
        }

        // Se for administrador, continua
        userName.textContent = usuario.nome;
        mostrarTelaAdmin();
        carregarPedidosPendentes();
        carregarHistoricoPedidos();
    } else {
        mostrarTelaLogin();
    }
});

// Login do usuário
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = emailInput.value;
    const senha = senhaInput.value;
    
    try {
        // Tenta fazer login
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password: senha
        });
        
        if (error) throw error;
        
        // Verifica se é um administrador
        const { data: usuario, error: userError } = await supabase
            .from('usuarios')
            .select('nome, role')
            .eq('user_id', data.user.id)
            .single();
        
        if (userError || !usuario) {
            throw new Error('Erro ao carregar dados do usuário');
        }
        
        if (usuario.role !== 'admin') {
            await supabase.auth.signOut();
            throw new Error('Acesso negado. Apenas administradores podem acessar este painel.');
        }
        
        // Login bem-sucedido para administrador
        userName.textContent = usuario.nome;
        mostrarTelaAdmin();
        carregarPedidosPendentes();
        carregarHistoricoPedidos();
        mostrarMensagem('Login realizado com sucesso!', 'success');
    } catch (error) {
        mostrarMensagem(error.message || 'Erro ao fazer login. Verifique suas credenciais.', 'error');
    }
});

// Logout do usuário
logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    mostrarTelaLogin();
    mostrarMensagem('Logout realizado com sucesso!', 'success');
});

// Atualizar pedidos pendentes
refreshPendingBtn.addEventListener('click', () => {
    carregarPedidosPendentes();
});

// Atualizar histórico de pedidos
refreshHistoryBtn.addEventListener('click', () => {
    carregarHistoricoPedidos();
});

// Funções auxiliares

// Exibe a tela de login
function mostrarTelaLogin() {
    loginContainer.classList.remove('hidden');
    adminPanel.classList.add('hidden');
    // Limpa os campos de login
    loginForm.reset();
}

// Exibe a tela de administrador
function mostrarTelaAdmin() {
    loginContainer.classList.add('hidden');
    adminPanel.classList.remove('hidden');
}

// Exibe mensagens de toast
function mostrarMensagem(mensagem, tipo = 'info') {
    mensagemToast.textContent = mensagem;
    mensagemToast.className = `mensagem-toast ${tipo}`;
    mensagemToast.classList.add('show');
    
    setTimeout(() => {
        mensagemToast.classList.remove('show');
    }, 3000);
}

// Carrega pedidos pendentes
async function carregarPedidosPendentes() {
    try {
        // Pedidos com status diferente de 'concluído' ou 'cancelado'
        const { data: pedidos, error } = await supabase
            .from('pedidos')
            .select(`
                id,
                created_at,
                marca,
                modelo,
                servico,
                status,
                usuarios (
                    nome,
                    email
                )
            `)
            .not('status', 'in', '("concluido","cancelado")')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Limpa a tabela
        const tbody = pendingOrdersTable.querySelector('tbody');
        tbody.innerHTML = '';
        
        // Adiciona os pedidos à tabela ou mostra mensagem se não houver
        if (pedidos && pedidos.length > 0) {
            noPendingOrdersMessage.classList.add('hidden');
            pendingOrdersTable.classList.remove('hidden');
            
            pedidos.forEach(pedido => {
                const tr = document.createElement('tr');
                
                // Formata a data
                const data = new Date(pedido.created_at);
                const dataFormatada = data.toLocaleDateString('pt-BR') + ' ' + 
                                      data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                
                tr.innerHTML = `
                    <td>${pedido.id}</td>
                    <td>${pedido.usuarios.nome}<br><small>${pedido.usuarios.email}</small></td>
                    <td>${pedido.marca} ${pedido.modelo}</td>
                    <td>${pedido.servico}</td>
                    <td>${dataFormatada}</td>
                    <td><span class="badge status-${pedido.status}">${formatarStatus(pedido.status)}</span></td>
                    <td>
                        <div class="acao-btns">
                            <button class="btn btn-sm btn-success" onclick="atualizarStatus(${pedido.id}, 'concluido')">
                                <i class="fas fa-check"></i> Concluir
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="atualizarStatus(${pedido.id}, 'cancelado')">
                                <i class="fas fa-times"></i> Cancelar
                            </button>
                            <button class="btn btn-sm btn-warning" onclick="atualizarStatus(${pedido.id}, 'em_processamento')">
                                <i class="fas fa-cog"></i> Em Processamento
                            </button>
                        </div>
                    </td>
                `;
                
                tbody.appendChild(tr);
            });
        } else {
            pendingOrdersTable.classList.add('hidden');
            noPendingOrdersMessage.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Erro ao carregar pedidos pendentes:', error);
        mostrarMensagem('Erro ao carregar pedidos pendentes. Tente novamente.', 'error');
    }
}

// Carrega histórico de pedidos
async function carregarHistoricoPedidos() {
    try {
        // Pedidos com status 'concluído' ou 'cancelado'
        const { data: pedidos, error } = await supabase
            .from('pedidos')
            .select(`
                id,
                created_at,
                updated_at,
                marca,
                modelo,
                servico,
                status,
                usuarios (
                    nome,
                    email
                )
            `)
            .in('status', ['concluido', 'cancelado'])
            .order('updated_at', { ascending: false })
            .limit(50);
        
        if (error) throw error;
        
        // Limpa a tabela
        const tbody = historyOrdersTable.querySelector('tbody');
        tbody.innerHTML = '';
        
        // Adiciona os pedidos à tabela ou mostra mensagem se não houver
        if (pedidos && pedidos.length > 0) {
            noHistoryOrdersMessage.classList.add('hidden');
            historyOrdersTable.classList.remove('hidden');
            
            pedidos.forEach(pedido => {
                const tr = document.createElement('tr');
                
                // Formata as datas
                const dataCriacao = new Date(pedido.created_at);
                const dataCriacaoFormatada = dataCriacao.toLocaleDateString('pt-BR') + ' ' + 
                                             dataCriacao.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                
                const dataAtualizacao = new Date(pedido.updated_at);
                const dataAtualizacaoFormatada = dataAtualizacao.toLocaleDateString('pt-BR') + ' ' + 
                                                 dataAtualizacao.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                
                tr.innerHTML = `
                    <td>${pedido.id}</td>
                    <td>${pedido.usuarios.nome}<br><small>${pedido.usuarios.email}</small></td>
                    <td>${pedido.marca} ${pedido.modelo}</td>
                    <td>${pedido.servico}</td>
                    <td>${dataCriacaoFormatada}</td>
                    <td><span class="badge status-${pedido.status}">${formatarStatus(pedido.status)}</span></td>
                    <td>${dataAtualizacaoFormatada}</td>
                `;
                
                tbody.appendChild(tr);
            });
        } else {
            historyOrdersTable.classList.add('hidden');
            noHistoryOrdersMessage.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Erro ao carregar histórico de pedidos:', error);
        mostrarMensagem('Erro ao carregar histórico de pedidos. Tente novamente.', 'error');
    }
}

// Atualiza o status de um pedido
async function atualizarStatus(pedidoId, novoStatus) {
    try {
        const { error } = await supabase
            .from('pedidos')
            .update({ 
                status: novoStatus,
                updated_at: new Date().toISOString()
            })
            .eq('id', pedidoId);
        
        if (error) throw error;
        
        mostrarMensagem(`Pedido #${pedidoId} atualizado para ${formatarStatus(novoStatus)}`, 'success');
        
        // Recarrega os pedidos
        carregarPedidosPendentes();
        carregarHistoricoPedidos();
    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        mostrarMensagem('Erro ao atualizar status do pedido. Tente novamente.', 'error');
    }
}

// Formata o status para exibição
function formatarStatus(status) {
    const statusMap = {
        'pendente': 'Pendente',
        'em_processamento': 'Em Processamento',
        'concluido': 'Concluído',
        'cancelado': 'Cancelado'
    };
    
    return statusMap[status] || status;
}

// Expõe a função para o HTML
window.atualizarStatus = atualizarStatus; 
window.verDetalhesPedido = verDetalhesPedido; 