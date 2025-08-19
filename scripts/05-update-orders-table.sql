-- Atualizar tabela orders para integração completa com APIs MTP/JAP
-- Adicionar campos necessários para rastreamento completo

-- Adicionar campos para integração com APIs
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS provider TEXT CHECK (provider IN ('mtp', 'jap'));
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS provider_cost DECIMAL(10,4);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS markup_percentage DECIMAL(5,2) DEFAULT 0.00;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS profit DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS refill_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancel_available BOOLEAN DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS refill_available BOOLEAN DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS last_status_check TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_data JSONB;

-- Adicionar campos para tipos especiais de pedidos
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS comments TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS usernames TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS hashtags TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS keywords TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS runs INTEGER;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS interval_minutes INTEGER;

-- Atualizar status para incluir novos estados
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('pending', 'in_progress', 'completed', 'partial', 'processing', 'canceled', 'error', 'refunded'));

-- Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_orders_provider ON public.orders(provider);
CREATE INDEX IF NOT EXISTS idx_orders_provider_order_id ON public.orders(provider_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_last_status_check ON public.orders(last_status_check);

-- Adicionar tabela para logs de sincronização
CREATE TABLE IF NOT EXISTS public.sync_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  provider TEXT NOT NULL CHECK (provider IN ('mtp', 'jap')),
  action TEXT NOT NULL CHECK (action IN ('sync_services', 'create_order', 'check_status', 'refill', 'cancel')),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  request_data JSONB,
  response_data JSONB,
  success BOOLEAN DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_logs_provider ON public.sync_logs(provider);
CREATE INDEX IF NOT EXISTS idx_sync_logs_action ON public.sync_logs(action);
CREATE INDEX IF NOT EXISTS idx_sync_logs_created_at ON public.sync_logs(created_at);

-- Atualizar tabela services para markup
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS provider_rate DECIMAL(10,4);
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS markup_type TEXT DEFAULT 'percentage' CHECK (markup_type IN ('percentage', 'fixed'));
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS markup_value DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS last_sync TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS sync_enabled BOOLEAN DEFAULT true;

-- Função para calcular preço com markup
CREATE OR REPLACE FUNCTION calculate_service_price(provider_rate DECIMAL, markup_type TEXT, markup_value DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
  IF markup_type = 'percentage' THEN
    RETURN provider_rate * (1 + markup_value / 100);
  ELSE
    RETURN provider_rate + markup_value;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar preço automaticamente
CREATE OR REPLACE FUNCTION update_service_rate()
RETURNS TRIGGER AS $$
BEGIN
  NEW.rate = calculate_service_price(NEW.provider_rate, NEW.markup_type, NEW.markup_value);
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_service_rate
  BEFORE INSERT OR UPDATE OF provider_rate, markup_type, markup_value
  ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION update_service_rate(); 