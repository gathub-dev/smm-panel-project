-- Criar tabela para armazenar cotações de moeda
CREATE TABLE IF NOT EXISTS exchange_rates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    currency_pair VARCHAR(10) NOT NULL, -- Ex: 'USD_BRL'
    rate DECIMAL(10,4) NOT NULL, -- Taxa de câmbio
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para busca rápida por par de moedas
CREATE INDEX IF NOT EXISTS idx_exchange_rates_currency_pair 
ON exchange_rates(currency_pair);

-- Índice para busca por data
CREATE INDEX IF NOT EXISTS idx_exchange_rates_updated_at 
ON exchange_rates(updated_at DESC);

-- RLS (Row Level Security) - permitir acesso total para service role
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas as operações
CREATE POLICY "Permitir todas operações em exchange_rates" 
ON exchange_rates FOR ALL 
USING (true) 
WITH CHECK (true);

-- Comentários
COMMENT ON TABLE exchange_rates IS 'Armazena cotações de moedas para conversão automática';
COMMENT ON COLUMN exchange_rates.currency_pair IS 'Par de moedas no formato ORIGEM_DESTINO (ex: USD_BRL)';
COMMENT ON COLUMN exchange_rates.rate IS 'Taxa de conversão (1 unidade da moeda origem = rate unidades da moeda destino)'; 