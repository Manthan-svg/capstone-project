-- Learning Hub Schema Setup

-- 1. Courses
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    level TEXT DEFAULT 'Beginner', -- Beginner, Intermediate, Advanced
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Lessons
CREATE TABLE IF NOT EXISTS public.lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content_text TEXT NOT NULL,
    video_url TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. User Progress
CREATE TABLE IF NOT EXISTS public.user_progress (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, lesson_id)
);

-- 4. Certificates
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, course_id)
);

-- ENABLE RLS
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES
CREATE POLICY "Public read courses" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Public read lessons" ON public.lessons FOR SELECT USING (true);

CREATE POLICY "Users read own progress" ON public.user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own progress" ON public.user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users read own certificates" ON public.certificates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own certificates" ON public.certificates FOR INSERT WITH CHECK (auth.uid() = user_id);


-- SEED DATA
INSERT INTO public.courses (id, title, description, level) VALUES
('11111111-1111-1111-1111-111111111111', 'ASL Basics: Greetings & Civilities', 'Learn the fundamental signs to introduce yourself and be polite.', 'Beginner'),
('22222222-2222-2222-2222-222222222222', 'Medical ASL for Patients', 'Essential signs to describe pain, symptoms, and emergencies to healthcare staff.', 'Intermediate'),
('33333333-3333-3333-3333-333333333333', 'Numbers and Time', 'Learn to sign numbers 1-100, days of the week, and telling time.', 'Beginner');

INSERT INTO public.lessons (course_id, title, content_text, video_url, order_index) VALUES
('11111111-1111-1111-1111-111111111111', 'Lesson 1: Hello & Goodbye', 'In this lesson, you will learn how to greet someone and say goodbye. To sign "Hello", start with your hand at your forehead and move it away in a small salute motion. To sign "Goodbye", simply wave your hand.', null, 1),
('11111111-1111-1111-1111-111111111111', 'Lesson 2: Please & Thank You', 'Politeness is key. To sign "Please", place a flat hand on your chest and rub it in a circular motion. To sign "Thank You", touch your fingers to your chin and move your hand forward toward the person.', null, 2),
('22222222-2222-2222-2222-222222222222', 'Lesson 1: Describing Pain', 'When interacting with a doctor, it is critical to describe pain. To sign "Pain", point your index fingers at each other and jab them together in the area that hurts.', null, 1),
('22222222-2222-2222-2222-222222222222', 'Lesson 2: Requesting Help', 'In an emergency, you need to sign "Help". Place a closed fist (thumbs up) on the flat palm of your other hand, and raise them both together.', null, 2),
('33333333-3333-3333-3333-333333333333', 'Lesson 1: Numbers 1-5', 'Counting in ASL starts with the palm facing you. 1 is the index finger. 2 is index and middle. 3 is index, middle, and THUMB (not ring finger). 4 is all four fingers. 5 is all five fingers open.', null, 1);
