-- Add created_by column to patients table
ALTER TABLE public.patients 
ADD COLUMN created_by uuid REFERENCES auth.users(id);

-- Add username column to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN username text UNIQUE;

-- Create index for faster username lookups
CREATE INDEX idx_user_profiles_username ON public.user_profiles(username);

-- Drop existing RLS policies on patients
DROP POLICY IF EXISTS "Staff can view patients" ON public.patients;
DROP POLICY IF EXISTS "Staff can insert patients" ON public.patients;
DROP POLICY IF EXISTS "Staff can update patients" ON public.patients;
DROP POLICY IF EXISTS "Staff can delete patients" ON public.patients;

-- Create new RLS policies for patients

-- Admin and receptionist can view all patients
CREATE POLICY "Admin and receptionist can view all patients"
ON public.patients
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'receptionist')
);

-- Consultant can only view patients they created
CREATE POLICY "Consultant can view own patients"
ON public.patients
FOR SELECT
USING (
  public.has_role(auth.uid(), 'consultant') AND created_by = auth.uid()
);

-- Admin and receptionist can insert patients
CREATE POLICY "Admin and receptionist can insert patients"
ON public.patients
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'receptionist')
);

-- Consultant can insert patients (with their user_id as created_by)
CREATE POLICY "Consultant can insert patients"
ON public.patients
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'consultant') AND created_by = auth.uid()
);

-- Admin and receptionist can update all patients
CREATE POLICY "Admin and receptionist can update all patients"
ON public.patients
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'receptionist')
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'receptionist')
);

-- Consultant can only update patients they created
CREATE POLICY "Consultant can update own patients"
ON public.patients
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'consultant') AND created_by = auth.uid()
)
WITH CHECK (
  public.has_role(auth.uid(), 'consultant') AND created_by = auth.uid()
);

-- Admin and receptionist can delete patients
CREATE POLICY "Admin and receptionist can delete patients"
ON public.patients
FOR DELETE
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'receptionist')
);

-- Consultant can only delete patients they created
CREATE POLICY "Consultant can delete own patients"
ON public.patients
FOR DELETE
USING (
  public.has_role(auth.uid(), 'consultant') AND created_by = auth.uid()
);