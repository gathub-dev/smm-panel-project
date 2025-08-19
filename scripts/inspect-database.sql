-- 🔍 INSPEÇÃO COMPLETA DO BANCO DE DADOS

-- 1. VER TODAS AS TABELAS
SELECT 
  schemaname as schema,
  tablename as tabela,
  tableowner as dono
FROM pg_tables 
WHERE schemaname IN ('public', 'auth')
ORDER BY schemaname, tablename;

-- 2. VER COLUNAS DE CADA TABELA PUBLIC
SELECT 
  table_name as tabela,
  column_name as coluna,
  data_type as tipo,
  is_nullable as permite_null
FROM information_schema.columns 
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- 3. CONTAR LINHAS DE CADA TABELA PUBLIC
SELECT 
  'users' as tabela,
  COUNT(*) as total_linhas
FROM public.users
UNION ALL
SELECT 
  'profiles' as tabela,
  COUNT(*) as total_linhas
FROM public.profiles
UNION ALL
SELECT 
  'services' as tabela,
  COUNT(*) as total_linhas
FROM public.services
UNION ALL
SELECT 
  'orders' as tabela,
  COUNT(*) as total_linhas
FROM public.orders
UNION ALL
SELECT 
  'transactions' as tabela,
  COUNT(*) as total_linhas
FROM public.transactions
UNION ALL
SELECT 
  'api_keys' as tabela,
  COUNT(*) as total_linhas
FROM public.api_keys;

-- 4. VER DADOS DA TABELA AUTH.USERS (se existir)
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at
FROM auth.users
LIMIT 5;

-- 5. VER DADOS DA TABELA API_KEYS (se existir)
SELECT * FROM public.api_keys LIMIT 10; 