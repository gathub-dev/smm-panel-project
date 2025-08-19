-- FASE 1: Adicionar campos para sistema de loja
-- Execute este SQL no painel do Supabase (SQL Editor)

ALTER TABLE services 
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS lp_visible BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS quantities JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS shop_category TEXT DEFAULT 'outros';

-- Comentar os campos adicionados
COMMENT ON COLUMN services.featured IS 'Marca serviço como destaque para mais vendidos';
COMMENT ON COLUMN services.lp_visible IS 'Serviço visível na landing page simples';
COMMENT ON COLUMN services.quantities IS 'Array JSON com quantidades disponíveis [100,250,500]';
COMMENT ON COLUMN services.shop_category IS 'Categoria do serviço na loja (seguidores, curtidas, etc)';

-- Definir quantidades padrão para serviços existentes
UPDATE services 
SET quantities = '[100, 250, 500, 1000, 2500, 5000]'::jsonb,
    shop_category = 'seguidores'
WHERE name ILIKE '%seguidores%';

UPDATE services 
SET quantities = '[50, 100, 250, 500, 1000, 2000]'::jsonb,
    shop_category = 'curtidas'  
WHERE name ILIKE '%curtidas%' OR name ILIKE '%likes%';

UPDATE services 
SET quantities = '[25, 50, 100, 200, 300, 500]'::jsonb,
    shop_category = 'seguidores'
WHERE name ILIKE '%followers%';

UPDATE services 
SET quantities = '[700, 850, 1000, 1500, 2000, 5000]'::jsonb,
    shop_category = 'seguidores'
WHERE name ILIKE '%brasileiro%';

-- Marcar alguns serviços como visíveis na LP (exemplo)
UPDATE services 
SET lp_visible = true,
    featured = false
WHERE shop_category IN ('seguidores', 'curtidas')
  AND status = 'active'
LIMIT 10;

-- Verificar se os campos foram adicionados
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'services' 
  AND column_name IN ('featured', 'lp_visible', 'quantities', 'shop_category')
ORDER BY column_name;