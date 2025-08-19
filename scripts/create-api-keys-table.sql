-- Criar tabela api_keys (RÁPIDO)
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL CHECK (provider IN ('mtp', 'jap')),
  api_key TEXT NOT NULL,
  api_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(provider)
);

-- Permitir acesso para usuários autenticados
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Política para admins
CREATE POLICY "Admins can manage API keys" ON public.api_keys
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Índices
CREATE INDEX IF NOT EXISTS idx_api_keys_provider ON public.api_keys(provider);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON public.api_keys(is_active);

-- Comentários
COMMENT ON TABLE public.api_keys IS 'Chaves de API dos provedores SMM';
COMMENT ON COLUMN public.api_keys.provider IS 'Provedor: mtp ou jap';
COMMENT ON COLUMN public.api_keys.api_key IS 'Chave de API do provedor';
COMMENT ON COLUMN public.api_keys.is_active IS 'Se a chave está ativa'; 