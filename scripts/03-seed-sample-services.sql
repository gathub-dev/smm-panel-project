-- Seed sample services for testing

-- First, let's get the category IDs
DO $$
DECLARE
    instagram_id UUID;
    facebook_id UUID;
    twitter_id UUID;
    youtube_id UUID;
    tiktok_id UUID;
    linkedin_id UUID;
BEGIN
    -- Get category IDs
    SELECT id INTO instagram_id FROM public.categories WHERE name = 'Instagram';
    SELECT id INTO facebook_id FROM public.categories WHERE name = 'Facebook';
    SELECT id INTO twitter_id FROM public.categories WHERE name = 'Twitter';
    SELECT id INTO youtube_id FROM public.categories WHERE name = 'YouTube';
    SELECT id INTO tiktok_id FROM public.categories WHERE name = 'TikTok';
    SELECT id INTO linkedin_id FROM public.categories WHERE name = 'LinkedIn';

    -- Instagram Services
    INSERT INTO public.services (category_id, name, description, provider, provider_service_id, rate, min_quantity, max_quantity, type, dripfeed, refill) VALUES
    (instagram_id, 'Instagram Followers [Real]', 'High quality Instagram followers from real accounts', 'mtp', 'IG001', 2.50, 100, 10000, 'default', true, true),
    (instagram_id, 'Instagram Likes [Instant]', 'Fast Instagram likes delivery within minutes', 'mtp', 'IG002', 0.80, 50, 5000, 'default', false, false),
    (instagram_id, 'Instagram Views [Story]', 'Instagram story views from real users', 'jap', 'IG003', 0.30, 100, 50000, 'default', true, false),
    (instagram_id, 'Instagram Comments [Custom]', 'Custom Instagram comments from real accounts', 'mtp', 'IG004', 8.00, 5, 500, 'custom_comments', false, false);

    -- Facebook Services
    INSERT INTO public.services (category_id, name, description, provider, provider_service_id, rate, min_quantity, max_quantity, type, dripfeed, refill) VALUES
    (facebook_id, 'Facebook Page Likes', 'Real Facebook page likes from active users', 'mtp', 'FB001', 3.20, 100, 5000, 'default', true, true),
    (facebook_id, 'Facebook Post Likes', 'Fast Facebook post likes delivery', 'jap', 'FB002', 1.50, 50, 2000, 'default', false, false),
    (facebook_id, 'Facebook Followers', 'High quality Facebook profile followers', 'mtp', 'FB003', 4.00, 100, 3000, 'default', true, true);

    -- Twitter Services
    INSERT INTO public.services (category_id, name, description, provider, provider_service_id, rate, min_quantity, max_quantity, type, dripfeed, refill) VALUES
    (twitter_id, 'Twitter Followers [HQ]', 'High quality Twitter followers with profile pictures', 'jap', 'TW001', 5.50, 100, 10000, 'default', true, true),
    (twitter_id, 'Twitter Likes', 'Fast Twitter likes from real accounts', 'mtp', 'TW002', 1.20, 50, 5000, 'default', false, false),
    (twitter_id, 'Twitter Retweets', 'Real Twitter retweets to boost engagement', 'jap', 'TW003', 2.80, 25, 2000, 'default', false, false);

    -- YouTube Services
    INSERT INTO public.services (category_id, name, description, provider, provider_service_id, rate, min_quantity, max_quantity, type, dripfeed, refill) VALUES
    (youtube_id, 'YouTube Subscribers', 'Real YouTube subscribers with retention guarantee', 'mtp', 'YT001', 12.00, 100, 5000, 'default', true, true),
    (youtube_id, 'YouTube Views [Real]', 'High retention YouTube views from real users', 'jap', 'YT002', 1.80, 1000, 100000, 'default', true, false),
    (youtube_id, 'YouTube Likes', 'Fast YouTube video likes delivery', 'mtp', 'YT003', 3.50, 50, 2000, 'default', false, false);

    -- TikTok Services
    INSERT INTO public.services (category_id, name, description, provider, provider_service_id, rate, min_quantity, max_quantity, type, dripfeed, refill) VALUES
    (tiktok_id, 'TikTok Followers [Real]', 'Real TikTok followers from active accounts', 'jap', 'TT001', 6.80, 100, 10000, 'default', true, true),
    (tiktok_id, 'TikTok Likes [Fast]', 'Fast TikTok likes delivery within hours', 'mtp', 'TT002', 2.20, 100, 10000, 'default', false, false),
    (tiktok_id, 'TikTok Views', 'High quality TikTok video views', 'jap', 'TT003', 0.60, 1000, 100000, 'default', true, false);

    -- LinkedIn Services
    INSERT INTO public.services (category_id, name, description, provider, provider_service_id, rate, min_quantity, max_quantity, type, dripfeed, refill) VALUES
    (linkedin_id, 'LinkedIn Connections', 'Professional LinkedIn connections from real profiles', 'mtp', 'LI001', 15.00, 50, 1000, 'default', true, false),
    (linkedin_id, 'LinkedIn Post Likes', 'LinkedIn post likes from professionals', 'jap', 'LI002', 8.50, 25, 500, 'default', false, false),
    (linkedin_id, 'LinkedIn Followers', 'High quality LinkedIn profile followers', 'mtp', 'LI003', 12.50, 100, 2000, 'default', true, true);

END $$;
