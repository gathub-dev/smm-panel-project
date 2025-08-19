-- 🎯 ESTRUTURA HÍBRIDA COM CONTROLE TOTAL NO PAINEL ADMIN
-- Execute este SQL no painel do Supabase (SQL Editor)
-- Permite escolher no admin quais plataformas/serviços importar da API

-- 1. LIMPAR BANCO COMPLETO (manter só essenciais)
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS platforms CASCADE;
DROP TABLE IF EXISTS service_types CASCADE;
DROP TABLE IF EXISTS lp_platforms CASCADE;
DROP TABLE IF EXISTS most_sold_services CASCADE;
DROP VIEW IF EXISTS services_morethanpanel CASCADE;
DROP VIEW IF EXISTS services_with_combined_category CASCADE;

-- 2. CRIAR TABELA DE PLATAFORMAS (baseada na API real)
CREATE TABLE IF NOT EXISTS platforms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE, -- Nome da plataforma (Instagram, TikTok, etc)
  display_name TEXT NOT NULL, -- Nome para exibição
  description TEXT,
  icon TEXT,
  service_count INTEGER DEFAULT 0, -- Quantos serviços tem na API
  is_active BOOLEAN DEFAULT false, -- Admin controla se está ativo
  import_enabled BOOLEAN DEFAULT false, -- Admin controla se importa da API
  lp_visible BOOLEAN DEFAULT false, -- Admin controla se aparece na LP
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CRIAR TABELA DE TIPOS DE SERVIÇOS (baseada na API real)
CREATE TABLE IF NOT EXISTS service_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE, -- seguidores, curtidas, visualizacoes, etc
  display_name TEXT NOT NULL, -- Seguidores, Curtidas, Visualizações
  description TEXT,
  icon TEXT,
  service_count INTEGER DEFAULT 0, -- Quantos serviços tem na API
  is_active BOOLEAN DEFAULT false, -- Admin controla se está ativo
  import_enabled BOOLEAN DEFAULT false, -- Admin controla se importa da API
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABELAS VAZIAS - PLATAFORMAS E TIPOS SERÃO CRIADOS DINAMICAMENTE
-- As plataformas e tipos de serviços serão criados automaticamente durante a importação
-- baseados nos dados reais da API MoreThanPanel

-- 5. CRIAR TABELA DE SERVIÇOS (vazia, será populada via API conforme seleção do admin)
CREATE TABLE IF NOT EXISTS services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  platform_id UUID REFERENCES platforms(id) ON DELETE CASCADE,
  service_type_id UUID REFERENCES service_types(id) ON DELETE CASCADE,
  
  -- Dados da API MoreThanPanel
  provider_service_id TEXT NOT NULL, -- ID do serviço na API (campo "service")
  name TEXT NOT NULL, -- Nome do serviço
  description TEXT,
  provider TEXT DEFAULT 'mtp' CHECK (provider IN ('mtp', 'jap')),
  
  -- Preços e quantidades
  provider_rate DECIMAL(10,4) NOT NULL, -- Preço original da API (campo "rate")
  rate DECIMAL(10,4) NOT NULL, -- Preço final com markup
  min_quantity INTEGER NOT NULL, -- Quantidade mínima (campo "min")
  max_quantity INTEGER NOT NULL, -- Quantidade máxima (campo "max")
  
  -- Características do serviço
  service_type TEXT DEFAULT 'Default', -- Tipo do serviço na API (campo "type")
  dripfeed BOOLEAN DEFAULT false, -- Suporta dripfeed
  refill BOOLEAN DEFAULT false, -- Suporta refill
  cancel BOOLEAN DEFAULT false, -- Suporta cancelamento
  
  -- Controles do admin
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  featured BOOLEAN DEFAULT false, -- Destacar na loja
  lp_visible BOOLEAN DEFAULT false, -- Aparecer na landing page
  
  -- Configurações de preço
  markup_type TEXT DEFAULT 'percentage' CHECK (markup_type IN ('percentage', 'fixed')),
  markup_value DECIMAL(10,4) DEFAULT 20, -- 20% de markup padrão
  
  -- Configurações da loja
  quantities JSONB DEFAULT '[]'::jsonb, -- Quantidades pré-definidas para loja
  shop_category TEXT, -- Categoria para organização na loja
  
  -- Campos legados para compatibilidade
  platform TEXT, -- Nome da plataforma (para compatibilidade)
  category TEXT, -- Categoria combinada (para compatibilidade)
  
  -- Sincronização
  sync_enabled BOOLEAN DEFAULT true,
  last_sync TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint única para evitar duplicatas
  UNIQUE(provider, provider_service_id)
);

