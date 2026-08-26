-- 1. Update Hospital Addresses to India
UPDATE public.hospitals SET address = 'Safdarjung Enclave, New Delhi, DL', phone = '011-2616-5555' WHERE name = 'City General Hospital';
UPDATE public.hospitals SET address = 'Bandra West, Mumbai, MH', phone = '022-2642-1234' WHERE name = 'Deaf Care Specialist Center';
UPDATE public.hospitals SET address = 'Jayanagar, Bangalore, KA', phone = '080-2663-9876' WHERE name = 'Metro Cardiac Clinic';
UPDATE public.hospitals SET address = 'Salt Lake City, Kolkata, WB', phone = '033-2321-4567' WHERE name = 'Sunset Dental';
UPDATE public.hospitals SET address = 'Anna Nagar, Chennai, TN', phone = '044-2621-3456' WHERE name = 'Valley Orthopedics';
UPDATE public.hospitals SET address = 'Banjara Hills, Hyderabad, TS', phone = '040-2339-1111' WHERE name = 'Clear Vision Eye Center';
UPDATE public.hospitals SET address = 'Koregaon Park, Pune, MH', phone = '020-2615-2222' WHERE name = 'Women''s Health Institute';
UPDATE public.hospitals SET address = 'Sector 17, Chandigarh, CH', phone = '0172-270-3333' WHERE name = 'Kids First Pediatrics';
UPDATE public.hospitals SET address = 'Vastrapur, Ahmedabad, GJ', phone = '079-2630-4444' WHERE name = 'Mind & Wellness Center';
UPDATE public.hospitals SET address = 'Gomti Nagar, Lucknow, UP', phone = '0522-230-5555' WHERE name = 'Advanced Neurology';
UPDATE public.hospitals SET address = 'Civil Lines, Jaipur, RJ', phone = '0141-222-6666' WHERE name = 'Skin Deep Dermatology';
UPDATE public.hospitals SET address = 'Arera Colony, Bhopal, MP', phone = '0755-246-7777' WHERE name = 'Total Rehab Services';
UPDATE public.hospitals SET address = 'Frazer Town, Bangalore, KA', phone = '080-2548-8888' WHERE name = 'Digestive Health Clinic';
UPDATE public.hospitals SET address = 'Colaba, Mumbai, MH', phone = '022-2285-9999' WHERE name = 'Breathe Easy Pulmonary';
UPDATE public.hospitals SET address = 'Vasant Kunj, New Delhi, DL', phone = '011-2689-0000' WHERE name = 'Endocrine Specialists';

-- 4. Replace ASL with ISL in existing DB records
UPDATE public.community_groups SET name = REPLACE(name, 'ASL', 'ISL'), description = REPLACE(description, 'ASL', 'ISL');
UPDATE public.ngos SET name = REPLACE(name, 'ASL', 'ISL'), description = REPLACE(description, 'ASL', 'ISL'), focus_area = REPLACE(focus_area, 'ASL', 'ISL');
UPDATE public.courses SET title = REPLACE(title, 'ASL', 'ISL'), description = REPLACE(description, 'ASL', 'ISL');
UPDATE public.lessons SET title = REPLACE(title, 'ASL', 'ISL'), content_text = REPLACE(content_text, 'ASL', 'ISL');
UPDATE public.job_listings SET title = REPLACE(title, 'ASL', 'ISL'), description = REPLACE(description, 'ASL', 'ISL');

-- 2. Seed some initial Real-Time Community Threads so it's not empty
INSERT INTO public.forum_threads (category, title, content, author_id)
SELECT 
  'General', 
  'Welcome to the new ISL Community Hub!', 
  'We are excited to launch this new real-time community forum! Introduce yourself below.', 
  id 
FROM auth.users LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.forum_threads (category, title, content, author_id)
SELECT 
  'Education', 
  'Best resources for learning ISL?', 
  'Does anyone have good recommendations for practicing Indian Sign Language online?', 
  id 
FROM auth.users LIMIT 1
ON CONFLICT DO NOTHING;

-- Enable Realtime for forum_threads to make it a "Real-time community"
ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_threads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_replies;
