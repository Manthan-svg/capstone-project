-- Run this in your Supabase SQL Editor to fix the infinite recursion error for Medical Records

-- 1. Create a security definer function to check ownership without triggering RLS
CREATE OR REPLACE FUNCTION public.check_record_owner(check_record_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.medical_records
    WHERE id = check_record_id AND user_id = auth.uid()
  );
$$;

-- 2. Drop the old recursive policy on record_access
DROP POLICY IF EXISTS "Users manage record access" ON public.record_access;

-- 3. Create the new policy using the security definer function
CREATE POLICY "Users manage record access" ON public.record_access 
FOR ALL USING (
    public.check_record_owner(record_id)
);
