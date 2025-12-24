-- Create user_roles table for role-based access control
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Only admins can manage roles (using existing has_role function)
CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Drop existing permissive public policies on patients
DROP POLICY IF EXISTS "Public can view patients" ON public.patients;
DROP POLICY IF EXISTS "Public can insert patients" ON public.patients;
DROP POLICY IF EXISTS "Public can update patients" ON public.patients;
DROP POLICY IF EXISTS "Public can delete patients" ON public.patients;

-- Create new secure policies for patients (staff only)
CREATE POLICY "Staff can view patients"
ON public.patients
FOR SELECT
TO authenticated
USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can insert patients"
ON public.patients
FOR INSERT
TO authenticated
WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update patients"
ON public.patients
FOR UPDATE
TO authenticated
USING (public.is_staff(auth.uid()))
WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can delete patients"
ON public.patients
FOR DELETE
TO authenticated
USING (public.is_staff(auth.uid()));

-- Drop existing permissive public policies on payments
DROP POLICY IF EXISTS "Public can view payments" ON public.payments;
DROP POLICY IF EXISTS "Public can insert payments" ON public.payments;
DROP POLICY IF EXISTS "Public can update payments" ON public.payments;
DROP POLICY IF EXISTS "Public can delete payments" ON public.payments;

-- Create new secure policies for payments (staff only)
CREATE POLICY "Staff can view payments"
ON public.payments
FOR SELECT
TO authenticated
USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can insert payments"
ON public.payments
FOR INSERT
TO authenticated
WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update payments"
ON public.payments
FOR UPDATE
TO authenticated
USING (public.is_staff(auth.uid()))
WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can delete payments"
ON public.payments
FOR DELETE
TO authenticated
USING (public.is_staff(auth.uid()));

-- Add RLS policies for user_profiles
CREATE POLICY "Users can view own profile"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
ON public.user_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Make storage buckets private and add RLS policies
UPDATE storage.buckets SET public = false WHERE id = 'patient-documents';
UPDATE storage.buckets SET public = false WHERE id = 'payment-receipts';

-- Drop existing storage policies if any
DROP POLICY IF EXISTS "Staff can upload patient documents" ON storage.objects;
DROP POLICY IF EXISTS "Staff can view patient documents" ON storage.objects;
DROP POLICY IF EXISTS "Staff can delete patient documents" ON storage.objects;
DROP POLICY IF EXISTS "Staff can upload payment receipts" ON storage.objects;
DROP POLICY IF EXISTS "Staff can view payment receipts" ON storage.objects;
DROP POLICY IF EXISTS "Staff can delete payment receipts" ON storage.objects;

-- Create storage policies for patient-documents bucket
CREATE POLICY "Staff can upload patient documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'patient-documents' AND public.is_staff(auth.uid()));

CREATE POLICY "Staff can view patient documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'patient-documents' AND public.is_staff(auth.uid()));

CREATE POLICY "Staff can delete patient documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'patient-documents' AND public.is_staff(auth.uid()));

-- Create storage policies for payment-receipts bucket
CREATE POLICY "Staff can upload payment receipts"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'payment-receipts' AND public.is_staff(auth.uid()));

CREATE POLICY "Staff can view payment receipts"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'payment-receipts' AND public.is_staff(auth.uid()));

CREATE POLICY "Staff can delete payment receipts"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'payment-receipts' AND public.is_staff(auth.uid()));

-- Create trigger for auto-creating user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email));
  RETURN NEW;
END;
$$;

-- Create trigger if not exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();