// Importando as configurações do Supabase
import { SUPABASE_URL, SUPABASE_KEY, formatarMoeda } from './config.js';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Inicializando o cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Estado da aplicação
let usuarioAtual = null;
let pedidosPendentes = [];
let pedidosHistorico = [];
let secaoAtiva = 'dashboard';

// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se o usuário está autenticado
    verificarAutenticacao();
    
    // Configurar eventos de navegação
    configurarNavegacao();
    
    // Configurar eventos de modais
    configurarModais();
    
    // Configurar formulários
    configurarFormularios();
});

// Autenticação e verificação de usuário
async function verificarAutenticacao() {
    mostrarLoading('Verificando credenciais...');
    
    // Verificar se há uma sessão ativa
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
        ocultarLoading();
        // Redirecionar para a página de login se não estiver autenticado
        window.location.href = '/login.html?redirecionamento=painel';
        return;
    }
    
    // Obter dados do usuário atual
    await carregarDadosUsuario(session.user.id);
    
    // Carregar dados dos pedidos
    await Promise.all([
        carregarPedidosPendentes(),
        carregarHistoricoPedidos()
    ]);
    
    // Atualizar a interface com os dados carregados
    atualizarInterface();
    
    ocultarLoading();
}

// Carregamento de dados do usuário
async function carregarDadosUsuario(userId) {
    try {
        const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('id', userId)
            .single();
            
        if (error) throw error;
        
        usuarioAtual = data;
    } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
        mostrarMensagem('Erro ao carregar seus dados. Tente novamente mais tarde.', 'erro');
    }
}

// Carregar pedidos pendentes
async function carregarPedidosPendentes() {
    try {
        const { data, error } = await supabase
            .from('pedidos')
            .select(`
                *,
                servicos (nome, preco)
            `)
            .eq('usuario_id', usuarioAtual.id)
            .in('status', ['pendente', 'processando'])
            .order('data_criacao', { ascending: false });
            
        if (error) throw error;
        
        pedidosPendentes = data;
    } catch (error) {
        console.error('Erro ao carregar pedidos pendentes:', error);
        mostrarMensagem('Erro ao carregar seus pedidos pendentes.', 'erro');
    }
}

// Carregar histórico de pedidos
async function carregarHistoricoPedidos() {
    try {
        const { data, error } = await supabase
            .from('pedidos')
            .select(`
                *,
                servicos (nome, preco)
            `)
            .eq('usuario_id', usuarioAtual.id)
            .in('status', ['concluido', 'cancelado'])
            .order('data_atualizacao', { ascending: false });
            
        if (error) throw error;
        
        pedidosHistorico = data;
    } catch (error) {
        console.error('Erro ao carregar histórico de pedidos:', error);
        mostrarMensagem('Erro ao carregar seu histórico de pedidos.', 'erro');
    }
}

// Atualizar interface com os dados carregados
function atualizarInterface() {
    // Atualizar dados do usuário na sidebar
    atualizarDadosUsuario();
    
    // Atualizar resumo no dashboard
    atualizarResumoDashboard();
    
    // Atualizar tabelas de pedidos
    atualizarTabelaPedidosPendentes();
    atualizarTabelaHistoricoPedidos();
    
    // Mostrar a seção ativa
    mostrarSecao(secaoAtiva);
}

// Atualizar dados do usuário na sidebar
function atualizarDadosUsuario() {
    if (!usuarioAtual) return;
    
    // Nome do usuário
    const elementosNome = document.querySelectorAll('.usuario-nome');
    elementosNome.forEach(el => el.textContent = usuarioAtual.nome);
    
    // Email
    document.querySelector('.usuario-email').textContent = usuarioAtual.email;
    
    // Telefone
    const telefoneEl = document.querySelector('.usuario-telefone');
    if (telefoneEl && usuarioAtual.telefone) {
        telefoneEl.textContent = usuarioAtual.telefone;
    }
    
    // Preencher formulário de edição
    const formNome = document.getElementById('editar-nome');
    const formEmail = document.getElementById('editar-email');
    const formTelefone = document.getElementById('editar-telefone');
    
    if (formNome) formNome.value = usuarioAtual.nome || '';
    if (formEmail) formEmail.value = usuarioAtual.email || '';
    if (formTelefone) formTelefone.value = usuarioAtual.telefone || '';
}

