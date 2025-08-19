-- Script para definir o usuário lhost2025@gmail.com como admin
-- Execute este script para dar privilégios de administrador ao usuário

-- 1. Primeiro, verificar se o usuário existe
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
WHERE email = 'lhost2025@gmail.com';

-- 2. Se o usuário não existir, criar um comentário informativo
-- (O usuário deve ser criado primeiro através do sistema de autenticação)

-- 3. Atualizar o usuário para role 'admin'
UPDATE public.users 
SET 
    role = 'admin',
    updated_at = NOW()
WHERE email = 'lhost2025@gmail.com';

-- 4. Verificar se a atualização foi bem-sucedida
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
WHERE email = 'lhost2025@gmail.com';

-- 5. Verificar todos os usuários admin no sistema
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
WHERE role = 'admin'
ORDER BY created_at;

-- 6. Verificar estatísticas de usuários por role após a atualização
SELECT 
    role,
    COUNT(*) as total_users
FROM public.users
GROUP BY role
ORDER BY role;

-- 7. Verificar se as políticas RLS estão funcionando corretamente
-- (Este comando deve ser executado por um usuário admin)
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

-- 8. Comentário: Após executar este script, o usuário lhost2025@gmail.com
-- terá acesso completo a todas as funcionalidades administrativas do sistema 