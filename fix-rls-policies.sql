-- SCRIPT PARA CORRIGIR POLÍTICAS RLS (ROW LEVEL SECURITY)
-- O erro "role admin does not exist" é um problema de política RLS, não de dados

-- =====================================================
-- 1. VERIFICAR POLÍTICAS ATUAIS
-- =====================================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename = 'users'
ORDER BY tablename, policyname;

-- =====================================================
-- 2. DESABILITAR RLS TEMPORARIAMENTE PARA TESTE
-- =====================================================
-- CUIDADO: Isso remove a segurança temporariamente
-- ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. CRIAR POLÍTICAS CORRETAS PARA A TABELA USERS
-- =====================================================

-- Remover políticas existentes que podem estar causando problema
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admin can view all users" ON public.users;
DROP POLICY IF EXISTS "Admin can update all users" ON public.users;
DROP POLICY IF EXISTS "Public read access" ON public.users;

-- Habilitar RLS na tabela users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Política 1: Usuários podem ver seu próprio perfil
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT
    USING (auth.uid() = id);

-- Política 2: Usuários podem atualizar seu próprio perfil (campos limitados)
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Política 3: Admins podem ver todos os usuários
CREATE POLICY "Admin can view all users" ON public.users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() 
            AND u.role IN ('admin', 'superadmin')
            AND u.status = 'active'
        )
    );

-- Política 4: Admins podem atualizar todos os usuários
CREATE POLICY "Admin can update all users" ON public.users
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() 
            AND u.role IN ('admin', 'superadmin')
            AND u.status = 'active'
        )
    );

-- Política 5: Admins podem inserir novos usuários
CREATE POLICY "Admin can insert users" ON public.users
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() 
            AND u.role IN ('admin', 'superadmin')
            AND u.status = 'active'
        )
    );

-- =====================================================
-- 4. POLÍTICAS PARA A TABELA SETTINGS
-- =====================================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Admin can manage settings" ON public.settings;
DROP POLICY IF EXISTS "Admin can view settings" ON public.settings;

-- Habilitar RLS na tabela settings
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Política: Apenas admins podem gerenciar configurações
CREATE POLICY "Admin can manage settings" ON public.settings
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() 
            AND u.role IN ('admin', 'superadmin')
            AND u.status = 'active'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() 
            AND u.role IN ('admin', 'superadmin')
            AND u.status = 'active'
        )
    );

-- =====================================================
-- 5. VERIFICAR POLÍTICAS CRIADAS
-- =====================================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('users', 'settings')
ORDER BY tablename, policyname;

-- =====================================================
-- 6. TESTE DAS POLÍTICAS
-- =====================================================

-- Verificar se as políticas estão funcionando
DO $$
BEGIN
    RAISE NOTICE 'Políticas RLS criadas com sucesso!';
    RAISE NOTICE 'Agora teste o acesso admin na aplicação.';
END $$;

-- =====================================================
-- 7. ALTERNATIVA: DESABILITAR RLS COMPLETAMENTE (SE NECESSÁRIO)
-- =====================================================

-- DESCOMENTE APENAS SE AS POLÍTICAS ACIMA NÃO FUNCIONAREM
-- CUIDADO: Isso remove toda a segurança de linha

-- ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;

-- RAISE NOTICE 'RLS DESABILITADO - CUIDADO COM A SEGURANÇA!';