// Atualizar o resumo no dashboard
function atualizarResumoDashboard() {
    // Total de pedidos
    const totalPedidos = pedidosPendentes.length + pedidosHistorico.length;
    document.querySelector('.total-pedidos').textContent = totalPedidos;
    
    // Pedidos pendentes
    document.querySelector('.pedidos-pendentes').textContent = pedidosPendentes.length;
    
    // Pedidos concluídos
    const pedidosConcluidos = pedidosHistorico.filter(p => p.status === 'concluido').length;
    document.querySelector('.pedidos-concluidos').textContent = pedidosConcluidos;
}

// Atualizar tabela de pedidos pendentes
function atualizarTabelaPedidosPendentes() {
    const tabela = document.querySelector('#pedidos-pendentes-tabela tbody');
    
    if (!tabela) return;
    
    // Limpar tabela
    tabela.innerHTML = '';
    
    if (pedidosPendentes.length === 0) {
        tabela.innerHTML = `
            <tr>
                <td colspan="5" class="loading-data">Não há pedidos pendentes no momento.</td>
            </tr>
        `;
        return;
    }
    
    // Preencher com os dados
    pedidosPendentes.forEach(pedido => {
        const row = document.createElement('tr');
        
        const dataCriacao = new Date(pedido.data_criacao);
        const dataFormatada = dataCriacao.toLocaleDateString('pt-BR');
        
        row.innerHTML = `
            <td>${pedido.id}</td>
            <td>${pedido.servicos.nome}</td>
            <td>R$ ${pedido.servicos.preco.toFixed(2)}</td>
            <td><span class="status status-${pedido.status}">${formatarStatus(pedido.status)}</span></td>
            <td>
                <button class="btn-secundario btn-detalhes" data-id="${pedido.id}">Detalhes</button>
            </td>
        `;
        
        tabela.appendChild(row);
    });
    
    // Adicionar eventos aos botões de detalhes
    document.querySelectorAll('.btn-detalhes').forEach(btn => {
        btn.addEventListener('click', function() {
            const pedidoId = this.getAttribute('data-id');
            abrirModalDetalhesPedido(pedidoId);
        });
    });
}

// Atualizar tabela do histórico de pedidos
function atualizarTabelaHistoricoPedidos() {
    const tabela = document.querySelector('#historico-pedidos-tabela tbody');
    
    if (!tabela) return;
    
    // Limpar tabela
    tabela.innerHTML = '';
    
    if (pedidosHistorico.length === 0) {
        tabela.innerHTML = `
            <tr>
                <td colspan="5" class="loading-data">Não há histórico de pedidos.</td>
            </tr>
        `;
        return;
    }
    
    // Preencher com os dados
    pedidosHistorico.forEach(pedido => {
        const row = document.createElement('tr');
        
        const dataAtualizacao = new Date(pedido.data_atualizacao);
        const dataFormatada = dataAtualizacao.toLocaleDateString('pt-BR');
        
        row.innerHTML = `
            <td>${pedido.id}</td>
            <td>${pedido.servicos.nome}</td>
            <td>R$ ${pedido.servicos.preco.toFixed(2)}</td>
            <td><span class="status status-${pedido.status}">${formatarStatus(pedido.status)}</span></td>
            <td>
                <button class="btn-secundario btn-detalhes" data-id="${pedido.id}">Detalhes</button>
            </td>
        `;
        
        tabela.appendChild(row);
    });
    
    // Adicionar eventos aos botões de detalhes
    document.querySelectorAll('.btn-detalhes').forEach(btn => {
        btn.addEventListener('click', function() {
            const pedidoId = this.getAttribute('data-id');
            abrirModalDetalhesPedido(pedidoId);
        });
    });
}

