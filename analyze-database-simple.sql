-- ========================================
-- ANÁLISE SIMPLES E DIRETA DO BANCO
-- ========================================

-- 1. LISTAR TODAS AS TABELAS
\echo '=== TABELAS ==='
SELECT 
  table_name as "Tabela",
  pg_size_pretty(pg_total_relation_size(table_name::regclass)) as "Tamanho"
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. ESTRUTURA DE CADA TABELA IMPORTANTE
\echo '\n=== ESTRUTURA DA TABELA USERS ==='
SELECT 
  column_name as "Coluna",
  data_type as "Tipo",
  is_nullable as "Null?",
  column_default as "Padrão"
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

\echo '\n=== ESTRUTURA DA TABELA SERVICES ==='
SELECT 
  column_name as "Coluna",
  data_type as "Tipo",
  is_nullable as "Null?",
  column_default as "Padrão"
FROM information_schema.columns 
WHERE table_name = 'services' AND table_schema = 'public'
ORDER BY ordinal_position;

\echo '\n=== ESTRUTURA DA TABELA ORDERS ==='
SELECT 
  column_name as "Coluna",
  data_type as "Tipo",
  is_nullable as "Null?",
  column_default as "Padrão"
FROM information_schema.columns 
WHERE table_name = 'orders' AND table_schema = 'public'
ORDER BY ordinal_position;

\echo '\n=== ESTRUTURA DA TABELA SETTINGS ==='
SELECT 
  column_name as "Coluna",
  data_type as "Tipo",
  is_nullable as "Null?",
  column_default as "Padrão"
FROM information_schema.columns 
WHERE table_name = 'settings' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. TODOS OS RELACIONAMENTOS
\echo '\n=== RELACIONAMENTOS (FOREIGN KEYS) ==='
SELECT 
  kcu.table_name as "Tabela Origem",
  kcu.column_name as "Coluna Origem",
  ccu.table_name as "Tabela Destino",
  ccu.column_name as "Coluna Destino"
FROM information_schema.key_column_usage kcu
JOIN information_schema.referential_constraints rc ON kcu.constraint_name = rc.constraint_name
JOIN information_schema.constraint_column_usage ccu ON rc.unique_constraint_name = ccu.constraint_name
WHERE kcu.table_schema = 'public'
ORDER BY kcu.table_name;

-- 4. TODAS AS POLÍTICAS RLS
\echo '\n=== POLÍTICAS RLS ==='
SELECT 
  tablename as "Tabela",
  policyname as "Política",
  cmd as "Comando",
  roles as "Roles"
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 5. STATUS DO RLS
\echo '\n=== STATUS RLS ==='
SELECT 
  tablename as "Tabela",
  rowsecurity as "RLS Ativo"
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 6. CONTAGEM DE REGISTROS
\echo '\n=== CONTAGEM DE REGISTROS ==='
SELECT 
  'users' as "Tabela",
  COUNT(*) as "Registros"
FROM users
UNION ALL
SELECT 'services', COUNT(*) FROM services
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'settings', COUNT(*) FROM settings;

-- 7. TIPOS ENUM
\echo '\n=== TIPOS ENUM ==='
SELECT 
  t.typname as "Tipo",
  string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as "Valores"
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE n.nspname = 'public'
GROUP BY t.typname
ORDER BY t.typname;
