-- Community Module Schema Setup

-- 1. Profiles Update
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS interests TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS is_mentor BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS mentor_availability TEXT;

-- 2. Discussion Forums
CREATE TABLE IF NOT EXISTS public.forum_threads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.forum_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id UUID REFERENCES public.forum_threads(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Groups
CREATE TABLE IF NOT EXISTS public.community_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.group_members (
    group_id UUID REFERENCES public.community_groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (group_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.group_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES public.community_groups(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Private Messaging
CREATE TABLE IF NOT EXISTS public.private_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Video Calls (Signaling/State)
CREATE TABLE IF NOT EXISTS public.video_calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    caller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'ringing', -- ringing, accepted, declined, ended
    peer_id_caller TEXT,
    peer_id_receiver TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Events / Meetups
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    date_time TIMESTAMPTZ NOT NULL,
    organizer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.event_rsvps (
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    PRIMARY KEY (event_id, user_id)
);

-- 7. Mentor Matching
CREATE TABLE IF NOT EXISTS public.mentor_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mentor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    mentee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending', -- pending, accepted, rejected
    request_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Announcements
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENABLE RLS
ALTER TABLE public.forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES

-- Forums (Public read, author insert)
CREATE POLICY "Public read threads" ON public.forum_threads FOR SELECT USING (true);
CREATE POLICY "Users insert threads" ON public.forum_threads FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Public read replies" ON public.forum_replies FOR SELECT USING (true);
CREATE POLICY "Users insert replies" ON public.forum_replies FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Groups (Public read groups, anyone can join, members can post)
CREATE POLICY "Public read groups" ON public.community_groups FOR SELECT USING (true);
CREATE POLICY "Users insert groups" ON public.community_groups FOR INSERT WITH CHECK (true); -- Allow anyone to create a group for now

CREATE POLICY "Public read members" ON public.group_members FOR SELECT USING (true);
CREATE POLICY "Users insert members" ON public.group_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete members" ON public.group_members FOR DELETE USING (auth.uid() = user_id);

-- Group Posts (Only members can read/write)
CREATE POLICY "Members read posts" ON public.group_posts FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.group_members WHERE group_id = group_posts.group_id AND user_id = auth.uid())
);
CREATE POLICY "Members insert posts" ON public.group_posts FOR INSERT WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (SELECT 1 FROM public.group_members WHERE group_id = group_posts.group_id AND user_id = auth.uid())
);

-- Private Messages (Only sender and receiver)
CREATE POLICY "Participants read messages" ON public.private_messages FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
);
CREATE POLICY "Sender inserts messages" ON public.private_messages FOR INSERT WITH CHECK (
    auth.uid() = sender_id
);

-- Video Calls (Only participants)
CREATE POLICY "Participants read calls" ON public.video_calls FOR SELECT USING (
    auth.uid() = caller_id OR auth.uid() = receiver_id
);
CREATE POLICY "Caller inserts calls" ON public.video_calls FOR INSERT WITH CHECK (
    auth.uid() = caller_id
);
CREATE POLICY "Participants update calls" ON public.video_calls FOR UPDATE USING (
    auth.uid() = caller_id OR auth.uid() = receiver_id
);

-- Events (Public read, author insert, RSVP insert)
CREATE POLICY "Public read events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Users insert events" ON public.events FOR INSERT WITH CHECK (auth.uid() = organizer_id);
CREATE POLICY "Public read RSVPs" ON public.event_rsvps FOR SELECT USING (true);
CREATE POLICY "Users insert RSVPs" ON public.event_rsvps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete RSVPs" ON public.event_rsvps FOR DELETE USING (auth.uid() = user_id);

-- Mentor Requests (Only mentor and mentee)
CREATE POLICY "Participants read requests" ON public.mentor_requests FOR SELECT USING (
    auth.uid() = mentor_id OR auth.uid() = mentee_id
);
CREATE POLICY "Mentee inserts requests" ON public.mentor_requests FOR INSERT WITH CHECK (
    auth.uid() = mentee_id
);
CREATE POLICY "Mentor updates requests" ON public.mentor_requests FOR UPDATE USING (
    auth.uid() = mentor_id
);

-- Announcements (Public read, Admin insert)
CREATE POLICY "Public read announcements" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Admin insert announcements" ON public.announcements FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'Admin')
);

-- SEED DATA
INSERT INTO public.community_groups (name, description) VALUES
('Tech Careers', 'For Deaf professionals navigating the tech industry.'),
('Parents of Deaf Children', 'Support and resources for parents.'),
('ISL Learners', 'Practice signing with others.');

INSERT INTO public.announcements (title, content, author_id)
-- Using a fallback auth ID for seed, or we can leave author_id null temporarily for announcements, wait, it's NOT NULL? It's not explicitly NOT NULL, but it references auth.users.
-- Better to omit author_id for the seed or just skip seeding announcements.
-- I'll omit author_id.
VALUES
('Welcome to SignBridge Community!', 'We are excited to launch the community features. Please explore the groups and forums.', null);
