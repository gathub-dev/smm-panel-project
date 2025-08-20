-- SCRIPT PARA CORRIGIR O PROBLEMA DO ROLE "admin"
-- Execute este script APÓS analisar os resultados do debug-database.sql

-- =====================================================
-- DIAGNÓSTICO: Verificar o problema atual
-- =====================================================

-- 1. Verificar se existe enum para roles
SELECT 
    t.typname AS enum_name,
    e.enumlabel AS enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname LIKE '%role%'
ORDER BY t.typname, e.enumsortorder;

-- 2. Verificar estrutura atual da coluna role
SELECT 
    column_name,
    data_type,
    udt_name,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name = 'role';

-- 3. Verificar valores atuais na tabela users
SELECT DISTINCT role, COUNT(*) 
FROM users 
GROUP BY role;

-- =====================================================
-- SOLUÇÃO 1: Se a coluna role for ENUM, adicionar "admin"
-- =====================================================

-- Verificar se existe tipo enum user_role
DO $$
BEGIN
    -- Tentar adicionar "admin" ao enum existente
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        -- Adicionar "admin" se não existir
        BEGIN
            ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin';
            RAISE NOTICE 'Valor "admin" adicionado ao enum user_role';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Erro ao adicionar admin ao enum: %', SQLERRM;
        END;
    END IF;
END $$;

-- =====================================================
-- SOLUÇÃO 2: Se não existir enum, criar um
-- =====================================================

-- Criar enum user_role se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('user', 'admin');
        RAISE NOTICE 'Enum user_role criado com valores: user, admin';
    END IF;
END $$;

-- =====================================================
-- SOLUÇÃO 3: Alterar coluna para usar o enum (se necessário)
-- =====================================================

-- Verificar se a coluna precisa ser alterada
DO $$
BEGIN
    -- Se a coluna role não for do tipo user_role, alterar
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
          AND column_name = 'role' 
          AND udt_name != 'user_role'
    ) THEN
        -- Primeiro, garantir que todos os valores são válidos
        UPDATE users SET role = 'user' WHERE role IS NULL OR role NOT IN ('user', 'admin');
        
        -- Alterar o tipo da coluna
        ALTER TABLE users ALTER COLUMN role TYPE user_role USING role::user_role;
        RAISE NOTICE 'Coluna role alterada para usar enum user_role';
    END IF;
END $$;

-- =====================================================
-- SOLUÇÃO 4: Criar enum para status também (se necessário)
-- =====================================================

-- Criar enum user_status se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
        CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');
        RAISE NOTICE 'Enum user_status criado com valores: active, inactive, suspended';
    END IF;
END $$;

-- Alterar coluna status se necessário
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
          AND column_name = 'status' 
          AND udt_name != 'user_status'
    ) THEN
        -- Garantir que todos os valores são válidos
        UPDATE users SET status = 'active' WHERE status IS NULL OR status NOT IN ('active', 'inactive', 'suspended');
        
        -- Alterar o tipo da coluna
        ALTER TABLE users ALTER COLUMN status TYPE user_status USING status::user_status;
        RAISE NOTICE 'Coluna status alterada para usar enum user_status';
    END IF;
END $$;

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se os enums foram criados corretamente
SELECT 
    t.typname AS enum_name,
    e.enumlabel AS enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname IN ('user_role', 'user_status')
ORDER BY t.typname, e.enumsortorder;

-- Verificar estrutura final das colunas
SELECT 
    column_name,
    data_type,
    udt_name,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('role', 'status');

-- Verificar dados finais
SELECT 
    id,
    email,
    role,
    status,
    created_at
FROM users 
ORDER BY created_at DESC 
LIMIT 5;

-- =====================================================
-- GARANTIR QUE EXISTE PELO MENOS UM ADMIN
-- =====================================================

-- Atualizar usuários específicos para admin (substitua pelos emails corretos)
UPDATE users 
SET role = 'admin'::user_role, status = 'active'::user_status
WHERE email IN ('lhost2025@gmail.com', 'admin@exemplo.com');

-- Verificar se os admins foram criados
SELECT 
    email,
    role,
    status,
    updated_at
FROM users 
WHERE role = 'admin';

RAISE NOTICE 'Script de correção executado com sucesso!';
