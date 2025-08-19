-- Script para visualizar todo o banco de dados SMM Panel
-- Execute este script para ver a estrutura e dados completos

-- 1. Verificar todas as tabelas existentes
SELECT 
    schemaname,
    tablename,
    tableowner,
    tablespace,
    hasindexes,
    hasrules,
    hastriggers,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Verificar estrutura da tabela users
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;

-- 3. Verificar estrutura da tabela categories
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'categories'
ORDER BY ordinal_position;

-- 4. Verificar estrutura da tabela services
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'services'
ORDER BY ordinal_position;

-- 5. Verificar estrutura da tabela orders
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'orders'
ORDER BY ordinal_position;

-- 6. Verificar estrutura da tabela transactions
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'transactions'
ORDER BY ordinal_position;

-- 7. Verificar estrutura da tabela api_keys
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'api_keys'
ORDER BY ordinal_position;

-- 8. Verificar estrutura da tabela settings
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'settings'
ORDER BY ordinal_position;

-- 9. Verificar dados da tabela users (sem senhas)
SELECT 
    id,
    email,
    full_name,
    balance,
    role,
    status,
    created_at,
    updated_at
FROM public.users
ORDER BY created_at DESC;

-- 10. Verificar dados da tabela categories
SELECT 
    id,
    name,
    description,
    icon,
    sort_order,
    is_active,
    created_at,
    updated_at
FROM public.categories
ORDER BY sort_order, name;

-- 11. Verificar dados da tabela services
SELECT 
    s.id,
    s.name,
    c.name as category_name,
    s.description,
    s.provider,
    s.provider_service_id,
    s.rate,
    s.min_quantity,
    s.max_quantity,
    s.type,
    s.status,
    s.dripfeed,
    s.refill,
    s.cancel,
    s.created_at,
    s.updated_at
FROM public.services s
LEFT JOIN public.categories c ON s.category_id = c.id
ORDER BY c.sort_order, s.name;

-- 12. Verificar dados da tabela orders
SELECT 
    o.id,
    u.email as user_email,
    s.name as service_name,
    o.provider_order_id,
    o.link,
    o.quantity,
    o.start_count,
    o.remains,
    o.charge,
    o.status,
    o.created_at,
    o.updated_at
FROM public.orders o
LEFT JOIN public.users u ON o.user_id = u.id
LEFT JOIN public.services s ON o.service_id = s.id
ORDER BY o.created_at DESC;

-- 13. Verificar dados da tabela transactions
SELECT 
    t.id,
    u.email as user_email,
    t.type,
    t.amount,
    t.balance_before,
    t.balance_after,
    t.description,
    t.order_id,
    t.created_at
FROM public.transactions t
LEFT JOIN public.users u ON t.user_id = u.id
ORDER BY t.created_at DESC;

-- 14. Verificar dados da tabela api_keys
SELECT 
    id,
    provider,
    api_key,
    api_url,
    is_active,
    created_at,
    updated_at
FROM public.api_keys
ORDER BY provider, created_at;

-- 15. Verificar dados da tabela settings
SELECT 
    id,
    key,
    value,
    description,
    created_at,
    updated_at
FROM public.settings
ORDER BY key;

-- 16. Verificar estatísticas gerais
SELECT 
    'users' as table_name,
    COUNT(*) as total_records
FROM public.users
UNION ALL
SELECT 
    'categories' as table_name,
    COUNT(*) as total_records
FROM public.categories
UNION ALL
SELECT 
    'services' as table_name,
    COUNT(*) as total_records
FROM public.services
UNION ALL
SELECT 
    'orders' as table_name,
    COUNT(*) as total_records
FROM public.orders
UNION ALL
SELECT 
    'transactions' as table_name,
    COUNT(*) as total_records
FROM public.transactions
UNION ALL
SELECT 
    'api_keys' as table_name,
    COUNT(*) as total_records
FROM public.api_keys
UNION ALL
SELECT 
    'settings' as table_name,
    COUNT(*) as total_records
FROM public.settings;

-- 17. Verificar usuários por role
SELECT 
    role,
    COUNT(*) as total_users
FROM public.users
GROUP BY role
ORDER BY role;

-- 18. Verificar usuários por status
SELECT 
    status,
    COUNT(*) as total_users
FROM public.users
GROUP BY status
ORDER BY status;

-- 19. Verificar serviços por provider
SELECT 
    provider,
    COUNT(*) as total_services
FROM public.services
GROUP BY provider
ORDER BY provider;

-- 20. Verificar serviços por status
SELECT 
    status,
    COUNT(*) as total_services
FROM public.services
GROUP BY status
ORDER BY status; 