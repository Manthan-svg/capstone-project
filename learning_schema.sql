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
('11111111-1111-1111-1111-111111111111', 'ISL Basics: Greetings & Civilities', 'Learn the fundamental signs to introduce yourself and be polite.', 'Beginner'),
('22222222-2222-2222-2222-222222222222', 'Medical ISL for Patients', 'Essential signs to describe pain, symptoms, and emergencies to healthcare staff.', 'Intermediate'),
('33333333-3333-3333-3333-333333333333', 'Numbers and Time', 'Learn to sign numbers 1-100, days of the week, and telling time.', 'Beginner'),
('44444444-4444-4444-4444-444444444444', 'ISL for the Workplace', 'Essential vocabulary for office environments, meetings, and professional communication.', 'Intermediate'),
('55555555-5555-5555-5555-555555555555', 'Travel & Directions', 'Learn how to ask for directions, sign locations, and use transportation signs.', 'Beginner'),
('66666666-6666-6666-6666-666666666666', 'Expressing Emotions', 'How to correctly sign and express feelings, moods, and mental states.', 'Beginner'),
('77777777-7777-7777-7777-777777777777', 'Emergency & Safety', 'Advanced signs for emergency responders, reporting accidents, and critical care.', 'Advanced'),
('88888888-8888-8888-8888-888888888888', 'Food & Dining', 'Learn signs for everyday foods, ordering at restaurants, and cooking.', 'Beginner'),
('99999999-9999-9999-9999-999999999999', 'Family & Relationships', 'Vocabulary to describe family members, friends, and complex relationships.', 'Intermediate'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Tech & Digital World', 'Modern ISL signs for computers, the internet, smartphones, and software.', 'Advanced');

INSERT INTO public.lessons (course_id, title, content_text, video_url, order_index) VALUES
('11111111-1111-1111-1111-111111111111', 'Lesson 1: Hello & Goodbye', 'In this lesson, you will learn how to greet someone and say goodbye. To sign "Hello", start with your hand at your forehead and move it away in a small salute motion. To sign "Goodbye", simply wave your hand.', null, 1),
('11111111-1111-1111-1111-111111111111', 'Lesson 2: Please & Thank You', 'Politeness is key. To sign "Please", place a flat hand on your chest and rub it in a circular motion. To sign "Thank You", touch your fingers to your chin and move your hand forward toward the person.', null, 2),
('11111111-1111-1111-1111-111111111111', 'Lesson 3: Yes & No', 'To sign "Yes", make a fist and bob it up and down at the wrist, like a head nodding. To sign "No", extend your index and middle fingers and tap them against your thumb.', null, 3),
('11111111-1111-1111-1111-111111111111', 'Lesson 4: How are you?', 'To sign "How are you?", point to the person, then place both hands on your chest and move them outward, finishing with a thumbs-up gesture.', null, 4),
('22222222-2222-2222-2222-222222222222', 'Lesson 1: Describing Pain', 'When interacting with a doctor, it is critical to describe pain. To sign "Pain", point your index fingers at each other and jab them together in the area that hurts.', null, 1),
('22222222-2222-2222-2222-222222222222', 'Lesson 2: Requesting Help', 'In an emergency, you need to sign "Help". Place a closed fist (thumbs up) on the flat palm of your other hand, and raise them both together.', null, 2),
('22222222-2222-2222-2222-222222222222', 'Lesson 3: Where does it hurt?', 'To ask "Where does it hurt?", point your index finger and move it in a small circle, then raise your eyebrows to indicate a question.', null, 3),
('22222222-2222-2222-2222-222222222222', 'Lesson 4: I need a doctor', 'To sign "Doctor", tap the fingertips of your right hand against the inside of your left wrist. Combine this with the sign for "Need" by hooking your index finger and pulling it downward.', null, 4),
('33333333-3333-3333-3333-333333333333', 'Lesson 1: Numbers 1-5', 'Counting in ISL starts with the palm facing you. 1 is the index finger. 2 is index and middle. 3 is index, middle, and THUMB (not ring finger). 4 is all four fingers. 5 is all five fingers open.', null, 1),
('33333333-3333-3333-3333-333333333333', 'Lesson 2: Days of the Week', 'In ISL, days of the week are often signed by spelling the first letter. For example, "Monday" is signed by forming the letter M and moving it in a small circle.', null, 2),
('33333333-3333-3333-3333-333333333333', 'Lesson 3: Time of Day', 'To sign "Morning", place your left hand on your right bicep and raise your right arm up like the sun rising. To sign "Night", tap your right wrist over your left wrist with hands facing down.', null, 3),
('44444444-4444-4444-4444-444444444444', 'Lesson 1: Meeting & Interview', 'Learn how to introduce your role and welcome colleagues to a meeting.', null, 1),
('55555555-5555-5555-5555-555555555555', 'Lesson 1: Left, Right & Straight', 'Directional signs are often relative to the signer. Use your dominant hand to indicate turns.', null, 1),
('66666666-6666-6666-6666-666666666666', 'Lesson 1: Happy & Sad', 'Facial expressions are a mandatory grammatical part of ISL when signing emotions.', null, 1),
('77777777-7777-7777-7777-777777777777', 'Lesson 1: Calling the Police', 'Signs for immediate danger and communicating critical details to 911 dispatch equivalents.', null, 1),
('88888888-8888-8888-8888-888888888888', 'Lesson 1: Water & Bread', 'The basic staples of dining out. Sign "Water" by forming a W and tapping it to your chin.', null, 1),
('99999999-9999-9999-9999-999999999999', 'Lesson 1: Mother & Father', 'Learn the gender locations in sign language (typically forehead for male, chin for female).', null, 1),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Lesson 1: Internet & Email', 'Sign "Internet" by connecting the middle fingers of both hands and wiggling them back and forth.', null, 1);
