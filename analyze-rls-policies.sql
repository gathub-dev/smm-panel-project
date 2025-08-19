-- ===============================================
-- ANÁLISE COMPLETA DAS POLÍTICAS RLS
-- Execute este script no SQL Editor do Supabase
-- ===============================================

-- 1. VERIFICAR SE RLS ESTÁ HABILITADO NAS TABELAS PRINCIPAIS
SELECT 'STATUS DO RLS NAS TABELAS' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '🔒 RLS ATIVO'
        ELSE '🔓 RLS DESABILITADO'
    END as status
FROM pg_tables 
WHERE tablename IN ('users', 'settings', 'services', 'orders')
AND schemaname = 'public'
ORDER BY tablename;

-- 2. VERIFICAR TODAS AS POLÍTICAS RLS EXISTENTES
SELECT 'POLÍTICAS RLS EXISTENTES' as info;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as comando,
    qual as condicao_where,
    with_check as condicao_insert_update
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. VERIFICAR POLÍTICAS ESPECÍFICAS DA TABELA SETTINGS
SELECT 'POLÍTICAS DA TABELA SETTINGS' as info;
SELECT 
    policyname as nome_politica,
    cmd as comando,
    roles as papeis,
    qual as condicao,
    with_check as verificacao
FROM pg_policies 
WHERE tablename = 'settings'
AND schemaname = 'public';

-- 4. VERIFICAR POLÍTICAS DA TABELA USERS
SELECT 'POLÍTICAS DA TABELA USERS' as info;
SELECT 
    policyname as nome_politica,
    cmd as comando,
    roles as papeis,
    qual as condicao,
    with_check as verificacao
FROM pg_policies 
WHERE tablename = 'users'
AND schemaname = 'public';

-- 5. TESTAR ACESSO DIRETO À TABELA SETTINGS (como usuário autenticado)
SELECT 'TESTE DE ACESSO À TABELA SETTINGS' as info;
SELECT COUNT(*) as total_configuracoes FROM settings;

-- 6. TESTAR ACESSO À TABELA USERS
SELECT 'TESTE DE ACESSO À TABELA USERS' as info;
SELECT COUNT(*) as total_usuarios FROM users;

-- 7. VERIFICAR PERMISSÕES DO PAPEL 'authenticated'
SELECT 'PERMISSÕES DO PAPEL AUTHENTICATED' as info;
SELECT 
    table_name,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE grantee = 'authenticated'
AND table_name IN ('users', 'settings')
ORDER BY table_name, privilege_type;

-- 8. VERIFICAR PERMISSÕES DO PAPEL 'anon'
SELECT 'PERMISSÕES DO PAPEL ANON' as info;
SELECT 
    table_name,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE grantee = 'anon'
AND table_name IN ('users', 'settings')
ORDER BY table_name, privilege_type;

-- 9. VERIFICAR SE EXISTE POLÍTICA PARA ADMINS
SELECT 'VERIFICAÇÃO DE POLÍTICAS PARA ADMINS' as info;
SELECT 
    policyname,
    tablename,
    qual
FROM pg_policies 
WHERE (
    qual LIKE '%admin%' OR 
    qual LIKE '%role%' OR
    policyname LIKE '%admin%'
)
AND schemaname = 'public';

-- 10. SUGESTÕES DE POLÍTICAS CASO ESTEJAM FALTANDO
SELECT 'DIAGNÓSTICO E SUGESTÕES' as info;

-- Verificar se existe pelo menos uma política para settings
DO $$
DECLARE
    settings_policies_count INTEGER;
    users_policies_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO settings_policies_count 
    FROM pg_policies 
    WHERE tablename = 'settings' AND schemaname = 'public';
    
    SELECT COUNT(*) INTO users_policies_count 
    FROM pg_policies 
    WHERE tablename = 'users' AND schemaname = 'public';
    
    RAISE NOTICE 'Políticas na tabela settings: %', settings_policies_count;
    RAISE NOTICE 'Políticas na tabela users: %', users_policies_count;
    
    IF settings_policies_count = 0 THEN
        RAISE NOTICE 'PROBLEMA: Tabela settings não tem políticas RLS - isso pode bloquear acesso';
    END IF;
    
    IF users_policies_count = 0 THEN
        RAISE NOTICE 'PROBLEMA: Tabela users não tem políticas RLS - isso pode bloquear acesso';
    END IF;
END $$;

-- 11. CRIAR POLÍTICAS BÁSICAS SE NÃO EXISTIREM (OPCIONAL)
-- Descomente as linhas abaixo se quiser criar políticas básicas

/*
-- Política para permitir que usuários autenticados vejam configurações públicas
CREATE POLICY IF NOT EXISTS "settings_read_public" ON settings
    FOR SELECT 
    TO authenticated
    USING (is_public = true OR auth.uid() IN (
        SELECT id FROM users WHERE role = 'admin'
    ));

-- Política para permitir que admins vejam todas as configurações
CREATE POLICY IF NOT EXISTS "settings_admin_full_access" ON settings
    FOR ALL 
    TO authenticated
    USING (auth.uid() IN (
        SELECT id FROM users WHERE role = 'admin'
    ));

-- Política para permitir que usuários vejam seus próprios dados
CREATE POLICY IF NOT EXISTS "users_read_own" ON users
    FOR SELECT 
    TO authenticated
    USING (auth.uid() = id OR auth.uid() IN (
        SELECT id FROM users WHERE role = 'admin'
    ));

-- Política para permitir que admins vejam todos os usuários
CREATE POLICY IF NOT EXISTS "users_admin_read_all" ON users
    FOR SELECT 
    TO authenticated
    USING (auth.uid() IN (
        SELECT id FROM users WHERE role = 'admin'
    ));
*/
