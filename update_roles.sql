-- Drop the constraint to allow all 6 roles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('Deaf User', 'Hearing User', 'Doctor', 'Hospital', 'Employer', 'Interpreter', 'User', 'Admin'));

-- Update the trigger to accept role and full_name from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'role', 'Deaf User'), 
    new.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
