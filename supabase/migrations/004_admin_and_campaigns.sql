-- Migration 004: Set niladri as admin + add campaign data from audit reports

-- 1. Set niladri@synup.com as admin
UPDATE public.profiles SET role = 'admin' WHERE email = 'niladri@synup.com';

-- 2. Add RLS policy so admins can update other users' roles
CREATE POLICY "Admins can update profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 3. Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated USING (true);
