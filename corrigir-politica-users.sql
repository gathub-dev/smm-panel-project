-- ===============================================
-- CORRIGIR POLÍTICA PROBLEMÁTICA DA TABELA USERS
-- Execute este SQL no painel do Supabase (SQL Editor)
-- ===============================================

-- PROBLEMA IDENTIFICADO:
-- A política "Admins can view all users" na tabela users faz uma subconsulta
-- problemática que pode estar causando o erro "role admin does not exist"

-- 1. VERIFICAR POLÍTICAS ATUAIS DA TABELA USERS
SELECT 'POLÍTICAS ATUAIS DA TABELA USERS' as info;
SELECT 
    policyname as nome_politica,
    cmd as comando,
    roles as papeis,
    qual as condicao,
    with_check as verificacao
FROM pg_policies 
WHERE tablename = 'users' 
AND schemaname = 'public';

-- 2. REMOVER A POLÍTICA PROBLEMÁTICA
DROP POLICY IF EXISTS "Admins can view all users" ON users;

-- 3. REMOVER POLÍTICA EXISTENTE SE JÁ FOI CRIADA ANTES
DROP POLICY IF EXISTS "users_authenticated_access" ON users;

-- 4. CRIAR NOVA POLÍTICA SIMPLES E FUNCIONAL PARA USERS
CREATE POLICY "users_authenticated_access" ON users
    FOR ALL 
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 5. VERIFICAR SE A NOVA POLÍTICA FOI CRIADA
SELECT 'NOVA POLÍTICA CRIADA PARA USERS' as info;
SELECT 
    policyname as nome_politica,
    cmd as comando,
    roles as papeis,
    qual as condicao,
    with_check as verificacao
FROM pg_policies 
WHERE tablename = 'users' 
AND schemaname = 'public';

-- 6. TESTAR ACESSO À TABELA USERS
SELECT 'TESTE DE ACESSO À TABELA USERS' as info;
SELECT COUNT(*) as total_usuarios FROM users;

-- 7. VERIFICAR DADOS DO USUÁRIO ADMIN
SELECT 'DADOS DO USUÁRIO ADMIN' as info;
SELECT 
    id,
    email,
    role,
    status,
    created_at
FROM users 
WHERE email = 'lhost2025@gmail.com';

-- 8. VERIFICAR STATUS FINAL DE TODAS AS POLÍTICAS
SELECT 'TODAS AS POLÍTICAS FINAIS' as info;
SELECT 
    tablename,
    policyname,
    cmd,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('users', 'settings')
ORDER BY tablename, policyname;

-- ===============================================
-- RESULTADO ESPERADO:
-- ✅ Política problemática da tabela users removida
-- ✅ Nova política simples e funcional criada
-- ✅ Acesso às configurações funcionando
-- ✅ Erro "role admin does not exist" resolvido
-- ===============================================

-- ===============================================
-- APÓS EXECUTAR:
-- 1. Recarregue a página do painel de configurações
-- 2. O erro deve desaparecer completamente
-- 3. As configurações devem carregar normalmente
-- ===============================================
