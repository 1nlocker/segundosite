-- Esquema SQL para o Portal de Desbloqueio de Celular no Supabase

-- Tabela de Usuários (estende a tabela auth.users do Supabase)
CREATE TABLE public.usuarios (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    telefone TEXT,
    role TEXT NOT NULL DEFAULT 'cliente', -- 'cliente' ou 'admin'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Função para atualizar o timestamp de 'updated_at'
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar 'updated_at' nos usuários
CREATE TRIGGER update_usuarios_updated_at
BEFORE UPDATE ON public.usuarios
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Tabela de Categorias de Serviços
CREATE TABLE public.categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL UNIQUE,
    descricao TEXT,
    ordem INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trigger para atualizar 'updated_at' nas categorias
CREATE TRIGGER update_categorias_updated_at
BEFORE UPDATE ON public.categorias
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Tabela de Serviços
CREATE TABLE public.servicos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    descricao_curta TEXT,
    descricao_completa TEXT,
    imagem_url TEXT,
    preco DECIMAL(10, 2) NOT NULL,
    tempo_estimado TEXT,
    categoria_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
    favorito BOOLEAN DEFAULT FALSE,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trigger para atualizar 'updated_at' nos serviços
CREATE TRIGGER update_servicos_updated_at
BEFORE UPDATE ON public.servicos
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Tabela de Pedidos
CREATE TABLE public.pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pendente', -- 'pendente', 'em_andamento', 'concluido', 'cancelado'
    valor_total DECIMAL(10, 2) NOT NULL,
    observacoes TEXT,
    info_dispositivo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trigger para atualizar 'updated_at' nos pedidos
CREATE TRIGGER update_pedidos_updated_at
BEFORE UPDATE ON public.pedidos
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Tabela de Itens do Pedido
CREATE TABLE public.itens_pedido (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
    servico_id UUID NOT NULL REFERENCES public.servicos(id) ON DELETE CASCADE,
    preco DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Histórico de Status do Pedido
CREATE TABLE public.historico_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    comentario TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Função para inserir um novo registro no histórico de status quando o status de um pedido é atualizado
CREATE OR REPLACE FUNCTION update_pedido_status_history()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status != NEW.status THEN
        INSERT INTO public.historico_status (pedido_id, status, comentario)
        VALUES (NEW.id, NEW.status, 'Status atualizado automaticamente pelo sistema');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar o histórico de status
CREATE TRIGGER update_pedido_status
AFTER UPDATE OF status ON public.pedidos
FOR EACH ROW
EXECUTE FUNCTION update_pedido_status_history();

-- Trigger para inserir o primeiro status quando o pedido é criado
CREATE OR REPLACE FUNCTION insert_initial_pedido_status()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.historico_status (pedido_id, status, comentario)
    VALUES (NEW.id, NEW.status, 'Pedido criado');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para inserir o status inicial do pedido
CREATE TRIGGER insert_pedido_status
AFTER INSERT ON public.pedidos
FOR EACH ROW
EXECUTE FUNCTION insert_initial_pedido_status();

-- Inserir categorias iniciais
INSERT INTO public.categorias (nome, descricao, ordem)
VALUES 
    ('Desbloqueio de Operadora', 'Serviços para liberar celulares bloqueados por operadoras', 1),
    ('Remoção de Restrições', 'Serviços para remover restrições de fabricantes e operadoras', 2),
    ('Bypass', 'Serviços de bypass para diversos tipos de bloqueios', 3);

-- Inserir serviços iniciais
INSERT INTO public.servicos (nome, descricao_curta, descricao_completa, preco, tempo_estimado, categoria_id, favorito)
VALUES 
    (
        'Desbloqueio BLACKLIST', 
        'Remoção do celular da lista negra de operadoras', 
        'Nosso serviço de desbloqueio BLACKLIST remove seu dispositivo da lista negra das operadoras, permitindo que você utilize qualquer chip de qualquer operadora novamente. Processo seguro e garantido.', 
        150.00, 
        '2-3 dias úteis', 
        (SELECT id FROM public.categorias WHERE nome = 'Remoção de Restrições'),
        TRUE
    ),
    (
        'Desbloqueio ICLOUD', 
        'Remoção de conta iCloud bloqueada', 
        'Nosso serviço de desbloqueio ICLOUD remove a conta iCloud bloqueada do seu iPhone ou iPad, permitindo que você configure uma nova conta e use todas as funcionalidades do dispositivo novamente. Compatível com diversos modelos de iPhone e iPad.', 
        200.00, 
        '3-5 dias úteis', 
        (SELECT id FROM public.categorias WHERE nome = 'Remoção de Restrições'),
        TRUE
    ),
    (
        'BYPASS FRP Google', 
        'Remoção da verificação de conta Google', 
        'Nosso serviço de BYPASS FRP permite remover a proteção de conta Google (Factory Reset Protection) de dispositivos Android, possibilitando configurar uma nova conta após o reset de fábrica sem precisar das credenciais anteriores.', 
        120.00, 
        '1-2 dias úteis', 
        (SELECT id FROM public.categorias WHERE nome = 'Bypass'),
        TRUE
    );

-- Configurar políticas de segurança RLS (Row Level Security)

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_status ENABLE ROW LEVEL SECURITY;

-- Políticas para usuários
-- Apenas admins podem ler todos os usuários
CREATE POLICY admin_read_usuarios ON public.usuarios 
    FOR SELECT 
    USING (
        auth.uid() IN (SELECT id FROM public.usuarios WHERE role = 'admin')
    );

-- Usuários podem ler apenas seus próprios dados
CREATE POLICY user_read_self ON public.usuarios 
    FOR SELECT 
    USING (auth.uid() = id);

-- Apenas admins podem atualizar qualquer usuário
CREATE POLICY admin_update_usuarios ON public.usuarios 
    FOR UPDATE 
    USING (
        auth.uid() IN (SELECT id FROM public.usuarios WHERE role = 'admin')
    );

-- Usuários podem atualizar apenas seus próprios dados
CREATE POLICY user_update_self ON public.usuarios 
    FOR UPDATE 
    USING (auth.uid() = id);

-- Políticas para categorias e serviços
-- Qualquer um pode ler categorias e serviços ativos
CREATE POLICY public_read_categorias ON public.categorias 
    FOR SELECT 
    USING (ativo = TRUE);

CREATE POLICY public_read_servicos ON public.servicos 
    FOR SELECT 
    USING (ativo = TRUE);

-- Apenas admins podem modificar categorias e serviços
CREATE POLICY admin_all_categorias ON public.categorias 
    FOR ALL 
    USING (
        auth.uid() IN (SELECT id FROM public.usuarios WHERE role = 'admin')
    );

CREATE POLICY admin_all_servicos ON public.servicos 
    FOR ALL 
    USING (
        auth.uid() IN (SELECT id FROM public.usuarios WHERE role = 'admin')
    );

-- Políticas para pedidos
-- Usuários podem ver apenas seus próprios pedidos
CREATE POLICY user_read_own_pedidos ON public.pedidos 
    FOR SELECT 
    USING (auth.uid() = usuario_id);

-- Admins podem ver todos os pedidos
CREATE POLICY admin_read_all_pedidos ON public.pedidos 
    FOR SELECT 
    USING (
        auth.uid() IN (SELECT id FROM public.usuarios WHERE role = 'admin')
    );

-- Usuários podem criar pedidos para si mesmos
CREATE POLICY user_create_own_pedidos ON public.pedidos 
    FOR INSERT 
    WITH CHECK (auth.uid() = usuario_id);

-- Admins podem atualizar qualquer pedido
CREATE POLICY admin_update_all_pedidos ON public.pedidos 
    FOR UPDATE 
    USING (
        auth.uid() IN (SELECT id FROM public.usuarios WHERE role = 'admin')
    );

-- Políticas para itens de pedido e histórico
-- Usuários podem ver itens apenas de seus próprios pedidos
CREATE POLICY user_read_own_itens ON public.itens_pedido 
    FOR SELECT 
    USING (
        pedido_id IN (SELECT id FROM public.pedidos WHERE usuario_id = auth.uid())
    );

-- Usuários podem ver histórico apenas de seus próprios pedidos
CREATE POLICY user_read_own_historico ON public.historico_status 
    FOR SELECT 
    USING (
        pedido_id IN (SELECT id FROM public.pedidos WHERE usuario_id = auth.uid())
    );

-- Admins podem ver todos os itens e históricos
CREATE POLICY admin_all_itens ON public.itens_pedido 
    FOR ALL 
    USING (
        auth.uid() IN (SELECT id FROM public.usuarios WHERE role = 'admin')
    );

CREATE POLICY admin_all_historico ON public.historico_status 
    FOR ALL 
    USING (
        auth.uid() IN (SELECT id FROM public.usuarios WHERE role = 'admin')
    );

-- Admins podem criar itens para qualquer pedido
CREATE POLICY admin_create_itens ON public.itens_pedido 
    FOR INSERT 
    WITH CHECK (
        auth.uid() IN (SELECT id FROM public.usuarios WHERE role = 'admin')
    );

-- Usuários podem criar itens apenas para seus próprios pedidos
CREATE POLICY user_create_own_itens ON public.itens_pedido 
    FOR INSERT 
    WITH CHECK (
        pedido_id IN (SELECT id FROM public.pedidos WHERE usuario_id = auth.uid())
    ); 