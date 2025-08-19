-- ===============================================
-- CORRIGIR ROLE DO USUÁRIO ESPECÍFICO
-- Execute este SQL no painel do Supabase (SQL Editor)
-- ===============================================

-- User ID: 5dd0f702-0e99-4f6b-b32c-a4d76bf66bdd
-- Email: admin@exemplo.com

-- 1. VERIFICAR DADOS ATUAIS DO USUÁRIO
SELECT 'DADOS ATUAIS DO USUÁRIO' as info;
SELECT 
    id,
    email,
    full_name,
    role,
    status,
    balance,
    created_at
FROM users 
WHERE id = '5dd0f702-0e99-4f6b-b32c-a4d76bf66bdd'
OR email = 'admin@exemplo.com';

-- 2. VERIFICAR SE A CONSTRAINT DE ROLE PERMITE 'admin'
SELECT 'VERIFICAR CONSTRAINT DE ROLE' as info;
SELECT 
    constraint_name,
    check_clause
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%role%' 
AND constraint_schema = 'public';

-- 3. REMOVER CONSTRAINT RESTRITIVA SE EXISTIR
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'users_role_check'
        AND constraint_schema = 'public'
    ) THEN
        ALTER TABLE users DROP CONSTRAINT users_role_check;
        RAISE NOTICE '✅ Constraint users_role_check removida';
    ELSE
        RAISE NOTICE 'ℹ️ Constraint users_role_check não encontrada';
    END IF;
END $$;

-- 4. CRIAR NOVA CONSTRAINT FLEXÍVEL
ALTER TABLE users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('user', 'admin', 'moderator', 'superadmin'));

-- 5. ATUALIZAR ROLE PARA ADMIN
UPDATE users 
SET role = 'admin' 
WHERE id = '5dd0f702-0e99-4f6b-b32c-a4d76bf66bdd';

-- 6. TAMBÉM ATUALIZAR NO AUTH.USERS (METADATA)
UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'admin')
WHERE id = '5dd0f702-0e99-4f6b-b32c-a4d76bf66bdd';

-- 7. VERIFICAR SE A ATUALIZAÇÃO FUNCIONOU
SELECT 'DADOS APÓS ATUALIZAÇÃO' as info;
SELECT 
    id,
    email,
    full_name,
    role,
    status,
    balance,
    CASE 
        WHEN role = 'admin' THEN '✅ SUCESSO: Role atualizado para admin'
        ELSE '❌ ERRO: Role ainda não é admin'
    END as status_update
FROM users 
WHERE id = '5dd0f702-0e99-4f6b-b32c-a4d76bf66bdd';

-- 8. VERIFICAR METADATA NO AUTH.USERS
SELECT 'METADATA NO AUTH.USERS' as info;
SELECT 
    id,
    email,
    raw_user_meta_data,
    raw_app_meta_data
FROM auth.users 
WHERE id = '5dd0f702-0e99-4f6b-b32c-a4d76bf66bdd';

-- 9. TESTAR A FUNÇÃO CHECK_USER_IS_ADMIN
SELECT 'TESTE DA FUNÇÃO CHECK_USER_IS_ADMIN' as info;
SELECT 
    '5dd0f702-0e99-4f6b-b32c-a4d76bf66bdd' as user_id,
    check_user_is_admin('5dd0f702-0e99-4f6b-b32c-a4d76bf66bdd') as is_admin_function,
    CASE 
        WHEN check_user_is_admin('5dd0f702-0e99-4f6b-b32c-a4d76bf66bdd') THEN '✅ Função reconhece como admin'
        ELSE '❌ Função NÃO reconhece como admin'
    END as status_funcao;

-- 10. LISTAR TODOS OS ADMINISTRADORES
SELECT 'TODOS OS ADMINISTRADORES' as info;
SELECT 
    id,
    email,
    full_name,
    role,
    status,
    created_at
FROM users 
WHERE role = 'admin'
ORDER BY created_at;

-- 11. VERIFICAR SE EXISTEM POLÍTICAS RLS BLOQUEANDO
SELECT 'POLÍTICAS RLS DA TABELA USERS' as info;
SELECT 
    policyname as nome_politica,
    cmd as comando,
    roles as papeis,
    qual as condicao_aplicada
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public';

-- 12. RESULTADO FINAL ESPERADO
SELECT 'RESULTADO ESPERADO APÓS EXECUÇÃO' as info;
SELECT 
    'Após executar este script:' as instrucoes,
    '1. Faça logout da aplicação' as passo1,
    '2. Faça login novamente' as passo2,
    '3. Vá na página de perfil - deve mostrar Role: admin' as passo3,
    '4. Acesse /dashboard/admin - deve funcionar' as passo4;
