-- Employment Schema Setup

-- 1. Modify Role to allow 'Employer'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('User', 'Admin', 'Doctor', 'Hospital', 'Employer'));

-- 2. Job Listings Table
CREATE TABLE IF NOT EXISTS public.job_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    type TEXT NOT NULL, -- 'Job' or 'Internship'
    location TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Job Applications Table
CREATE TABLE IF NOT EXISTS public.job_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES public.job_listings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'Pending', -- 'Pending', 'Reviewed', 'Accepted', 'Rejected'
    resume_path TEXT, -- path in Supabase Storage
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (job_id, user_id)
);

-- 4. Skill Badges Table
CREATE TABLE IF NOT EXISTS public.skill_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_name TEXT NOT NULL,
    awarded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Employer or Admin who awarded it
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, badge_name)
);

-- 5. Resumes Storage Bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', false) ON CONFLICT DO NOTHING;

-- ENABLE RLS
ALTER TABLE public.job_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_badges ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES FOR TABLES

-- Job Listings: Public read, Employers can insert/update their own
CREATE POLICY "Public read job listings" ON public.job_listings FOR SELECT USING (true);
CREATE POLICY "Employers insert own listings" ON public.job_listings FOR INSERT WITH CHECK (auth.uid() = employer_id);
CREATE POLICY "Employers update own listings" ON public.job_listings FOR UPDATE USING (auth.uid() = employer_id);

-- Job Applications: 
-- Users can insert and read their own applications
CREATE POLICY "Users read own applications" ON public.job_applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own applications" ON public.job_applications FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Employers can read applications for their jobs
CREATE POLICY "Employers read applications for their jobs" ON public.job_applications FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.job_listings WHERE id = public.job_applications.job_id AND employer_id = auth.uid())
);
-- Employers can update applications for their jobs (to change status)
CREATE POLICY "Employers update applications for their jobs" ON public.job_applications FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.job_listings WHERE id = public.job_applications.job_id AND employer_id = auth.uid())
);

-- Skill Badges: Public read, Employers can insert
CREATE POLICY "Public read skill badges" ON public.skill_badges FOR SELECT USING (true);
CREATE POLICY "Employers insert skill badges" ON public.skill_badges FOR INSERT WITH CHECK (auth.uid() = awarded_by);

-- RLS POLICIES FOR STORAGE BUCKET (Resumes)
CREATE POLICY "Users can upload their own resumes" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1] );
CREATE POLICY "Users can read their own resumes" ON storage.objects FOR SELECT USING ( bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1] );
CREATE POLICY "Users can update their own resumes" ON storage.objects FOR UPDATE USING ( bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1] );
CREATE POLICY "Employers can read applicant resumes" ON storage.objects FOR SELECT USING (
    bucket_id = 'resumes' AND
    EXISTS (
        SELECT 1 FROM public.job_applications ja
        JOIN public.job_listings jl ON ja.job_id = jl.id
        WHERE ja.resume_path = storage.objects.name AND jl.employer_id = auth.uid()
    )
);

-- SEED DATA (Assuming Admin/Employer will be created, we just use a dummy UUID for employer_id for now, or just leave it NULL if we don't care, but we need it to be a real user for the dashboard to work. 
-- Wait, we can't seed employer_id easily without knowing a user ID. I will insert without employer_id, but the schema requires it. Let's make employer_id nullable for the seed data to work, or use a specific known user?
-- No, I'll drop the NOT NULL constraint if it exists (it doesn't by default in my schema above). So employer_id can be NULL for seed data.
INSERT INTO public.job_listings (title, company, type, location, description) VALUES
('Accessibility QA Tester', 'TechCorp', 'Job', 'Remote', 'Test our web applications for accessibility compliance.'),
('Frontend Developer', 'SignBridge', 'Job', 'Remote', 'Join our team to build accessible React applications.'),
('Deaf Studies Researcher', 'University of ASL', 'Job', 'Washington, DC', 'Conduct research on deaf community trends.'),
('Data Entry Specialist', 'HealthData Inc', 'Job', 'Remote', 'Accurate data entry for medical records.'),
('Graphic Design Intern', 'Creative Agency', 'Internship', 'New York, NY', 'Help design marketing materials.'),
('Software Engineering Intern', 'TechCorp', 'Internship', 'Remote', 'Summer internship for computer science students.');
