-- ===============================================
-- CORREÇÃO DA CONSTRAINT DE ROLE
-- Execute este SQL no painel do Supabase (SQL Editor)
-- ===============================================

-- 1. VERIFICAR A CONSTRAINT ATUAL
SELECT 'CONSTRAINT ATUAL DA TABELA USERS' as info;
SELECT 
    constraint_name,
    check_clause
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%role%' 
AND constraint_schema = 'public';

-- 2. VERIFICAR TODAS AS CONSTRAINTS DA TABELA USERS
SELECT 'TODAS AS CONSTRAINTS DA TABELA USERS' as info;
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'users' 
AND tc.table_schema = 'public';

-- 3. VERIFICAR VALORES ATUAIS NA COLUNA ROLE
SELECT 'VALORES ATUAIS DE ROLE NA TABELA' as info;
SELECT 
    role,
    COUNT(*) as quantidade
FROM users 
GROUP BY role
ORDER BY quantidade DESC;

-- 4. VERIFICAR SEU USUÁRIO ATUAL
SELECT 'SEU USUÁRIO ATUAL' as info;
SELECT 
    id,
    email,
    role,
    status
FROM users 
WHERE email = 'lhost2025@gmail.com';

-- 5. REMOVER A CONSTRAINT RESTRITIVA (se existir)
DO $$
BEGIN
    -- Verificar se a constraint existe e removê-la
    IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'users_role_check'
    ) THEN
        ALTER TABLE users DROP CONSTRAINT users_role_check;
        RAISE NOTICE '✅ Constraint users_role_check removida com sucesso';
    ELSE
        RAISE NOTICE 'ℹ️ Constraint users_role_check não encontrada';
    END IF;
END $$;

-- 6. CRIAR NOVA CONSTRAINT MAIS FLEXÍVEL
ALTER TABLE users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('user', 'admin', 'moderator'));

-- 7. AGORA TENTAR ATUALIZAR O ROLE PARA ADMIN
UPDATE users 
SET role = 'admin' 
WHERE email = 'lhost2025@gmail.com';

-- 8. VERIFICAR SE A ATUALIZAÇÃO FUNCIONOU
SELECT 'RESULTADO FINAL' as info;
SELECT 
    id,
    email,
    role,
    status,
    CASE 
        WHEN role = 'admin' THEN '✅ SUCESSO: Role atualizado para admin'
        ELSE '❌ ERRO: Role ainda não é admin'
    END as status_update
FROM users 
WHERE email = 'lhost2025@gmail.com';

-- 9. TAMBÉM ATUALIZAR NO AUTH.USERS (METADATA)
UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'admin')
WHERE email = 'lhost2025@gmail.com';

-- 10. TESTAR A FUNÇÃO CHECK_USER_IS_ADMIN
SELECT 'TESTE FINAL DA FUNÇÃO' as info;
SELECT check_user_is_admin('472c2e96-ca33-4a50-8393-36c78a00eb4e') as is_admin_function;

-- 11. VERIFICAR A NOVA CONSTRAINT
SELECT 'NOVA CONSTRAINT CRIADA' as info;
SELECT 
    constraint_name,
    check_clause
FROM information_schema.check_constraints 
WHERE constraint_name = 'users_role_check' 
AND constraint_schema = 'public';
