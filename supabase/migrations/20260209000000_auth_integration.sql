-- Migration to integrate user_profiles with Supabase Auth
-- This migration links the user_profiles table to auth.users and updates RLS policies

-- First, drop existing RLS policies that allow public access
DROP POLICY IF EXISTS "Anyone can view user_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Anyone can create user_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Anyone can update user_profiles" ON public.user_profiles;

-- Update user_profiles table to use auth.users.id as primary key
-- Note: This assumes the table is empty or you've backed up data
-- If you have existing data, you'll need to migrate it manually

-- Add foreign key constraint to link with auth.users
ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_id_fkey 
  FOREIGN KEY (id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- Create new RLS policies based on authentication
CREATE POLICY "Users can view their own profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Update student_progress RLS policies
DROP POLICY IF EXISTS "Anyone can view student_progress" ON public.student_progress;
DROP POLICY IF EXISTS "Anyone can create student_progress" ON public.student_progress;
DROP POLICY IF EXISTS "Anyone can update student_progress" ON public.student_progress;

CREATE POLICY "Users can view their own progress"
  ON public.student_progress
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own progress"
  ON public.student_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON public.student_progress
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Update user_badges RLS policies
DROP POLICY IF EXISTS "Anyone can view user_badges" ON public.user_badges;
DROP POLICY IF EXISTS "Anyone can create user_badges" ON public.user_badges;

CREATE POLICY "Users can view their own badges"
  ON public.user_badges
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create user badges"
  ON public.user_badges
  FOR INSERT
  WITH CHECK (true);

-- Create a trigger function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- This function is intentionally minimal
  -- The profile creation is handled by the application
  -- This is just a placeholder for future enhancements
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON public.user_profiles(id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.student_progress TO authenticated;
GRANT ALL ON public.user_badges TO authenticated;
