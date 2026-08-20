-- Healthcare Module Schema Setup

-- 1. Create Hospitals Table
CREATE TABLE IF NOT EXISTS public.hospitals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    specialty TEXT,
    address TEXT,
    lat FLOAT,
    lng FLOAT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Alter Profiles Table
-- Add hospital_id linking for Hospital and Doctor roles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS hospital_id UUID REFERENCES public.hospitals(id);

-- Add emergency contact for SOS feature
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS emergency_contact_email TEXT;

-- 3. Create Appointments Table
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
    specialist_name TEXT,
    appointment_time TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'Pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Medical Records Table
CREATE TABLE IF NOT EXISTS public.medical_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    file_path TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create Record Access Table (Explicit Grants)
CREATE TABLE IF NOT EXISTS public.record_access (
    record_id UUID REFERENCES public.medical_records(id) ON DELETE CASCADE,
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (record_id, hospital_id)
);

-- 6. Create Reminders Table
CREATE TABLE IF NOT EXISTS public.reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    medicine_name TEXT NOT NULL,
    time_schedule TEXT NOT NULL, -- Format 'HH:MM'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create SOS Alerts Table
CREATE TABLE IF NOT EXISTS public.sos_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    lat FLOAT,
    lng FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7.5 Create Chats Table for Appointments
CREATE TABLE IF NOT EXISTS public.chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Enable Row Level Security (RLS)
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.record_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies

-- Hospitals: Anyone can read
CREATE POLICY "Public can view hospitals" ON public.hospitals FOR SELECT USING (true);

-- Appointments: Users see their own
CREATE POLICY "Users view own appointments" ON public.appointments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own appointments" ON public.appointments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Appointments: Hospitals see appointments linked to their hospital_id
CREATE POLICY "Hospitals view linked appointments" ON public.appointments FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.hospital_id = appointments.hospital_id)
);

-- Medical Records: Users see/manage their own
CREATE POLICY "Users view own records" ON public.medical_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own records" ON public.medical_records FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Medical Records: Hospitals see records explicitly granted to them
CREATE POLICY "Hospitals view granted records" ON public.medical_records FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.record_access ra
        JOIN public.profiles p ON p.hospital_id = ra.hospital_id
        WHERE ra.record_id = medical_records.id AND p.id = auth.uid()
    )
);

-- Record Access: Users can grant access to their own records
CREATE POLICY "Users manage record access" ON public.record_access FOR ALL USING (
    EXISTS (SELECT 1 FROM public.medical_records mr WHERE mr.id = record_access.record_id AND mr.user_id = auth.uid())
);
CREATE POLICY "Hospitals view record access" ON public.record_access FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.hospital_id = record_access.hospital_id)
);

-- Reminders: Users own their reminders
CREATE POLICY "Users manage own reminders" ON public.reminders FOR ALL USING (auth.uid() = user_id);

-- SOS Alerts: Users can insert their own
CREATE POLICY "Users insert own sos" ON public.sos_alerts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users view own sos" ON public.sos_alerts FOR SELECT USING (auth.uid() = user_id);

-- Chats: Sender or participant
CREATE POLICY "Users view own chats" ON public.chats FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.appointments a WHERE a.id = chats.appointment_id AND a.user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.appointments a JOIN public.profiles p ON p.hospital_id = a.hospital_id WHERE a.id = chats.appointment_id AND p.id = auth.uid())
);
CREATE POLICY "Users insert chats" ON public.chats FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- 10. Seed Data
-- Seed Hospitals
INSERT INTO public.hospitals (name, specialty, address, lat, lng, phone) VALUES
('City General Hospital', 'General Medicine', '123 Main St, New York, NY', 40.7128, -74.0060, '555-0101'),
('Deaf Care Specialist Center', 'Audiology & ENT', '456 Oak St, Brooklyn, NY', 40.6501, -73.9496, '555-0102'),
('Metro Cardiac Clinic', 'Cardiology', '789 Pine Ave, Queens, NY', 40.7282, -73.7949, '555-0103'),
('Sunset Dental', 'Dentistry', '321 Elm St, Bronx, NY', 40.8448, -73.8648, '555-0104'),
('Valley Orthopedics', 'Orthopedics', '654 Maple Dr, Staten Island, NY', 40.5795, -74.1502, '555-0105'),
('Clear Vision Eye Center', 'Ophthalmology', '987 Cedar Rd, Jersey City, NJ', 40.7282, -74.0776, '555-0106'),
('Women''s Health Institute', 'Gynecology', '147 Birch Blvd, Hoboken, NJ', 40.7440, -74.0324, '555-0107'),
('Kids First Pediatrics', 'Pediatrics', '258 Spruce Way, Newark, NJ', 40.7357, -74.1724, '555-0108'),
('Mind & Wellness Center', 'Psychiatry', '369 Ash Ct, Paterson, NJ', 40.9168, -74.1718, '555-0109'),
('Advanced Neurology', 'Neurology', '741 Walnut St, Yonkers, NY', 40.9312, -73.8987, '555-0110'),
('Skin Deep Dermatology', 'Dermatology', '852 Chestnut Ave, White Plains, NY', 41.0340, -73.7629, '555-0111'),
('Total Rehab Services', 'Physical Therapy', '963 Willow Ln, New Rochelle, NY', 40.9115, -73.7824, '555-0112'),
('Digestive Health Clinic', 'Gastroenterology', '159 Poplar Pl, Mount Vernon, NY', 40.9126, -73.8371, '555-0113'),
('Breathe Easy Pulmonary', 'Pulmonology', '357 Sycamore Dr, Hackensack, NJ', 40.8859, -74.0435, '555-0114'),
('Endocrine Specialists', 'Endocrinology', '753 Beech St, Fort Lee, NJ', 40.8509, -73.9701, '555-0115');

-- 11. Storage Policies (Note: The bucket 'medical_documents' must be created in the Supabase UI first)
-- If the bucket exists, these policies secure it:
CREATE POLICY "Users can upload medical docs" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'medical_documents' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can view own medical docs" ON storage.objects FOR SELECT USING (
    bucket_id = 'medical_documents' AND auth.uid()::text = (storage.foldername(name))[1]
);
-- We won't add hospital access to raw storage objects here; hospitals will get temporary signed URLs generated by the User via the backend if needed, 
-- or we can use RLS if we store the record_id in the object path, but standard practice is passing signed URLs.
