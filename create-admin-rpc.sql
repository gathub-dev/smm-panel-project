-- Função RPC para verificar se usuário é admin (evita problemas de RLS)
-- Execute este SQL no painel do Supabase (SQL Editor)

-- 1. Criar função para verificar se usuário é admin
CREATE OR REPLACE FUNCTION check_user_is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o usuário existe e é admin
  RETURN EXISTS (
    SELECT 1 
    FROM users 
    WHERE id = user_id 
    AND role = 'admin'
  );
END;
$$;

-- 2. Dar permissões para a função
GRANT EXECUTE ON FUNCTION check_user_is_admin(UUID) TO authenticated;

-- 3. Criar função para atualizar role do usuário no metadata (caso necessário)
CREATE OR REPLACE FUNCTION update_user_role_metadata(user_email TEXT, new_role TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Atualizar role na tabela users
  UPDATE users 
  SET role = new_role 
  WHERE email = user_email;
  
  -- Atualizar metadata no auth.users também
  UPDATE auth.users 
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', new_role)
  WHERE email = user_email;
END;
$$;

-- 4. Dar permissões para a função
GRANT EXECUTE ON FUNCTION update_user_role_metadata(TEXT, TEXT) TO authenticated;

-- 5. Executar para garantir que seu usuário seja admin
SELECT update_user_role_metadata('lhost2025@gmail.com', 'admin');

-- 6. Verificar se funcionou
SELECT check_user_is_admin('472c2e96-ca33-4a50-8393-36c78a00eb4e');
