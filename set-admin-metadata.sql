-- SCRIPT PARA DEFINIR USER_METADATA DOS ADMINS
-- Isso garante que a verificação funcione mesmo com problemas de RLS

-- =====================================================
-- 1. VERIFICAR USUÁRIOS ADMIN ATUAIS
-- =====================================================
SELECT 
    au.id,
    au.email,
    pu.role,
    pu.status,
    au.raw_user_meta_data
FROM auth.users au
JOIN public.users pu ON au.id = pu.id
WHERE pu.role = 'admin';

-- =====================================================
-- 2. ATUALIZAR USER_METADATA DOS ADMINS
-- =====================================================

-- Atualizar user_metadata para incluir role admin
UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE id IN (
    SELECT au.id 
    FROM auth.users au
    JOIN public.users pu ON au.id = pu.id
    WHERE pu.role = 'admin'
);

-- =====================================================
-- 3. VERIFICAR SE A ATUALIZAÇÃO FUNCIONOU
-- =====================================================
SELECT 
    'Verificação após atualização:' as status,
    au.id,
    au.email,
    pu.role as table_role,
    pu.status,
    au.raw_user_meta_data,
    au.raw_user_meta_data->>'role' as metadata_role
FROM auth.users au
JOIN public.users pu ON au.id = pu.id
WHERE pu.role = 'admin';

-- =====================================================
-- 4. SCRIPT ALTERNATIVO PARA USUÁRIOS ESPECÍFICOS
-- =====================================================

-- Se preferir, atualize usuários específicos por email:
UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE email IN ('lhost2025@gmail.com', 'admin@exemplo.com');

SELECT 'User metadata atualizado com sucesso!' as resultado;
