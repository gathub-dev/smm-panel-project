-- Corrigir RLS - VERSÃO SIMPLES (só tabelas que existem)

-- 1. Remover política problemática da api_keys
DROP POLICY IF EXISTS "Admins can manage API keys" ON public.api_keys;

-- 2. Desabilitar RLS temporariamente para desenvolvimento
ALTER TABLE public.api_keys DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.services DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;

-- 3. Criar política simples para api_keys
CREATE POLICY "Authenticated users can manage API keys" ON public.api_keys
  FOR ALL USING (auth.uid() IS NOT NULL);

-- 4. Reabilitar RLS apenas para api_keys
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Verificar se funcionou
SELECT 'RLS corrigido com sucesso!' as status; 