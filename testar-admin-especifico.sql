-- ===============================================
-- TESTAR E CORRIGIR USUÁRIO ADMIN ESPECÍFICO
-- Execute este SQL no painel do Supabase (SQL Editor)
-- ===============================================

-- Dados do usuário:
-- Email: admin@exemplo.com
-- ID: 5dd0f702-0e99-4f6b-b32c-a4d76bf66bdd

-- 1. VERIFICAR DADOS ATUAIS DO USUÁRIO
SELECT 'DADOS ATUAIS DO USUÁRIO admin@exemplo.com' as info;
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

-- 2. VERIFICAR DADOS NO AUTH.USERS
SELECT 'DADOS NO AUTH.USERS' as info;
SELECT 
    id,
    email,
    email_confirmed_at,
    raw_user_meta_data,
    raw_app_meta_data,
    created_at
FROM auth.users 
WHERE id = '5dd0f702-0e99-4f6b-b32c-a4d76bf66bdd'
OR email = 'admin@exemplo.com';

-- 3. VERIFICAR SE EXISTE CONSTRAINT RESTRITIVA
SELECT 'CONSTRAINT DE ROLE ATUAL' as info;
SELECT 
    constraint_name,
    check_clause
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%role%' 
AND constraint_schema = 'public';

-- 4. REMOVER CONSTRAINT RESTRITIVA (se existir)
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

-- 5. CRIAR NOVA CONSTRAINT FLEXÍVEL
ALTER TABLE users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('user', 'admin', 'moderator', 'superadmin'));

-- 6. FORÇAR ATUALIZAÇÃO DO ROLE PARA ADMIN
UPDATE users 
SET role = 'admin' 
WHERE id = '5dd0f702-0e99-4f6b-b32c-a4d76bf66bdd';

-- 7. ATUALIZAR METADATA NO AUTH.USERS
UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'admin')
WHERE id = '5dd0f702-0e99-4f6b-b32c-a4d76bf66bdd';

-- 8. VERIFICAR SE AS ATUALIZAÇÕES FUNCIONARAM
SELECT 'DADOS APÓS ATUALIZAÇÃO' as info;
SELECT 
    id,
    email,
    full_name,
    role,
    status,
    balance,
    CASE 
        WHEN role = 'admin' THEN '✅ SUCESSO: Role é admin'
        ELSE '❌ ERRO: Role ainda não é admin'
    END as status_role
FROM users 
WHERE id = '5dd0f702-0e99-4f6b-b32c-a4d76bf66bdd';

-- 9. VERIFICAR METADATA ATUALIZADO
SELECT 'METADATA ATUALIZADO' as info;
SELECT 
    id,
    email,
    raw_user_meta_data,
    CASE 
        WHEN raw_user_meta_data->>'role' = 'admin' THEN '✅ Metadata correto'
        ELSE '❌ Metadata incorreto'
    END as status_metadata
FROM auth.users 
WHERE id = '5dd0f702-0e99-4f6b-b32c-a4d76bf66bdd';

-- 10. TESTAR A FUNÇÃO CHECK_USER_IS_ADMIN
SELECT 'TESTE DA FUNÇÃO CHECK_USER_IS_ADMIN' as info;
SELECT 
    '5dd0f702-0e99-4f6b-b32c-a4d76bf66bdd' as user_id,
    check_user_is_admin('5dd0f702-0e99-4f6b-b32c-a4d76bf66bdd') as is_admin_result,
    CASE 
        WHEN check_user_is_admin('5dd0f702-0e99-4f6b-b32c-a4d76bf66bdd') THEN '✅ Função retorna TRUE - É ADMIN'
        ELSE '❌ Função retorna FALSE - NÃO é admin'
    END as status_funcao;

-- 11. VERIFICAR SE A FUNÇÃO EXISTE
SELECT 'VERIFICAR SE FUNÇÃO EXISTS' as info;
SELECT 
    routine_name,
    routine_type,
    security_type
FROM information_schema.routines 
WHERE routine_name = 'check_user_is_admin'
AND routine_schema = 'public';

-- 12. CRIAR A FUNÇÃO SE NÃO EXISTIR
CREATE OR REPLACE FUNCTION check_user_is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o usuário existe e é admin
  RETURN EXISTS (
    SELECT 1 
    FROM users 
    WHERE id = user_id 
    AND role = 'admin'
  );
END;
$$;

-- 13. DAR PERMISSÕES PARA A FUNÇÃO
GRANT EXECUTE ON FUNCTION check_user_is_admin(UUID) TO authenticated;

-- 14. TESTAR NOVAMENTE A FUNÇÃO
SELECT 'TESTE FINAL DA FUNÇÃO' as info;
SELECT 
    '5dd0f702-0e99-4f6b-b32c-a4d76bf66bdd' as user_id,
    check_user_is_admin('5dd0f702-0e99-4f6b-b32c-a4d76bf66bdd') as is_admin_final,
    CASE 
        WHEN check_user_is_admin('5dd0f702-0e99-4f6b-b32c-a4d76bf66bdd') THEN '🎉 SUCESSO TOTAL! Usuário é reconhecido como admin'
        ELSE '❌ AINDA COM PROBLEMA: Função não reconhece como admin'
    END as resultado_final;

-- 15. VERIFICAR POLÍTICAS RLS QUE PODEM ESTAR BLOQUEANDO
SELECT 'POLÍTICAS RLS DA TABELA USERS' as info;
SELECT 
    policyname,
    cmd,
    roles,
    qual
FROM pg_policies 
WHERE tablename = 'users' 
AND schemaname = 'public';

-- 16. LISTAR TODOS OS ADMINS
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

-- 17. INSTRUÇÕES FINAIS
SELECT 'INSTRUÇÕES APÓS EXECUÇÃO' as info;
SELECT 
    'Se tudo deu certo, faça:' as passo1,
    '1. Logout da aplicação' as passo2,
    '2. Login com admin@exemplo.com' as passo3,
    '3. Vá em /dashboard/profile - deve mostrar Role: admin' as passo4,
    '4. Acesse /dashboard/admin - deve funcionar!' as passo5;
