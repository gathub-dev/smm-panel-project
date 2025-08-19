-- Adicionar colunas para suporte a moeda e categorias bilíngues
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS category_pt VARCHAR(255),
ADD COLUMN IF NOT EXISTS provider_rate_brl DECIMAL(10,4),
ADD COLUMN IF NOT EXISTS rate_usd DECIMAL(10,4),
ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(10,4);

-- Comentários das novas colunas
COMMENT ON COLUMN services.category_pt IS 'Categoria em português para exibição ao cliente';
COMMENT ON COLUMN services.provider_rate_brl IS 'Preço original do provedor convertido para BRL';
COMMENT ON COLUMN services.rate_usd IS 'Preço final em USD (para referência)';
COMMENT ON COLUMN services.exchange_rate IS 'Taxa de câmbio USD/BRL usada na conversão';

-- Atualizar serviços existentes com valores padrão
UPDATE services 
SET 
  category_pt = CASE 
    WHEN category = 'Instagram' THEN 'Instagram'
    WHEN category = 'TikTok' THEN 'TikTok'
    WHEN category = 'YouTube' THEN 'YouTube'
    WHEN category = 'Facebook' THEN 'Facebook'
    WHEN category = 'Twitter' THEN 'Twitter/X'
    WHEN category = 'Other' THEN 'Outros'
    ELSE COALESCE(category, 'Outros')
  END,
  provider_rate_brl = provider_rate * 5.50, -- Cotação padrão
  rate_usd = rate / 5.50, -- Assumindo que rate atual está em BRL
  exchange_rate = 5.50
WHERE category_pt IS NULL OR provider_rate_brl IS NULL; 