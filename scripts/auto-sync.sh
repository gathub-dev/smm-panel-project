#!/bin/bash
# Script de sincronização automática do SMM Panel
# Executado automaticamente pelo cron

cd "/Users/vitorhugo/Downloads/smm-panel-project-main"

echo "🔄 Iniciando sincronização automática - $(date)"

# Executar monitoramento
node scripts/monitor-and-sync.js

# Se houve mudanças significativas, executar correção de preços
if [ $? -eq 0 ]; then
    echo "✅ Monitoramento concluído"
    
    # Verificar se precisa atualizar preços (baseado na última atualização)
    LAST_UPDATE=$(node -e "
        require('dotenv').config();
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
        
        supabase.from('settings').select('value').eq('key', 'last_price_update').single()
        .then(({data}) => {
            const lastUpdate = data?.value ? new Date(data.value) : new Date(0);
            const hoursSince = (new Date() - lastUpdate) / (1000 * 60 * 60);
            console.log(hoursSince > 6 ? 'UPDATE_NEEDED' : 'NO_UPDATE');
        })
        .catch(() => console.log('UPDATE_NEEDED'));
    ")
    
    if [ "$LAST_UPDATE" = "UPDATE_NEEDED" ]; then
        echo "🔧 Executando atualização de preços..."
        node scripts/fix-and-validate-prices.js
        
        # Salvar timestamp da última atualização
        node -e "
            require('dotenv').config();
            const { createClient } = require('@supabase/supabase-js');
            const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
            
            supabase.from('settings').upsert({
                key: 'last_price_update',
                value: new Date().toISOString(),
                description: 'Última atualização automática de preços'
            }).then(() => console.log('✅ Timestamp atualizado'));
        "
    else
        echo "⏭️ Preços atualizados recentemente, pulando..."
    fi
else
    echo "❌ Erro no monitoramento"
fi

echo "🏁 Sincronização automática finalizada - $(date)"
echo "----------------------------------------"
