-- SCRIPT SEGURO PARA ANÁLISE DO BANCO DE DADOS
-- Execute este script no SQL Editor do Supabase

-- =====================================================
-- 1. VERIFICAR TODAS AS TABELAS DISPONÍVEIS
-- =====================================================
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname IN ('public', 'auth')
ORDER BY schemaname, tablename;

-- =====================================================
-- 2. VERIFICAR COLUNAS DA TABELA AUTH.USERS
-- =====================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'auth'
ORDER BY ordinal_position;

-- =====================================================
-- 3. VERIFICAR COLUNAS DA TABELA PUBLIC.USERS
-- =====================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- 4. DADOS DA TABELA PUBLIC.USERS
-- =====================================================
SELECT 
    id,
    email,
    full_name,
    role,
    status,
    created_at,
    updated_at
FROM public.users 
ORDER BY created_at DESC 
LIMIT 10;

-- =====================================================
-- 5. VERIFICAR TIPOS ENUM EXISTENTES
-- =====================================================
SELECT 
    t.typname AS enum_name,
    e.enumlabel AS enum_value,
    e.enumsortorder
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
ORDER BY t.typname, e.enumsortorder;

-- =====================================================
-- 6. VERIFICAR CONSTRAINTS DA TABELA USERS
-- =====================================================
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'users' 
  AND tc.table_schema = 'public'
ORDER BY tc.constraint_type, tc.constraint_name;

-- =====================================================
-- 7. VERIFICAR VALORES ÚNICOS DE ROLE E STATUS
-- =====================================================
SELECT 
    'role' as campo,
    role as valor,
    COUNT(*) as quantidade
FROM public.users 
WHERE role IS NOT NULL
GROUP BY role
UNION ALL
SELECT 
    'status' as campo,
    status as valor,
    COUNT(*) as quantidade
FROM public.users 
WHERE status IS NOT NULL
GROUP BY status
ORDER BY campo, quantidade DESC;

-- =====================================================
-- 8. VERIFICAR ESTRUTURA DA TABELA SETTINGS
-- =====================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'settings' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- 9. VERIFICAR DADOS DA TABELA SETTINGS
-- =====================================================
SELECT 
    key,
    value,
    description,
    created_at,
    updated_at
FROM public.settings 
ORDER BY key
LIMIT 20;

-- =====================================================
-- 10. VERIFICAR AUTH.USERS (APENAS COLUNAS EXISTENTES)
-- =====================================================
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- =====================================================
-- 11. VERIFICAR POLÍTICAS RLS
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
-- 12. DIAGNÓSTICO DO PROBLEMA ESPECÍFICO
-- =====================================================

-- Verificar se existe problema com enum na coluna role
SELECT 
    c.column_name,
    c.data_type,
    c.udt_name,
    t.typname as enum_type
FROM information_schema.columns c
LEFT JOIN pg_type t ON c.udt_name = t.typname
WHERE c.table_name = 'users' 
  AND c.table_schema = 'public'
  AND c.column_name IN ('role', 'status');

-- =====================================================
-- 13. ESTATÍSTICAS GERAIS
-- =====================================================
SELECT 
    'Total usuários' as metrica,
    COUNT(*)::text as valor
FROM public.users
UNION ALL
SELECT 
    'Usuários com role admin' as metrica,
    COUNT(*)::text as valor
FROM public.users 
WHERE role = 'admin'
UNION ALL
SELECT 
    'Usuários ativos' as metrica,
    COUNT(*)::text as valor
FROM public.users 
WHERE status = 'active'
UNION ALL
SELECT 
    'Total configurações' as metrica,
    COUNT(*)::text as valor
FROM public.settings;

-- =====================================================
-- 14. VERIFICAR ERROS COMUNS
-- =====================================================

-- Tentar identificar o problema específico do role
DO $$
BEGIN
    -- Verificar se conseguimos inserir um teste
    BEGIN
        INSERT INTO public.users (id, email, role, status) 
        VALUES (gen_random_uuid(), 'teste@teste.com', 'admin', 'active');
        
        DELETE FROM public.users WHERE email = 'teste@teste.com';
        RAISE NOTICE 'SUCESSO: Conseguiu inserir role admin';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ERRO ao inserir role admin: %', SQLERRM;
    END;
END $$;