// Formatar status para exibição
function formatarStatus(status) {
    const statusMap = {
        'pendente': 'Pendente',
        'processando': 'Em processamento',
        'concluido': 'Concluído',
        'cancelado': 'Cancelado'
    };
    
    return statusMap[status] || status;
}

// Configurar navegação
function configurarNavegacao() {
    // Links de navegação
    document.querySelectorAll('.menu-navegacao a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remover classe ativa de todos os links
            document.querySelectorAll('.menu-navegacao li').forEach(item => {
                item.classList.remove('active');
            });
            
            // Adicionar classe ativa ao link clicado
            this.parentElement.classList.add('active');
            
            // Obter a seção a ser mostrada
            const secao = this.getAttribute('data-section');
            mostrarSecao(secao);
        });
    });
    
    // Marcar link ativo inicialmente
    const linkAtivo = document.querySelector(`.menu-navegacao a[data-section="${secaoAtiva}"]`);
    if (linkAtivo) {
        linkAtivo.parentElement.classList.add('active');
    }
}

// Mostrar seção específica
function mostrarSecao(secao) {
    // Atualizar variável global
    secaoAtiva = secao;
    
    // Ocultar todas as seções
    document.querySelectorAll('.cliente-section').forEach(sec => {
        sec.classList.add('section-inativa');
        sec.classList.remove('section-ativa');
    });
    
    // Mostrar a seção solicitada
    const secaoAlvo = document.getElementById(secao);
    if (secaoAlvo) {
        secaoAlvo.classList.remove('section-inativa');
        secaoAlvo.classList.add('section-ativa');
    }
}

// Configurar modais
function configurarModais() {
    // Botões para fechar modais
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            fecharModal(modal);
        });
    });
    
    // Fechar modal ao clicar fora do conteúdo
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                fecharModal(this);
            }
        });
    });
    
    // Botão para abrir o modal de edição de perfil
    const btnEditarPerfil = document.querySelector('.btn-editar-perfil');
    if (btnEditarPerfil) {
        btnEditarPerfil.addEventListener('click', function() {
            abrirModal('editar-perfil-modal');
        });
    }
}

// Abrir modal
function abrirModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
    }
}

// Fechar modal
function fecharModal(modal) {
    if (typeof modal === 'string') {
        modal = document.getElementById(modal);
    }
    
    if (modal) {
        modal.style.display = 'none';
    }
}

// Abrir modal de detalhes do pedido
function abrirModalDetalhesPedido(pedidoId) {
    // Encontrar o pedido pelo ID
    const pedido = [...pedidosPendentes, ...pedidosHistorico].find(p => p.id == pedidoId);
    
    if (!pedido) {
        mostrarMensagem('Pedido não encontrado.', 'erro');
        return;
    }
    
    // Atualizar conteúdo do modal
    const modal = document.getElementById('detalhes-pedido-modal');
    
    if (!modal) return;
    
    // Data de criação formatada
    const dataCriacao = new Date(pedido.data_criacao);
    const dataAtualizacao = new Date(pedido.data_atualizacao);
    
    // Atualizando conteúdo do modal
    modal.querySelector('.pedido-id').textContent = pedido.id;
    modal.querySelector('.pedido-servico').textContent = pedido.servicos.nome;
    modal.querySelector('.pedido-preco').textContent = formatarMoeda(pedido.servicos.preco);
    modal.querySelector('.pedido-status').innerHTML = `<span class="status status-${pedido.status}">${formatarStatus(pedido.status)}</span>`;
    modal.querySelector('.pedido-data-criacao').textContent = dataCriacao.toLocaleDateString('pt-BR') + ' às ' + dataCriacao.toLocaleTimeString('pt-BR');
    modal.querySelector('.pedido-data-atualizacao').textContent = dataAtualizacao.toLocaleDateString('pt-BR') + ' às ' + dataAtualizacao.toLocaleTimeString('pt-BR');
    
    // Informações adicionais do pedido
    const infoAdicional = modal.querySelector('.pedido-info-adicional');
    if (infoAdicional) {
        if (pedido.detalhes) {
            infoAdicional.innerHTML = '';
            
            // Converter detalhes para um objeto se for string JSON
            let detalhes = pedido.detalhes;
            if (typeof detalhes === 'string') {
                try {
                    detalhes = JSON.parse(detalhes);
                } catch (e) {
                    // Se não for um JSON válido, manter como string
                }
            }
            
            // Se for um objeto, mostrar cada propriedade
            if (typeof detalhes === 'object' && detalhes !== null) {
                for (const [chave, valor] of Object.entries(detalhes)) {
                    const infoItem = document.createElement('p');
                    infoItem.innerHTML = `<strong>${formatarChave(chave)}:</strong> ${valor}`;
                    infoAdicional.appendChild(infoItem);
                }
            } else {
                infoAdicional.textContent = detalhes;
            }
        } else {
            infoAdicional.textContent = 'Nenhuma informação adicional disponível.';
        }
    }
    
    // Abrir o modal
    abrirModal('detalhes-pedido-modal');
}

