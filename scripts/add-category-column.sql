-- Adicionar coluna category na tabela services

-- 1. Adicionar a coluna category
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Outros';

-- 2. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_services_category ON public.services(category);

-- 3. Verificar se funcionou
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'services' 
AND table_schema = 'public'
ORDER BY ordinal_position; 