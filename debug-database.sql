-- SCRIPT COMPLETO PARA ANÁLISE DO BANCO DE DADOS
-- Execute este script no SQL Editor do Supabase para ver toda a estrutura

-- =====================================================
-- 1. VERIFICAR TODAS AS TABELAS
-- =====================================================
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- =====================================================
-- 2. ESTRUTURA DA TABELA USERS
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
-- 3. DADOS DA TABELA USERS (PRIMEIROS 10)
-- =====================================================
SELECT 
    id,
    email,
    full_name,
    role,
    status,
    created_at,
    updated_at
FROM users 
ORDER BY created_at DESC 
LIMIT 10;

-- =====================================================
-- 4. VERIFICAR ROLES/ENUMS EXISTENTES
-- =====================================================
SELECT 
    t.typname AS enum_name,
    e.enumlabel AS enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname LIKE '%role%' OR t.typname LIKE '%status%'
ORDER BY t.typname, e.enumsortorder;

-- =====================================================
-- 5. VERIFICAR CONSTRAINTS DA TABELA USERS
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
-- 6. ESTRUTURA DA TABELA SETTINGS
-- =====================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'settings' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- 7. DADOS DA TABELA SETTINGS
-- =====================================================
SELECT 
    key,
    value,
    description,
    created_at,
    updated_at
FROM settings 
ORDER BY key;

-- =====================================================
-- 8. VERIFICAR POLÍTICAS RLS (ROW LEVEL SECURITY)
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
ORDER BY tablename, policyname;

-- =====================================================
-- 9. VERIFICAR FUNÇÕES RELACIONADAS A ADMIN/USER
-- =====================================================
SELECT 
    routine_name,
    routine_type,
    data_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND (routine_name ILIKE '%admin%' 
       OR routine_name ILIKE '%user%' 
       OR routine_name ILIKE '%role%')
ORDER BY routine_name;

-- =====================================================
-- 10. VERIFICAR AUTH.USERS (TABELA DE AUTENTICAÇÃO)
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
LIMIT 10;

-- =====================================================
-- 11. VERIFICAR TODAS AS TABELAS E SUAS COLUNAS
-- =====================================================
SELECT 
    t.table_name,
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default
FROM information_schema.tables t
JOIN information_schema.columns c 
    ON t.table_name = c.table_name
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name, c.ordinal_position;

-- =====================================================
-- 12. VERIFICAR ÍNDICES
-- =====================================================
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- =====================================================
-- 13. VERIFICAR TRIGGERS
-- =====================================================
SELECT 
    trigger_schema,
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- =====================================================
-- 14. ESTATÍSTICAS DAS TABELAS PRINCIPAIS
-- =====================================================
SELECT 
    'users' as tabela,
    COUNT(*) as total_registros,
    COUNT(DISTINCT role) as roles_distintos,
    COUNT(DISTINCT status) as status_distintos
FROM users
UNION ALL
SELECT 
    'settings' as tabela,
    COUNT(*) as total_registros,
    COUNT(DISTINCT key) as chaves_distintas,
    0 as status_distintos
FROM settings;

-- =====================================================
-- 15. VERIFICAR VALORES ÚNICOS DE ROLE E STATUS
-- =====================================================
SELECT 
    'role' as campo,
    role as valor,
    COUNT(*) as quantidade
FROM users 
WHERE role IS NOT NULL
GROUP BY role
UNION ALL
SELECT 
    'status' as campo,
    status as valor,
    COUNT(*) as quantidade
FROM users 
WHERE status IS NOT NULL
GROUP BY status
ORDER BY campo, quantidade DESC;
