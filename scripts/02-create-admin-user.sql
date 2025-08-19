-- Inserir configurações padrão do sistema
INSERT INTO settings (key, value, description) VALUES
('site_name', 'SMM Panel Pro', 'Nome do site'),
('site_description', 'Painel profissional de marketing de redes sociais', 'Descrição do site'),
('currency', 'BRL', 'Moeda padrão'),
('min_deposit', '10.00', 'Valor mínimo de depósito'),
('admin_email', 'admin@smmpanel.com', 'Email do administrador principal');

-- Função para promover usuário a admin (só pode ser executada por admins existentes)
CREATE OR REPLACE FUNCTION promote_user_to_admin(user_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Verificar se o usuário atual é admin (exceto se não houver admins ainda)
  IF EXISTS (SELECT 1 FROM users WHERE role = 'admin') THEN
    IF NOT EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    ) THEN
      RAISE EXCEPTION 'Apenas administradores podem promover usuários';
    END IF;
  END IF;
  
  -- Encontrar o usuário pelo email
  SELECT id INTO target_user_id 
  FROM users 
  WHERE email = user_email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado: %', user_email;
  END IF;
  
  -- Promover usuário a admin
  UPDATE users 
  SET role = 'admin', updated_at = NOW()
  WHERE id = target_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para remover privilégios de admin
CREATE OR REPLACE FUNCTION demote_admin_to_user(user_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  target_user_id UUID;
  admin_count INTEGER;
BEGIN
  -- Verificar se o usuário atual é admin
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Apenas administradores podem remover privilégios';
  END IF;
  
  -- Contar quantos admins existem
  SELECT COUNT(*) INTO admin_count FROM users WHERE role = 'admin';
  
  IF admin_count <= 1 THEN
    RAISE EXCEPTION 'Deve haver pelo menos um administrador no sistema';
  END IF;
  
  -- Encontrar o usuário pelo email
  SELECT id INTO target_user_id 
  FROM users 
  WHERE email = user_email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado: %', user_email;
  END IF;
  
  -- Verificar se não está tentando remover a si mesmo
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Você não pode remover seus próprios privilégios de admin';
  END IF;
  
  -- Remover privilégios de admin
  UPDATE users 
  SET role = 'user', updated_at = NOW()
  WHERE id = target_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
