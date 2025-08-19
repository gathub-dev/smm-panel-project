-- Script para Limpeza do Banco de Dados SMM Panel
-- Mantém apenas estruturas essenciais e remove todos os dados transacionais
-- ATENÇÃO: Este script irá deletar TODOS os dados, exceto estrutura de usuários

-- ========================================
-- LIMPEZA DE DADOS TRANSACIONAIS
-- ========================================

-- 1. Limpar transações (histórico financeiro)
DELETE FROM public.transactions;
PRINT 'Transações removidas';

-- 2. Limpar pedidos
DELETE FROM public.orders;
PRINT 'Pedidos removidos';

-- 3. Limpar serviços
DELETE FROM public.services;
PRINT 'Serviços removidos';

-- 4. Limpar categorias
DELETE FROM public.categories;
PRINT 'Categorias removidas';

-- 5. Limpar chaves de API
DELETE FROM public.api_keys;
PRINT 'Chaves de API removidas';

-- ========================================
-- RESET DE DADOS DE USUÁRIOS (OPCIONAL)
-- ========================================

-- Resetar saldos de todos os usuários para zero
UPDATE public.users 
SET balance = 0.00, 
    updated_at = NOW()
WHERE balance != 0.00;
PRINT 'Saldos de usuários resetados para zero';

-- Remover usuários não-admin (opcional - descomente se necessário)
-- DELETE FROM public.users WHERE role != 'admin';
-- PRINT 'Usuários não-admin removidos';

-- ========================================
-- LIMPEZA DE CONFIGURAÇÕES (OPCIONAL)
-- ========================================

-- Limpar configurações personalizadas (mantém apenas essenciais)
DELETE FROM public.settings 
WHERE key NOT IN (
    'site_name',
    'site_description', 
    'maintenance_mode',
    'registration_enabled'
);
PRINT 'Configurações não-essenciais removidas';

-- ========================================
-- RESET DE SEQUÊNCIAS E IDs
-- ========================================

-- Reset de sequências (se existirem)
-- ALTER SEQUENCE IF EXISTS orders_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS transactions_id_seq RESTART WITH 1;

-- ========================================
-- VERIFICAÇÃO FINAL
-- ========================================

-- Mostrar contagem final das tabelas
SELECT 'users' as tabela, COUNT(*) as registros FROM public.users
UNION ALL
SELECT 'categories' as tabela, COUNT(*) as registros FROM public.categories
UNION ALL
SELECT 'services' as tabela, COUNT(*) as registros FROM public.services
UNION ALL
SELECT 'orders' as tabela, COUNT(*) as registros FROM public.orders
UNION ALL
SELECT 'transactions' as tabela, COUNT(*) as registros FROM public.transactions
UNION ALL
SELECT 'api_keys' as tabela, COUNT(*) as registros FROM public.api_keys
UNION ALL
SELECT 'settings' as tabela, COUNT(*) as registros FROM public.settings
ORDER BY tabela;

PRINT 'Limpeza do banco de dados concluída!';
PRINT 'Estruturas mantidas: users, settings (configurações essenciais)';
PRINT 'Dados removidos: orders, transactions, services, categories, api_keys';
