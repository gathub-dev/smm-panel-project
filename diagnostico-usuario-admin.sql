-- ===============================================
-- DIAGNÓSTICO ESPECÍFICO DO PROBLEMA DE ROLE ADMIN
-- Execute este script no SQL Editor do Supabase
-- ===============================================

-- 1. VERIFICAR SEU USUÁRIO ATUAL
SELECT 'INFORMAÇÕES DO USUÁRIO ATUAL' as info;
SELECT 
    id as user_id,
    email,
    created_at,
    email_confirmed_at,
    raw_user_meta_data,
    raw_app_meta_data
FROM auth.users 
WHERE email = 'lhost2025@gmail.com';

-- 2. VERIFICAR DADOS NA TABELA USERS (PÚBLICA)
SELECT 'DADOS NA TABELA USERS PÚBLICA' as info;
SELECT 
    id,
    email,
    full_name,
    role,
    status,
    balance,
    created_at
FROM users 
WHERE email = 'lhost2025@gmail.com';

-- 3. VERIFICAR SE A TABELA USERS TEM RLS ATIVO
SELECT 'STATUS RLS DA TABELA USERS' as info;
SELECT 
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '🔒 RLS ATIVO - pode estar bloqueando acesso'
        ELSE '🔓 RLS DESABILITADO - acesso livre'
    END as status
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';

-- 4. VERIFICAR POLÍTICAS RLS NA TABELA USERS
SELECT 'POLÍTICAS RLS DA TABELA USERS' as info;
SELECT 
    policyname as nome_politica,
    cmd as comando,
    roles as papeis,
    qual as condicao_aplicada
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public';

-- 5. TESTAR ACESSO DIRETO À TABELA USERS
SELECT 'TESTE DE ACESSO DIRETO' as info;
SELECT COUNT(*) as total_usuarios_visiveis FROM users;

-- 6. VERIFICAR SE O USUÁRIO EXISTE MAS ESTÁ COM ROLE INCORRETO
SELECT 'VERIFICAÇÃO DE ROLE ATUAL' as info;
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM users WHERE email = 'lhost2025@gmail.com' AND role = 'admin') 
        THEN '✅ Usuário tem role ADMIN na tabela users'
        WHEN EXISTS (SELECT 1 FROM users WHERE email = 'lhost2025@gmail.com' AND role = 'user') 
        THEN '❌ Usuário tem role USER na tabela users (precisa corrigir)'
        WHEN EXISTS (SELECT 1 FROM users WHERE email = 'lhost2025@gmail.com') 
        THEN '⚠️ Usuário existe mas role é NULL ou outro valor'
        ELSE '❌ Usuário não encontrado na tabela users'
    END as status_role;

-- 7. VERIFICAR SE AS FUNÇÕES RPC EXISTEM
SELECT 'VERIFICAÇÃO DAS FUNÇÕES RPC' as info;
SELECT 
    routine_name as nome_funcao,
    routine_type as tipo,
    security_type as seguranca
FROM information_schema.routines 
WHERE routine_name IN ('check_user_is_admin', 'update_user_role_metadata', 'promote_user_to_admin', 'demote_admin_to_user')
AND routine_schema = 'public';

-- 8. SOLUÇÕES RECOMENDADAS
SELECT 'SOLUÇÕES RECOMENDADAS' as info;

DO $$
DECLARE
    user_exists BOOLEAN;
    user_role TEXT;
    rls_enabled BOOLEAN;
    policies_count INTEGER;
BEGIN
    -- Verificar se usuário existe
    SELECT EXISTS (SELECT 1 FROM users WHERE email = 'lhost2025@gmail.com') INTO user_exists;
    
    -- Verificar role atual
    SELECT role INTO user_role FROM users WHERE email = 'lhost2025@gmail.com';
    
    -- Verificar RLS
    SELECT rowsecurity INTO rls_enabled FROM pg_tables WHERE tablename = 'users' AND schemaname = 'public';
    
    -- Contar políticas
    SELECT COUNT(*) INTO policies_count FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public';
    
    RAISE NOTICE '=== DIAGNÓSTICO ===';
    RAISE NOTICE 'Usuário existe: %', user_exists;
    RAISE NOTICE 'Role atual: %', COALESCE(user_role, 'NULL');
    RAISE NOTICE 'RLS ativo: %', rls_enabled;
    RAISE NOTICE 'Políticas RLS: %', policies_count;
    RAISE NOTICE '';
    
    IF NOT user_exists THEN
        RAISE NOTICE '🔧 SOLUÇÃO 1: Criar registro do usuário na tabela users';
        RAISE NOTICE 'INSERT INTO users (id, email, role, status) VALUES (';
        RAISE NOTICE '  (SELECT id FROM auth.users WHERE email = ''lhost2025@gmail.com''),';
        RAISE NOTICE '  ''lhost2025@gmail.com'',';
        RAISE NOTICE '  ''admin'',';
        RAISE NOTICE '  ''active''';
        RAISE NOTICE ');';
        RAISE NOTICE '';
    END IF;
    
    IF user_exists AND COALESCE(user_role, '') != 'admin' THEN
        RAISE NOTICE '🔧 SOLUÇÃO 2: Corrigir role do usuário';
        RAISE NOTICE 'UPDATE users SET role = ''admin'' WHERE email = ''lhost2025@gmail.com'';';
        RAISE NOTICE '';
    END IF;
    
    IF rls_enabled AND policies_count = 0 THEN
        RAISE NOTICE '🔧 SOLUÇÃO 3: RLS está ativo mas sem políticas - isso bloqueia tudo!';
        RAISE NOTICE 'Execute o script analyze-rls-policies.sql para criar políticas básicas';
        RAISE NOTICE '';
    END IF;
    
    IF rls_enabled AND policies_count > 0 THEN
        RAISE NOTICE '🔧 SOLUÇÃO 4: RLS com políticas - verifique se as políticas estão corretas';
        RAISE NOTICE 'As políticas podem estar impedindo o acesso aos dados do usuário';
        RAISE NOTICE '';
    END IF;
END $$;

-- 9. COMANDOS PARA CORRIGIR (DESCOMENTE SE NECESSÁRIO)
/*
-- Se o usuário não existir na tabela users:
INSERT INTO users (id, email, role, status, full_name) 
SELECT id, email, 'admin', 'active', COALESCE(raw_user_meta_data->>'full_name', email)
FROM auth.users 
WHERE email = 'lhost2025@gmail.com'
AND NOT EXISTS (SELECT 1 FROM users WHERE email = 'lhost2025@gmail.com');

-- Se o usuário existir mas com role incorreto:
UPDATE users 
SET role = 'admin' 
WHERE email = 'lhost2025@gmail.com';

-- Se RLS estiver bloqueando, temporariamente desabilitar:
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Depois de corrigir, reabilitar RLS:
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
*/
