const { createClient } = require('@supabase/supabase-js')

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createOrdersTable() {
  console.log('🚀 [FASE 4] Criando sistema de mais vendidos...\n')

  try {
    // 1. Verificar se a tabela orders já existe
    console.log('📋 Verificando se tabela orders existe...')
    const { data: existingOrders, error: checkError } = await supabase
      .from('orders')
      .select('id')
      .limit(1)

    if (!checkError) {
      console.log('✅ Tabela orders já existe!')
      
      // Verificar estrutura
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .limit(1)
      
      if (orders && orders.length > 0) {
        console.log('📊 Campos existentes na tabela orders:')
        Object.keys(orders[0]).forEach(key => {
          console.log(`   • ${key}`)
        })
      }
    } else {
      console.log('⚠️  Tabela orders não existe. Criando...')
      console.log('\n📝 INSTRUÇÕES PARA CRIAR A TABELA ORDERS:')
      console.log('Execute este SQL no painel do Supabase (SQL Editor):')
      console.log(`
-- Criar tabela de pedidos
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  service_id UUID REFERENCES services(id),
  service_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,4) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled', 'refunded')),
  payment_method VARCHAR(50),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  link TEXT,
  start_count INTEGER DEFAULT 0,
  remains INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Campos para analytics
  shop_category TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  source VARCHAR(20) DEFAULT 'loja' CHECK (source IN ('loja', 'painel', 'api'))
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_orders_service_id ON orders(service_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_shop_category ON orders(shop_category);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_orders_updated_at();

-- RLS (Row Level Security) - opcional
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem apenas seus próprios pedidos
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

-- Política para inserir pedidos
CREATE POLICY "Users can insert own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para admins verem todos os pedidos
CREATE POLICY "Admins can view all orders" ON orders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );
      `)
    }

    // 2. Criar dados de exemplo se a tabela existir
    if (!checkError) {
      console.log('\n🔧 Criando dados de exemplo...')
      
      // Buscar alguns serviços para criar pedidos de exemplo
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('id, name, shop_category, rate')
        .eq('lp_visible', true)
        .limit(5)

      if (servicesError) {
        console.log('⚠️  Erro ao buscar serviços:', servicesError.message)
      } else if (services && services.length > 0) {
        console.log(`📦 Criando pedidos de exemplo para ${services.length} serviços...`)
        
        const sampleOrders = []
        
        services.forEach((service, index) => {
          // Criar 2-5 pedidos por serviço
          const orderCount = Math.floor(Math.random() * 4) + 2
          
          for (let i = 0; i < orderCount; i++) {
            const quantity = [100, 250, 500, 1000, 2500][Math.floor(Math.random() * 5)]
            const unitPrice = service.rate || 0.01
            const totalPrice = (unitPrice * quantity) / 1000
            
            sampleOrders.push({
              service_id: service.id,
              service_name: service.name,
              quantity,
              unit_price: unitPrice,
              total_price: totalPrice,
              status: ['completed', 'completed', 'completed', 'processing'][Math.floor(Math.random() * 4)],
              payment_status: 'paid',
              shop_category: service.shop_category || 'outros',
              source: 'loja',
              created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() // Últimos 30 dias
            })
          }
        })

        const { error: insertError } = await supabase
          .from('orders')
          .insert(sampleOrders)

        if (insertError) {
          console.log('⚠️  Erro ao inserir pedidos de exemplo:', insertError.message)
        } else {
          console.log(`✅ ${sampleOrders.length} pedidos de exemplo criados!`)
        }
      }
    }

    // 3. Criar view para mais vendidos
    console.log('\n📊 Criando view para mais vendidos...')
    console.log('Execute este SQL adicional no Supabase:')
    console.log(`
-- View para mais vendidos (últimos 30 dias)
CREATE OR REPLACE VIEW most_sold_services AS
SELECT 
  s.id,
  s.name,
  s.shop_category,
  s.rate,
  s.quantities,
  s.lp_visible,
  s.featured,
  COUNT(o.id) as total_orders,
  SUM(o.quantity) as total_quantity,
  SUM(o.total_price) as total_revenue,
  AVG(o.total_price) as avg_order_value
FROM services s
LEFT JOIN orders o ON s.id = o.service_id 
  AND o.created_at >= NOW() - INTERVAL '30 days'
  AND o.status = 'completed'
WHERE s.lp_visible = true
GROUP BY s.id, s.name, s.shop_category, s.rate, s.quantities, s.lp_visible, s.featured
ORDER BY total_orders DESC, total_quantity DESC;
    `)

    console.log('\n🎉 FASE 4 PREPARADA!')
    console.log('📋 Próximos passos:')
    console.log('   1. Execute o SQL no painel do Supabase')
    console.log('   2. A tabela orders será criada')
    console.log('   3. Dados de exemplo serão inseridos')
    console.log('   4. View most_sold_services será criada')

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

// Executar
createOrdersTable()

