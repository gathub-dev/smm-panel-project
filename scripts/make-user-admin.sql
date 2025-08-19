-- Tornar usuário admin (RÁPIDO)

-- 1. Ver o usuário atual
SELECT id, email, role FROM public.users WHERE email = 'lhost2025@gmail.com';

-- 2. Tornar admin
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'lhost2025@gmail.com';

-- 3. Verificar se funcionou
SELECT id, email, role FROM public.users WHERE email = 'lhost2025@gmail.com'; 