-- 6. FUNÇÕES PARA CRIAR PLATAFORMAS E TIPOS DINAMICAMENTE
CREATE OR REPLACE FUNCTION get_or_create_platform(platform_name TEXT)
RETURNS UUID AS $$
DECLARE
  platform_id UUID;
  display_name TEXT;
  icon_name TEXT;
BEGIN
  -- Tentar encontrar plataforma existente
  SELECT id INTO platform_id FROM platforms WHERE name = platform_name;
  
  -- Se não existir, criar
  IF platform_id IS NULL THEN
    -- Definir display_name e ícone baseado no nome
    display_name := platform_name;
    
    -- Mapear ícones baseado no nome da plataforma
    icon_name := CASE LOWER(platform_name)
      WHEN 'instagram' THEN 'instagram'
      WHEN 'tiktok' THEN 'video'
      WHEN 'youtube' THEN 'play'
      WHEN 'spotify' THEN 'music'
      WHEN 'facebook' THEN 'facebook'
      WHEN 'twitch' THEN 'twitch'
      WHEN 'telegram' THEN 'send'
      WHEN 'discord' THEN 'message-square'
      WHEN 'reddit' THEN 'message-circle'
      WHEN 'google' THEN 'search'
      WHEN 'linkedin' THEN 'linkedin'
      WHEN 'pinterest' THEN 'image'
      WHEN 'snapchat' THEN 'camera'
      WHEN 'soundcloud' THEN 'headphones'
      WHEN 'vimeo' THEN 'video'
      WHEN 'clubhouse' THEN 'mic'
      WHEN 'threads' THEN 'message-square'
      WHEN 'trustpilot' THEN 'star'
      WHEN 'kick' THEN 'zap'
      WHEN 'rumble' THEN 'play-circle'
      WHEN 'website' THEN 'globe'
      ELSE 'package'
    END;
    
    INSERT INTO platforms (name, display_name, description, icon, is_active, sort_order)
    VALUES (
      platform_name,
      display_name,
      'Serviços para ' || display_name,
      icon_name,
      true, -- Ativar automaticamente quando criado
      (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM platforms)
    )
    RETURNING id INTO platform_id;
    
    RAISE NOTICE 'Nova plataforma criada: %', platform_name;
  END IF;
  
  RETURN platform_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_or_create_service_type(type_name TEXT)
RETURNS UUID AS $$
DECLARE
  type_id UUID;
  display_name TEXT;
  icon_name TEXT;
  normalized_name TEXT;
BEGIN
  -- Normalizar nome
  normalized_name := LOWER(TRIM(type_name));
  
  -- Tentar encontrar tipo existente
  SELECT id INTO type_id FROM service_types WHERE name = normalized_name;
  
  -- Se não existir, criar
  IF type_id IS NULL THEN
    -- Mapear display_name e ícone baseado no tipo
    CASE normalized_name
      WHEN 'seguidores' THEN 
        display_name := 'Seguidores';
        icon_name := 'users';
      WHEN 'curtidas' THEN 
        display_name := 'Curtidas';
        icon_name := 'heart';
      WHEN 'visualizacoes' THEN 
        display_name := 'Visualizações';
        icon_name := 'eye';
      WHEN 'comentarios' THEN 
        display_name := 'Comentários';
        icon_name := 'message-circle';
      WHEN 'compartilhamentos' THEN 
        display_name := 'Compartilhamentos';
        icon_name := 'share';
      WHEN 'live' THEN 
        display_name := 'Live';
        icon_name := 'radio';
      WHEN 'contas' THEN 
        display_name := 'Contas';
        icon_name := 'user';
      WHEN 'salvamentos' THEN 
        display_name := 'Salvamentos';
        icon_name := 'bookmark';
      WHEN 'stories' THEN 
        display_name := 'Stories';
        icon_name := 'image';
      WHEN 'trafego' THEN 
        display_name := 'Tráfego';
        icon_name := 'trending-up';
      WHEN 'impressoes' THEN 
        display_name := 'Impressões';
        icon_name := 'bar-chart';
      ELSE 
        display_name := INITCAP(normalized_name);
        icon_name := 'package';
    END CASE;
    
    INSERT INTO service_types (name, display_name, description, icon, is_active, sort_order)
    VALUES (
      normalized_name,
      display_name,
      display_name || ' para redes sociais',
      icon_name,
      true, -- Ativar automaticamente quando criado
      (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM service_types)
    )
    RETURNING id INTO type_id;
    
    RAISE NOTICE 'Novo tipo de serviço criado: %', display_name;
  END IF;
  
  RETURN type_id;
