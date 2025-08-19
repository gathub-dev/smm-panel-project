-- ===============================================
-- CORREÇÃO DO ROLE ADMIN
-- Execute este SQL no painel do Supabase (SQL Editor)
-- ===============================================

-- 1. VERIFICAR DADOS ATUAIS DO SEU USUÁRIO
SELECT 'DADOS ATUAIS DO USUÁRIO' as info;
SELECT 
    id,
    email,
    full_name,
    role,
    status,
    created_at
FROM users 
WHERE email = 'lhost2025@gmail.com';

-- 2. ATUALIZAR ROLE PARA ADMIN
UPDATE users 
SET role = 'admin' 
WHERE email = 'lhost2025@gmail.com';

-- 3. VERIFICAR SE A ATUALIZAÇÃO FUNCIONOU
SELECT 'DADOS APÓS ATUALIZAÇÃO' as info;
SELECT 
    id,
    email,
    full_name,
    role,
    status,
    created_at
FROM users 
WHERE email = 'lhost2025@gmail.com';

-- 4. TAMBÉM ATUALIZAR NO AUTH.USERS (METADATA)
UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'admin')
WHERE email = 'lhost2025@gmail.com';

-- 5. VERIFICAR METADATA ATUALIZADO
SELECT 'METADATA NO AUTH.USERS' as info;
SELECT 
    id,
    email,
    raw_user_meta_data,
    raw_app_meta_data
FROM auth.users 
WHERE email = 'lhost2025@gmail.com';

-- 6. TESTAR A FUNÇÃO CHECK_USER_IS_ADMIN
SELECT 'TESTE DA FUNÇÃO CHECK_USER_IS_ADMIN' as info;
SELECT check_user_is_admin('472c2e96-ca33-4a50-8393-36c78a00eb4e') as is_admin;

-- 7. RESULTADO ESPERADO
SELECT 'RESULTADO ESPERADO' as info;
SELECT 
    CASE 
        WHEN role = 'admin' THEN '✅ SUCESSO: Role corrigido para admin'
        ELSE '❌ ERRO: Role ainda não é admin'
    END as status
FROM users 
WHERE email = 'lhost2025@gmail.com';
