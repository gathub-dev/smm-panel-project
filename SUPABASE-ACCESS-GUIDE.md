# 🔑 COMO DAR ACESSO AO SUPABASE PARA O CURSOR

## 📋 OPÇÕES PARA COMPARTILHAR ACESSO

### 🎯 **OPÇÃO 1: VARIÁVEIS DE AMBIENTE (RECOMENDADO)**

1. **Crie um arquivo `.env.local`** na raiz do projeto:
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
```

2. **Onde encontrar as chaves no Supabase:**
   - Vá para: `Project Settings` → `API`
   - **URL**: Project URL
   - **ANON KEY**: `anon` `public`
   - **SERVICE ROLE**: `service_role` `secret` ⚠️

3. **Compartilhe as credenciais:**
   - Cole as 3 variáveis aqui no chat
   - Ou crie o arquivo `.env.local` e eu posso ler

### 🎯 **OPÇÃO 2: ACESSO TEMPORÁRIO AO PROJETO**

1. **Adicionar colaborador no Supabase:**
   - Vá para: `Project Settings` → `Team`
   - Clique em `Invite a member`
   - Email: (me forneça um email temporário)
   - Role: `Owner` ou `Admin`

2. **Remover acesso depois:**
   - Após terminarmos, você remove o acesso

### 🎯 **OPÇÃO 3: EXECUTAR SCRIPTS VIA CURSOR**

1. **Criar script de execução:**
```javascript
// scripts/executar-sql.js
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function executarSQL(sql) {
  const { data, error } = await supabase.rpc('exec_sql', { sql })
  console.log(data, error)
}
```

2. **Eu crio os scripts, você executa**

## 🚀 **RECOMENDAÇÃO**

**Use a OPÇÃO 1** - é mais segura e rápida:

1. Copie suas credenciais do Supabase
2. Cole aqui no chat ou crie `.env.local`
3. Eu executo os comandos diretamente
4. Você mantém controle total

## 🔒 **SEGURANÇA**

- ✅ `.env.local` não vai para o Git (já está no .gitignore)
- ✅ Credenciais ficam apenas local
- ✅ Você pode regenerar as chaves depois
- ✅ Acesso apenas durante o desenvolvimento

## 📝 **O QUE PRECISO**

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Qual opção você prefere? 🤔**
