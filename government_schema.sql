-- Government & Accessibility Schema Setup

-- 1. Schemes Table
CREATE TABLE IF NOT EXISTS public.schemes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    eligibility TEXT NOT NULL,
    how_to_apply TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. NGOs Table
CREATE TABLE IF NOT EXISTS public.ngos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    focus_area TEXT NOT NULL,
    location TEXT NOT NULL,
    contact_info TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Vault Documents Table
CREATE TABLE IF NOT EXISTS public.vault_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'Other', -- 'ID', 'Certificate', 'Medical', 'Other'
    file_path TEXT NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Vault Storage Bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('vault', 'vault', false) ON CONFLICT DO NOTHING;

-- ENABLE RLS
ALTER TABLE public.schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ngos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vault_documents ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES FOR TABLES
CREATE POLICY "Public read schemes" ON public.schemes FOR SELECT USING (true);
CREATE POLICY "Public read ngos" ON public.ngos FOR SELECT USING (true);

CREATE POLICY "Users insert own vault documents" ON public.vault_documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users read own vault documents" ON public.vault_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own vault documents" ON public.vault_documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own vault documents" ON public.vault_documents FOR DELETE USING (auth.uid() = user_id);

-- RLS POLICIES FOR STORAGE BUCKET (Vault)
CREATE POLICY "Users can upload their own vault files" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'vault' AND auth.uid()::text = (storage.foldername(name))[1] );
CREATE POLICY "Users can read their own vault files" ON storage.objects FOR SELECT USING ( bucket_id = 'vault' AND auth.uid()::text = (storage.foldername(name))[1] );
CREATE POLICY "Users can update their own vault files" ON storage.objects FOR UPDATE USING ( bucket_id = 'vault' AND auth.uid()::text = (storage.foldername(name))[1] );
CREATE POLICY "Users can delete their own vault files" ON storage.objects FOR DELETE USING ( bucket_id = 'vault' AND auth.uid()::text = (storage.foldername(name))[1] );

-- SEED DATA
INSERT INTO public.schemes (name, description, eligibility, how_to_apply) VALUES
('Disability Pension', 'A monthly financial assistance program for persons with severe disabilities.', 'Must have a certified disability of 80% or more and be above 18 years old.', 'Apply online at the national disability portal with your UDID card.'),
('ADIP Scheme', 'Assistance to Disabled Persons for Purchase/Fitting of Aids and Appliances.', 'Income must not exceed $2000/month. Must have 40% disability certificate.', 'Submit application to designated implementation agencies or local district office.'),
('Scholarships for Students with Disabilities', 'Financial support to pursue higher education.', 'Must be enrolled in a recognized institution and hold a 40%+ disability certificate.', 'Apply via the National Scholarship Portal before October 31st each year.'),
('Accessible India Campaign Grants', 'Funding for making workplaces and public buildings accessible.', 'Registered businesses and government buildings.', 'Proposals must be submitted to the Ministry of Social Justice.'),
('Railway Concession Certificate', 'Subsidized travel on national railways.', 'Valid for completely deaf persons.', 'Obtain a concession certificate from a government doctor and present it at booking.'),
('Income Tax Deduction (Section 80U)', 'Tax relief for individuals with disabilities.', 'Taxpayers certified with a disability by a medical authority.', 'Claim during annual ITR filing using form 10-IA.'),
('National Fund for Persons with Disabilities', 'Grants for entrepreneurship and self-employment.', 'Disabled individuals looking to start a business.', 'Submit business plan to the National Handicapped Finance and Development Corp.');

INSERT INTO public.ngos (name, description, focus_area, location, contact_info) VALUES
('Deaf Connect', 'Providing sign language interpreters and legal advocacy.', 'Advocacy & Interpretation', 'New York, NY', 'contact@deafconnect.org | 555-0101 (Text)'),
('Silent Voices', 'Early intervention programs for deaf children and family support.', 'Education & Family', 'Austin, TX', 'info@silentvoices.org | 555-0202'),
('AccessAbility Tech', 'Donates accessibility devices and refurbished hearing aids.', 'Assistive Technology', 'Remote / National', 'tech@accessability.org'),
('SignBridge Foundation', 'Our own foundation supporting ASL literacy and tech education.', 'Education & Technology', 'San Francisco, CA', 'foundation@signbridge.ai'),
('Deaf Employment Network', 'Job placement services, resume building, and interview prep in ASL.', 'Employment', 'Chicago, IL', 'jobs@den.org | 555-0303 (Video Relay)'),
('Hear Me Out', 'Mental health counseling provided by deaf therapists.', 'Healthcare', 'Online', 'counseling@hearmeout.org');
