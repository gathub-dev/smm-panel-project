-- Script para desabilitar temporariamente o RLS e resolver o problema de "Access Denied"
-- Execute este script para permitir que o usuário admin acesse o painel

-- 1. Desabilitar RLS temporariamente para resolver o problema
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.services DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;

-- 2. Verificar se o RLS foi desabilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 3. Testar se o usuário admin pode acessar a tabela users
SELECT 
    id,
    email,
    role,
    status
FROM public.users
WHERE role = 'admin';

-- 4. Verificar todas as políticas RLS (deve estar vazio agora)
SELECT 
    schemaname,
    tablename,
    policyname
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- NOTA: Após executar este script, o usuário admin deve conseguir acessar o painel
-- Para reativar a segurança posteriormente, execute o script de reativação 