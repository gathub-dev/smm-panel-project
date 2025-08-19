-- ===============================================
-- CRIAR NOVO USUÁRIO ADMIN - VERSÃO SIMPLES
-- Execute este SQL no painel do Supabase (SQL Editor)
-- ===============================================

-- IMPORTANTE: Altere estes dados antes de executar:
-- Email: admin@exemplo.com
-- Senha: MinhaSenh@123!
-- Nome: Administrador Sistema

-- 1. VERIFICAR SE O EMAIL JÁ EXISTE
SELECT 'VERIFICAÇÃO INICIAL' as info;
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@exemplo.com') 
        THEN '❌ Email já existe na tabela auth.users'
        WHEN EXISTS (SELECT 1 FROM users WHERE email = 'admin@exemplo.com') 
        THEN '❌ Email já existe na tabela users'
        ELSE '✅ Email disponível para criar novo usuário'
    END as status_email;

-- 2. CRIAR USUÁRIO NO SISTEMA DE AUTENTICAÇÃO
-- ALTERE: email, senha e nome nas linhas abaixo
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    email_change_sent_at,
    invited_at,
    confirmation_sent_at,
    recovery_sent_at,
    email_change_token_current,
    email_change_confirm_status
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@exemplo.com', -- ← ALTERE O EMAIL AQUI
    crypt('MinhaSenh@123!', gen_salt('bf')), -- ← ALTERE A SENHA AQUI
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Administrador Sistema", "role": "admin"}', -- ← ALTERE O NOME AQUI
    NOW(),
    NOW(),
    '',
    '',
    '',
    '',
    NULL,
    NULL,
    NULL,
    NULL,
    '',
    0
);

-- 3. OBTER O ID DO USUÁRIO CRIADO
SELECT 'USUÁRIO CRIADO NO AUTH' as info;
SELECT 
    id,
    email,
    created_at,
    raw_user_meta_data
FROM auth.users 
WHERE email = 'admin@exemplo.com'; -- ← ALTERE O EMAIL AQUI TAMBÉM

-- 4. CRIAR PERFIL NA TABELA PÚBLICA
INSERT INTO users (
    id,
    email,
    full_name,
    role,
    status,
    balance,
    created_at
) 
SELECT 
    id,
    email,
    raw_user_meta_data->>'full_name',
    'admin',
    'active',
    0.00,
    created_at
FROM auth.users 
WHERE email = 'admin@exemplo.com' -- ← ALTERE O EMAIL AQUI TAMBÉM
AND NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@exemplo.com'); -- ← E AQUI

-- 5. VERIFICAR SE TUDO FOI CRIADO
SELECT 'RESULTADO FINAL' as info;
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.role,
    u.status,
    u.balance,
    '✅ Usuário admin criado com sucesso!' as resultado
FROM users u
WHERE u.email = 'admin@exemplo.com'; -- ← ALTERE O EMAIL AQUI TAMBÉM

-- 6. TESTAR FUNÇÃO DE ADMIN
SELECT 'TESTE DA FUNÇÃO ADMIN' as info;
SELECT 
    u.email,
    check_user_is_admin(u.id) as is_admin,
    CASE 
        WHEN check_user_is_admin(u.id) THEN '✅ Reconhecido como admin'
        ELSE '❌ NÃO reconhecido como admin'
    END as status
FROM users u
WHERE u.email = 'admin@exemplo.com'; -- ← ALTERE O EMAIL AQUI TAMBÉM

-- ===============================================
-- MÉTODO ALTERNATIVO (SE O ACIMA DER ERRO):
-- ===============================================
-- 
-- 1. Vá no painel Supabase: Authentication > Users > Add User
-- 2. Crie o usuário manualmente com email e senha
-- 3. Execute apenas este comando (substitua o ID):
--
-- INSERT INTO users (id, email, full_name, role, status, balance) 
-- VALUES (
--     'COLE_AQUI_O_ID_DO_USUARIO', 
--     'admin@exemplo.com',
--     'Administrador Sistema',
--     'admin',
--     'active',
--     0.00
-- );
--
-- ===============================================
