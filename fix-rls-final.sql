-- CORREÇÃO FINAL DO PROBLEMA RLS
-- O erro persiste mesmo com service role, vamos investigar e corrigir

-- =====================================================
-- 1. VERIFICAR SE O PROBLEMA É NA POLÍTICA OU NO POSTGRES
-- =====================================================

-- Testar acesso direto aos dados (sem RLS)
SELECT 'Teste direto na tabela users:' as teste;
SELECT id, email, role, status FROM public.users LIMIT 2;

-- =====================================================
-- 2. DESABILITAR TEMPORARIAMENTE TODAS AS POLÍTICAS RLS
-- =====================================================

-- Desabilitar RLS completamente para teste
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;

SELECT 'RLS desabilitado temporariamente' as status;

-- =====================================================
-- 3. TESTAR ACESSO APÓS DESABILITAR RLS
-- =====================================================

-- Verificar se agora conseguimos acessar os dados
SELECT 'Teste após desabilitar RLS:' as teste;
SELECT id, email, role, status FROM public.users WHERE role = 'admin';

-- =====================================================
-- 4. VERIFICAR SE EXISTE ALGUM PROBLEMA COM ROLES DO POSTGRES
-- =====================================================

-- Verificar roles do PostgreSQL (não confundir com role da aplicação)
SELECT rolname, rolsuper, rolcreaterole, rolcreatedb 
FROM pg_roles 
WHERE rolname IN ('postgres', 'supabase_admin', 'authenticated', 'anon', 'service_role');

-- =====================================================
-- 5. RECRIAR POLÍTICAS MAIS SIMPLES E FUNCIONAIS
-- =====================================================

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Admin can manage settings" ON public.settings;
DROP POLICY IF EXISTS "settings_authenticated_access" ON public.settings;
DROP POLICY IF EXISTS "Admin can insert users" ON public.users;
DROP POLICY IF EXISTS "Admin can update all users" ON public.users;
DROP POLICY IF EXISTS "Admin can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "users_authenticated_access" ON public.users;

-- Reabilitar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. CRIAR POLÍTICAS MAIS SIMPLES E FUNCIONAIS
-- =====================================================

-- Política simples para usuários: podem ver e editar próprio perfil
CREATE POLICY "users_own_profile" ON public.users
    FOR ALL
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Política para service_role: acesso total (para operações admin)
CREATE POLICY "service_role_access_users" ON public.users
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Política para settings: apenas service_role
CREATE POLICY "service_role_access_settings" ON public.settings
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- 7. VERIFICAR POLÍTICAS CRIADAS
-- =====================================================

SELECT 
    schemaname,
    tablename,
    policyname,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('users', 'settings')
ORDER BY tablename, policyname;

-- =====================================================
-- 8. TESTE FINAL
-- =====================================================

SELECT 'Teste final - políticas simples criadas' as status;

-- =====================================================
-- 9. ALTERNATIVA: MANTER RLS DESABILITADO (SE NECESSÁRIO)
-- =====================================================

-- Se as políticas ainda não funcionarem, descomente as linhas abaixo:
-- ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;
-- SELECT 'RLS completamente desabilitado - CUIDADO COM SEGURANÇA!' as aviso;

SELECT 'Script executado com sucesso!' as resultado;
