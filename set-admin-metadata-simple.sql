-- SCRIPT SIMPLES PARA DEFINIR USER_METADATA DOS ADMINS
-- Versão corrigida sem ambiguidade de colunas

-- =====================================================
-- 1. VERIFICAR USUÁRIOS ADMIN ATUAIS (VERSÃO SIMPLES)
-- =====================================================

-- Primeiro, ver usuários da tabela public.users que são admin
SELECT 'Usuários admin na tabela public.users:' as info;
SELECT id, email, role, status FROM public.users WHERE role = 'admin';

-- Depois, ver os mesmos usuários na tabela auth.users
SELECT 'Dados correspondentes na tabela auth.users:' as info;
SELECT 
    au.id,
    au.email,
    au.raw_user_meta_data,
    au.raw_user_meta_data->>'role' as current_metadata_role
FROM auth.users au
WHERE au.id IN (
    SELECT id FROM public.users WHERE role = 'admin'
);

-- =====================================================
-- 2. ATUALIZAR USER_METADATA PARA OS EMAILS ESPECÍFICOS
-- =====================================================

-- Método mais seguro: atualizar por email específico
UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE email = 'lhost2025@gmail.com';

UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE email = 'admin@exemplo.com';

-- =====================================================
-- 3. VERIFICAR RESULTADO FINAL
-- =====================================================

SELECT 'Verificação final - user_metadata atualizado:' as info;
SELECT 
    email,
    raw_user_meta_data,
    raw_user_meta_data->>'role' as metadata_role
FROM auth.users 
WHERE email IN ('lhost2025@gmail.com', 'admin@exemplo.com');

-- =====================================================
-- 4. TESTE FINAL - VERIFICAR SE TUDO ESTÁ CORRETO
-- =====================================================

SELECT 'Comparação final - tabela users vs auth metadata:' as info;
SELECT 
    pu.email,
    pu.role as table_role,
    pu.status as table_status,
    au.raw_user_meta_data->>'role' as metadata_role
FROM public.users pu
JOIN auth.users au ON pu.id = au.id
WHERE pu.role = 'admin';

SELECT 'Script executado com sucesso! Agora teste o acesso admin na aplicação.' as resultado;
