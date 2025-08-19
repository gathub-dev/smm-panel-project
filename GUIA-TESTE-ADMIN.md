# 🚀 Guia de Teste - Painel Administrativo SMM

## ✅ Pré-requisitos Concluídos
- [x] SQL executado no Supabase
- [x] Servidor rodando (`npm run dev`)
- [x] Banco de dados atualizado

## 🎯 TESTE PASSO A PASSO

### 1. 🌐 Acesse o Painel Admin
```
URL: http://localhost:3000/dashboard/admin
```

### 2. 🔑 Configure as API Keys

**Na aba "APIs":**
1. Clique em "API Keys"
2. Selecione "MoreThanPanel (MTP)" ou "JustAnotherPanel (JAP)"
3. Cole sua chave de API
4. Clique "Salvar"
5. Teste a conectividade

**Exemplo de chaves para teste:**
- MTP: `sua-chave-mtp-aqui`
- JAP: `sua-chave-jap-aqui`

### 3. 🔄 Sincronize os Serviços

1. Clique no botão "Sincronizar Serviços"
2. Aguarde a sincronização
3. Verifique se os serviços apareceram na aba "Serviços"

### 4. 💰 Configure Markups

**Na aba "Serviços":**
1. Use as ações rápidas:
   - "Markup 20% (Todos)" - adiciona 20% sobre o preço do provedor
   - "Markup 30% (Todos)" - adiciona 30% sobre o preço do provedor
   - "+$0.50 (Todos)" - adiciona $0.50 fixo sobre cada serviço

### 5. ✅ Ative os Serviços

1. Na lista de serviços, ative os que deseja vender
2. Verifique se os preços estão corretos
3. Teste criar um pedido como usuário normal

## 🔍 Verificações Importantes

### Dashboard Principal
- [ ] Estatísticas aparecem corretamente
- [ ] Status das APIs (verde = conectado)
- [ ] Contadores de serviços ativos
- [ ] Pedidos pendentes

### Aba APIs
- [ ] Chaves salvas aparecem mascaradas
- [ ] Status de conectividade funciona
- [ ] Saldos dos provedores aparecem
- [ ] Botão "Testar Conexões" funciona

### Aba Serviços  
- [ ] Estatísticas corretas (total, ativos, etc.)
- [ ] Botão sincronizar funciona
- [ ] Ações rápidas de markup funcionam
- [ ] Data da última sincronização aparece

### Aba Pedidos
- [ ] Contadores de pedidos pendentes
- [ ] Pedidos com erro (se houver)
- [ ] Botão "Sincronizar Status" funciona

## 🚨 Resolução de Problemas

### Se as APIs não conectarem:
1. Verifique se as chaves estão corretas
2. Teste as chaves diretamente nos sites dos provedores
3. Verifique se há limite de IP nos provedores

### Se a sincronização falhar:
1. Abra o console do navegador (F12)
2. Verifique erros de JavaScript
3. Confirme se o SQL foi executado corretamente

### Se os preços não atualizarem:
1. Verifique se o trigger foi criado no banco
2. Teste alterar um markup manualmente
3. Confirme se a função `calculate_service_price` existe

## 📊 Funcionalidades Testáveis

### ✅ Integração com APIs
- Sincronização de serviços MTP/JAP
- Criação automática de pedidos
- Verificação de status em tempo real
- Refill automático (se suportado)

### ✅ Sistema de Markup
- Markup percentual (ex: 20%, 30%)
- Markup fixo (ex: +$0.50, +$1.00)
- Aplicação em lote
- Cálculo automático de preços

### ✅ Monitoramento
- Status de conectividade
- Saldos dos provedores
- Logs de sincronização
- Estatísticas em tempo real

## 🎉 Sucesso!

Se tudo funcionar corretamente, você terá:
- ✅ Painel administrativo completo
- ✅ Integração total com APIs MTP/JAP
- ✅ Sistema de markup inteligente
- ✅ Sincronização automática
- ✅ Monitoramento em tempo real

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do console (F12)
2. Confirme se o SQL foi executado
3. Teste as chaves de API diretamente
4. Verifique se o servidor está rodando

**URL do Painel:** http://localhost:3000/dashboard/admin 