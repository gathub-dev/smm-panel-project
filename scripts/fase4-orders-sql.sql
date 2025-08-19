-- 🚀 FASE 4: SISTEMA DE MAIS VENDIDOS
-- Execute este SQL no painel do Supabase (SQL Editor)

-- 1. Criar tabela de pedidos
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

-- 2. Índices para performance
CREATE INDEX IF NOT EXISTS idx_orders_service_id ON orders(service_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_shop_category ON orders(shop_category);

-- 3. Trigger para atualizar updated_at
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

-- 4. RLS (Row Level Security)
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

-- 5. View para mais vendidos (últimos 30 dias)
CREATE OR REPLACE VIEW most_sold_services AS
SELECT 
  s.id,
  s.name,
  s.description,
  s.shop_category,
  s.rate,
  s.quantities,
  s.lp_visible,
  s.featured,
  s.provider_rate,
  s.markup_type,
  s.markup_value,
  COUNT(o.id) as total_orders,
  SUM(o.quantity) as total_quantity,
  SUM(o.total_price) as total_revenue,
  AVG(o.total_price) as avg_order_value
FROM services s
LEFT JOIN orders o ON s.id = o.service_id 
  AND o.created_at >= NOW() - INTERVAL '30 days'
  AND o.status = 'completed'
WHERE s.lp_visible = true
GROUP BY s.id, s.name, s.description, s.shop_category, s.rate, s.quantities, s.lp_visible, s.featured, s.provider_rate, s.markup_type, s.markup_value
ORDER BY total_orders DESC, total_quantity DESC;

-- 6. Inserir dados de exemplo (pedidos fictícios para teste)
-- Primeiro, vamos buscar alguns serviços para criar pedidos
DO $$
DECLARE
    service_record RECORD;
    i INTEGER;
    sample_quantities INTEGER[] := ARRAY[100, 250, 500, 1000, 2500];
    sample_statuses TEXT[] := ARRAY['completed', 'completed', 'completed', 'processing'];
    random_quantity INTEGER;
    random_status TEXT;
    unit_price DECIMAL(10,4);
    total_price DECIMAL(10,2);
    random_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Para cada serviço visível na LP, criar alguns pedidos de exemplo
    FOR service_record IN 
        SELECT id, name, shop_category, rate 
        FROM services 
        WHERE lp_visible = true 
        LIMIT 10
    LOOP
        -- Criar 2-5 pedidos por serviço
        FOR i IN 1..(2 + floor(random() * 4)::INTEGER) LOOP
            random_quantity := sample_quantities[1 + floor(random() * array_length(sample_quantities, 1))::INTEGER];
            random_status := sample_statuses[1 + floor(random() * array_length(sample_statuses, 1))::INTEGER];
            unit_price := COALESCE(service_record.rate, 0.01);
            total_price := (unit_price * random_quantity) / 1000;
            random_date := NOW() - (random() * INTERVAL '30 days');
            
            INSERT INTO orders (
                service_id,
                service_name,
                quantity,
                unit_price,
                total_price,
                status,
                payment_status,
                shop_category,
                source,
                created_at
            ) VALUES (
                service_record.id,
                service_record.name,
                random_quantity,
                unit_price,
                total_price,
                random_status,
                'paid',
                COALESCE(service_record.shop_category, 'outros'),
                'loja',
                random_date
            );
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Pedidos de exemplo criados com sucesso!';
END $$;
