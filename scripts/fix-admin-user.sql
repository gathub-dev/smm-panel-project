-- TORNAR USUÁRIO ADMIN (RÁPIDO)

-- 1. Ver todos os usuários
SELECT id, email, role, created_at FROM public.users;

-- 2. Tornar o primeiro usuário admin (substitua pelo seu email)
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'SEU_EMAIL_AQUI@exemplo.com';

-- 3. OU tornar TODOS os usuários admin (se for só você)
-- UPDATE public.users SET role = 'admin';

-- 4. Verificar se funcionou
SELECT id, email, role FROM public.users WHERE role = 'admin'; 