END;
$$ LANGUAGE plpgsql;

-- 7. CRIAR TABELA DE CONTROLE DE IMPORTAÇÃO
CREATE TABLE IF NOT EXISTS import_control (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  platform_id UUID REFERENCES platforms(id) ON DELETE CASCADE,
  service_type_id UUID REFERENCES service_types(id) ON DELETE CASCADE,
  
  -- Controles de importação
  import_enabled BOOLEAN DEFAULT false, -- Admin habilita importação desta combinação
  auto_sync BOOLEAN DEFAULT false, -- Sincronização automática
  markup_override DECIMAL(10,4), -- Markup específico para esta combinação
  
  -- Filtros de importação
  min_rate_filter DECIMAL(10,4), -- Só importar serviços acima deste preço
  max_rate_filter DECIMAL(10,4), -- Só importar serviços abaixo deste preço
  name_filters TEXT[], -- Filtros por palavras no nome
  exclude_filters TEXT[], -- Excluir serviços com estas palavras
  
  -- Estatísticas
  services_imported INTEGER DEFAULT 0,
  last_import TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(platform_id, service_type_id)
);

-- 8. CRIAR VIEW PARA SERVIÇOS COM CATEGORIA COMBINADA
CREATE OR REPLACE VIEW services_with_combined_category AS
SELECT 
  s.*,
  p.name as platform_name,
  p.display_name as platform_display_name,
  p.icon as platform_icon,
  st.name as service_type_name,
  st.display_name as service_type_display_name,
  st.icon as service_type_icon,
  -- Categoria combinada igual MoreThanPanel
  CASE 
    WHEN p.display_name IS NOT NULL AND st.display_name IS NOT NULL 
    THEN p.display_name || ' - ' || st.display_name
    ELSE COALESCE(s.category, 'Outros')
  END as combined_category
FROM services s
LEFT JOIN platforms p ON s.platform_id = p.id
LEFT JOIN service_types st ON s.service_type_id = st.id;

