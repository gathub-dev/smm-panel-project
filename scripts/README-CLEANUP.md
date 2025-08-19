# Scripts de Limpeza do Banco de Dados

Este diretório contém scripts para limpar o banco de dados do SMM Panel, mantendo apenas as estruturas essenciais para login e funcionalidades básicas.

## 📋 O que é removido

- ✅ **Transações** - Todo histórico financeiro
- ✅ **Pedidos** - Todos os pedidos realizados
- ✅ **Serviços** - Todos os serviços cadastrados
- ✅ **Categorias** - Todas as categorias de serviços
- ✅ **Chaves de API** - Todas as integrações com provedores
- ✅ **Configurações não-essenciais** - Mantém apenas configurações básicas

## 🔒 O que é mantido

- ✅ **Usuários** - Todos os usuários (com saldos zerados)
- ✅ **Estrutura das tabelas** - Schema completo
- ✅ **Configurações essenciais** - site_name, maintenance_mode, etc.
- ✅ **Políticas RLS** - Segurança mantida

## 🚀 Como usar

### Opção 1: Script Interativo (Recomendado)
```bash
node scripts/cleanup-database.js
```
- Solicita confirmação antes de executar
- Mostra relatório detalhado
- Mais seguro para uso em produção

### Opção 2: Limpeza Rápida
```bash
node scripts/quick-cleanup.js
```
- Execução imediata sem confirmação
- Ideal para desenvolvimento/testes
- Mais rápido

### Opção 3: SQL Direto
```bash
# Execute o arquivo SQL diretamente no Supabase Dashboard
# ou usando psql:
psql -h [host] -U [user] -d [database] -f scripts/cleanup-database.sql
```

## ⚠️ Avisos Importantes

1. **BACKUP**: Sempre faça backup antes de executar
2. **IRREVERSÍVEL**: Os dados removidos não podem ser recuperados
3. **PRODUÇÃO**: Use com extrema cautela em ambiente de produção
4. **VARIÁVEIS**: Certifique-se de que as variáveis de ambiente estão configuradas

## 🔧 Pré-requisitos

```bash
# Instalar dependências (se necessário)
npm install @supabase/supabase-js dotenv

# Configurar variáveis de ambiente
NEXT_PUBLIC_SUPABASE_URL=sua_url_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_aqui
```

## 📊 Verificação Pós-Limpeza

Após executar qualquer script, você pode verificar o resultado:

```bash
node scripts/verify-database.js
```

Ou verificar manualmente no Supabase Dashboard:
- Vá para Table Editor
- Verifique se as tabelas estão vazias (exceto users e settings)
- Confirme que os saldos dos usuários estão em 0.00

## 🔄 Reconstruir Dados

Após a limpeza, você pode:

1. **Recriar categorias básicas**:
   ```bash
   node scripts/02-seed-initial-data.sql
   ```

2. **Importar serviços**:
   ```bash
   node scripts/03-seed-sample-services.sql
   ```

3. **Configurar APIs**:
   - Adicione suas chaves de API manualmente
   - Configure os provedores (MTP, JAP)

## 🆘 Recuperação de Emergência

Se algo der errado:

1. **Restaurar backup** (se disponível)
2. **Recriar schema**:
   ```bash
   node scripts/01-create-database-schema.sql
   ```
3. **Recriar usuário admin**:
   ```bash
   node scripts/02-create-admin-user.sql
   ```

## 📝 Logs

Os scripts geram logs detalhados mostrando:
- Quantos registros foram removidos de cada tabela
- Erros encontrados (se houver)
- Status final de cada operação

---

**💡 Dica**: Para desenvolvimento, use `quick-cleanup.js`. Para produção, sempre use `cleanup-database.js` com confirmação.
