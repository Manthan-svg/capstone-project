-- Interpreter Requests Schema

CREATE TABLE IF NOT EXISTS public.interpreter_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    interpreter_id UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'pending', -- pending, accepted, completed
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.interpreter_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own interpreter requests" 
ON public.interpreter_requests 
FOR SELECT USING (auth.uid() = user_id OR auth.uid() = interpreter_id OR status = 'pending');

CREATE POLICY "Users insert own requests" 
ON public.interpreter_requests 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Interpreters can update requests" 
ON public.interpreter_requests 
FOR UPDATE USING (true);