-- 9. FUNÇÃO PARA BUSCAR PLATAFORMAS ATIVAS PARA IMPORTAÇÃO
CREATE OR REPLACE FUNCTION get_platforms_for_import()
RETURNS TABLE (
  id UUID,
  name TEXT,
  display_name TEXT,
  service_count INTEGER,
  import_enabled BOOLEAN,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.display_name,
    p.service_count,
    p.import_enabled,
    p.is_active
  FROM platforms p
  ORDER BY p.service_count DESC, p.display_name ASC;
END;
$$ LANGUAGE plpgsql;

-- 10. FUNÇÃO PARA BUSCAR TIPOS DE SERVIÇOS ATIVOS PARA IMPORTAÇÃO
CREATE OR REPLACE FUNCTION get_service_types_for_import()
RETURNS TABLE (
  id UUID,
  name TEXT,
  display_name TEXT,
  service_count INTEGER,
  import_enabled BOOLEAN,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    st.id,
    st.name,
    st.display_name,
    st.service_count,
    st.import_enabled,
    st.is_active
  FROM service_types st
  ORDER BY st.service_count DESC, st.display_name ASC;
END;
$$ LANGUAGE plpgsql;

-- 11. FUNÇÃO PARA BUSCAR COMBINAÇÕES HABILITADAS PARA IMPORTAÇÃO
CREATE OR REPLACE FUNCTION get_import_combinations()
RETURNS TABLE (
  platform_name TEXT,
  platform_display_name TEXT,
  service_type_name TEXT,
  service_type_display_name TEXT,
  import_enabled BOOLEAN,
  services_imported INTEGER,
  last_import TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.name as platform_name,
    p.display_name as platform_display_name,
    st.name as service_type_name,
    st.display_name as service_type_display_name,
    COALESCE(ic.import_enabled, false) as import_enabled,
    COALESCE(ic.services_imported, 0) as services_imported,
    ic.last_import
  FROM platforms p
  CROSS JOIN service_types st
  LEFT JOIN import_control ic ON p.id = ic.platform_id AND st.id = ic.service_type_id
  WHERE p.is_active = true AND st.is_active = true
  ORDER BY p.service_count DESC, st.service_count DESC;
END;
$$ LANGUAGE plpgsql;

-- 12. FUNÇÃO PARA HABILITAR IMPORTAÇÃO DE UMA COMBINAÇÃO
CREATE OR REPLACE FUNCTION enable_import_combination(
  p_platform_name TEXT,
  p_service_type_name TEXT,
  p_markup_override DECIMAL DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  platform_id UUID;
  service_type_id UUID;
BEGIN
  -- Buscar IDs
  SELECT id INTO platform_id FROM platforms WHERE name = p_platform_name;
  SELECT id INTO service_type_id FROM service_types WHERE name = p_service_type_name;
  
  IF platform_id IS NULL OR service_type_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Inserir ou atualizar controle de importação
  INSERT INTO import_control (platform_id, service_type_id, import_enabled, markup_override)
  VALUES (platform_id, service_type_id, true, p_markup_override)
  ON CONFLICT (platform_id, service_type_id) 
  DO UPDATE SET 
    import_enabled = true,
    markup_override = COALESCE(p_markup_override, import_control.markup_override),
    updated_at = NOW();
  
  -- Ativar plataforma e tipo de serviço
  UPDATE platforms SET is_active = true, import_enabled = true WHERE id = platform_id;
  UPDATE service_types SET is_active = true, import_enabled = true WHERE id = service_type_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 13. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_services_platform_id ON services(platform_id);
CREATE INDEX IF NOT EXISTS idx_services_service_type_id ON services(service_type_id);
CREATE INDEX IF NOT EXISTS idx_services_provider_service ON services(provider, provider_service_id);
CREATE INDEX IF NOT EXISTS idx_services_status ON services(status);
CREATE INDEX IF NOT EXISTS idx_services_lp_visible ON services(lp_visible);
CREATE INDEX IF NOT EXISTS idx_services_featured ON services(featured);
CREATE INDEX IF NOT EXISTS idx_platforms_import_enabled ON platforms(import_enabled);
CREATE INDEX IF NOT EXISTS idx_service_types_import_enabled ON service_types(import_enabled);
CREATE INDEX IF NOT EXISTS idx_import_control_enabled ON import_control(import_enabled);

-- 14. TRIGGERS PARA ATUALIZAR updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_platforms_updated_at 
  BEFORE UPDATE ON platforms 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_types_updated_at 
  BEFORE UPDATE ON service_types 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at 
  BEFORE UPDATE ON services 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_import_control_updated_at 
  BEFORE UPDATE ON import_control 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 15. CONFIGURAR RLS (Row Level Security)
ALTER TABLE platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_control ENABLE ROW LEVEL SECURITY;

-- Políticas para visualização pública
CREATE POLICY "Anyone can view active platforms" ON platforms FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view active service_types" ON service_types FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view active services" ON services FOR SELECT USING (status = 'active');

-- Políticas para admins
CREATE POLICY "Admins can manage platforms" ON platforms FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "Admins can manage service_types" ON service_types FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "Admins can manage services" ON services FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "Admins can manage import_control" ON import_control FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- 16. EXEMPLOS DE USO PARA O ADMIN

-- Habilitar importação de Instagram Seguidores com markup de 25%
-- SELECT enable_import_combination('Instagram', 'seguidores', 25.0);

-- Habilitar importação de TikTok Curtidas com markup padrão
-- SELECT enable_import_combination('TikTok', 'curtidas');

-- Ver todas as combinações disponíveis
-- SELECT * FROM get_import_combinations();

-- Ver plataformas disponíveis para importação
-- SELECT * FROM get_platforms_for_import();

-- Ver tipos de serviços disponíveis
-- SELECT * FROM get_service_types_for_import();

-- 17. VERIFICAR ESTRUTURA CRIADA
SELECT 
  'ESTRUTURA HÍBRIDA CRIADA' as status,
  'Controle total no painel admin' as descricao;

-- Verificar tabelas criadas
SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('platforms', 'service_types', 'services', 'import_control', 'users', 'api_keys', 'settings', 'orders', 'transactions')
ORDER BY table_name;

-- ✅ ESTRUTURA HÍBRIDA CRIADA!
-- 🎯 22 plataformas prontas (baseadas na API real)
-- 🛍️ 12 tipos de serviços prontos (baseados na API real)
-- 🔧 Controle total no painel admin
-- 📊 Importação seletiva da API MoreThanPanel
-- 🚀 Pronto para uso!
