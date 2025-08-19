-- Corrigir tabela services - Adicionar todas as colunas necessárias

-- 1. Adicionar colunas que estão faltando
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Outros',
ADD COLUMN IF NOT EXISTS provider_rate DECIMAL(10,4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS markup_type TEXT DEFAULT 'percentage' CHECK (markup_type IN ('percentage', 'fixed')),
ADD COLUMN IF NOT EXISTS markup_value DECIMAL(10,4) DEFAULT 20,
ADD COLUMN IF NOT EXISTS sync_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_sync TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS provider TEXT,
ADD COLUMN IF NOT EXISTS provider_service_id TEXT;

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_services_category ON public.services(category);
CREATE INDEX IF NOT EXISTS idx_services_provider ON public.services(provider);
CREATE INDEX IF NOT EXISTS idx_services_provider_service_id ON public.services(provider_service_id);
CREATE INDEX IF NOT EXISTS idx_services_sync_enabled ON public.services(sync_enabled);
CREATE INDEX IF NOT EXISTS idx_services_last_sync ON public.services(last_sync);

-- 3. Criar constraint única para evitar duplicatas
ALTER TABLE public.services 
DROP CONSTRAINT IF EXISTS unique_provider_service;

ALTER TABLE public.services 
ADD CONSTRAINT unique_provider_service 
UNIQUE (provider, provider_service_id);

-- 4. Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'services' 
AND table_schema = 'public'
ORDER BY ordinal_position; 