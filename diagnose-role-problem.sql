-- DIAGNÓSTICO ESPECÍFICO DO PROBLEMA DO ROLE "admin"
-- Execute este script primeiro para identificar o problema

-- =====================================================
-- 1. VERIFICAR ESTRUTURA DA COLUNA ROLE
-- =====================================================
SELECT 
    column_name,
    data_type,
    udt_name,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'public'
  AND column_name = 'role';

-- =====================================================
-- 2. VERIFICAR SE EXISTE ENUM PARA ROLE
-- =====================================================
SELECT 
    t.typname AS enum_name,
    e.enumlabel AS enum_value,
    e.enumsortorder
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname LIKE '%role%'
ORDER BY t.typname, e.enumsortorder;

-- =====================================================
-- 3. VERIFICAR VALORES ATUAIS NA TABELA
-- =====================================================
SELECT DISTINCT 
    role,
    COUNT(*) as quantidade
FROM public.users 
GROUP BY role
ORDER BY quantidade DESC;

-- =====================================================
-- 4. TESTE SIMPLES - TENTAR INSERIR ADMIN
-- =====================================================
DO $$
DECLARE
    test_id uuid := gen_random_uuid();
BEGIN
    -- Tentar inserir um usuário com role admin
    BEGIN
        INSERT INTO public.users (id, email, role, status, full_name) 
        VALUES (test_id, 'teste-admin@teste.com', 'admin', 'active', 'Teste Admin');
        
        RAISE NOTICE 'SUCESSO: Conseguiu inserir role admin';
        
        -- Limpar o teste
        DELETE FROM public.users WHERE id = test_id;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ERRO ao inserir role admin: %', SQLERRM;
        RAISE NOTICE 'SQLSTATE: %', SQLSTATE;
    END;
END $$;

-- =====================================================
-- 5. VERIFICAR TODOS OS TIPOS ENUM EXISTENTES
-- =====================================================
SELECT 
    t.typname AS enum_name,
    array_agg(e.enumlabel ORDER BY e.enumsortorder) AS enum_values
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
GROUP BY t.typname
ORDER BY t.typname;

-- =====================================================
-- 6. VERIFICAR CONSTRAINTS QUE PODEM ESTAR CAUSANDO O PROBLEMA
-- =====================================================
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'users' 
  AND tc.table_schema = 'public'
  AND tc.constraint_type IN ('CHECK', 'FOREIGN KEY')
ORDER BY tc.constraint_name;
