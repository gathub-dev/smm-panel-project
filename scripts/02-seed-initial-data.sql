-- Seed initial data for SMM Panel

-- Insert default categories
INSERT INTO public.categories (name, description, icon, sort_order) VALUES
('Instagram', 'Instagram services including followers, likes, views', 'instagram', 1),
('Facebook', 'Facebook services for pages and posts', 'facebook', 2),
('Twitter', 'Twitter followers, likes, retweets', 'twitter', 3),
('YouTube', 'YouTube subscribers, views, likes', 'youtube', 4),
('TikTok', 'TikTok followers, likes, views', 'tiktok', 5),
('LinkedIn', 'LinkedIn connections and engagement', 'linkedin', 6)
ON CONFLICT DO NOTHING;

-- Insert default settings
INSERT INTO public.settings (key, value, description) VALUES
('site_name', 'SMM Panel Pro', 'Website name'),
('site_description', 'Professional Social Media Marketing Panel', 'Website description'),
('currency', 'USD', 'Default currency'),
('min_deposit', '5.00', 'Minimum deposit amount'),
('max_deposit', '1000.00', 'Maximum deposit amount'),
('default_timezone', 'UTC', 'Default timezone'),
('maintenance_mode', 'false', 'Enable/disable maintenance mode'),
('registration_enabled', 'true', 'Enable/disable user registration'),
('email_verification_required', 'true', 'Require email verification for new users')
ON CONFLICT (key) DO NOTHING;

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update user balance
CREATE OR REPLACE FUNCTION public.update_user_balance(
  user_uuid UUID,
  transaction_type TEXT,
  amount_change DECIMAL(10,2),
  description_text TEXT DEFAULT NULL,
  related_order_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  current_balance DECIMAL(10,2);
  new_balance DECIMAL(10,2);
BEGIN
  -- Get current balance
  SELECT balance INTO current_balance
  FROM public.users
  WHERE id = user_uuid;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Calculate new balance
  new_balance := current_balance + amount_change;
  
  -- Check if balance would go negative (except for order transactions)
  IF new_balance < 0 AND transaction_type != 'order' THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;
  
  -- Update user balance
  UPDATE public.users
  SET balance = new_balance, updated_at = NOW()
  WHERE id = user_uuid;
  
  -- Insert transaction record
  INSERT INTO public.transactions (
    user_id, type, amount, balance_before, balance_after, description, order_id
  ) VALUES (
    user_uuid, transaction_type, amount_change, current_balance, new_balance, description_text, related_order_id
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