// Formatação de chaves para exibição mais amigável
function formatarChave(chave) {
    // Remover underscores e capitalizar cada palavra
    return chave
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
}

// Configurar formulários
function configurarFormularios() {
    // Formulário de edição de perfil
    const formPerfil = document.getElementById('form-editar-perfil');
    
    if (formPerfil) {
        formPerfil.addEventListener('submit', async function(e) {
            e.preventDefault();
            await atualizarPerfil();
        });
    }
}

// Atualizar perfil do usuário
async function atualizarPerfil() {
    const nome = document.getElementById('editar-nome').value.trim();
    const telefone = document.getElementById('editar-telefone').value.trim();
    
    if (!nome) {
        mostrarMensagem('O nome é obrigatório.', 'erro');
        return;
    }
    
    mostrarLoading('Atualizando perfil...');
    
    try {
        // Atualizar no banco de dados
        const { error } = await supabase
            .from('usuarios')
            .update({
                nome: nome,
                telefone: telefone,
                data_atualizacao: new Date()
            })
            .eq('id', usuarioAtual.id);
            
        if (error) throw error;
        
        // Atualizar o objeto local
        usuarioAtual.nome = nome;
        usuarioAtual.telefone = telefone;
        
        // Atualizar a interface
        atualizarDadosUsuario();
        
        // Fechar modal
        fecharModal('editar-perfil-modal');
        
        // Mensagem de sucesso
        mostrarMensagem('Perfil atualizado com sucesso!', 'sucesso');
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        mostrarMensagem('Erro ao atualizar perfil. Tente novamente.', 'erro');
    } finally {
        ocultarLoading();
    }
}

// Funções de logout
function logout() {
    mostrarLoading('Saindo...');
    
    supabase.auth.signOut().then(({ error }) => {
        if (error) {
            ocultarLoading();
            mostrarMensagem('Erro ao sair. Tente novamente.', 'erro');
            console.error('Erro ao fazer logout:', error);
            return;
        }
        
        // Redirecionar para a página inicial
        window.location.href = '/';
    });
}

// Adicionar evento ao botão de logout
const btnLogout = document.querySelector('.btn-logout');
if (btnLogout) {
    btnLogout.addEventListener('click', logout);
}

// Utilitários para UI
function mostrarLoading(mensagem = 'Carregando...') {
    // Verificar se já existe um elemento de loading
    let loadingEl = document.querySelector('.loading-overlay');
    
    if (!loadingEl) {
        // Criar elemento de loading
        loadingEl = document.createElement('div');
        loadingEl.className = 'loading-overlay';
        loadingEl.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <p class="loading-message">${mensagem}</p>
            </div>
        `;
        document.body.appendChild(loadingEl);
    } else {
        // Atualizar mensagem
        loadingEl.querySelector('.loading-message').textContent = mensagem;
        loadingEl.style.display = 'flex';
    }
}

function ocultarLoading() {
    const loadingEl = document.querySelector('.loading-overlay');
    if (loadingEl) {
        loadingEl.style.display = 'none';
    }
}

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