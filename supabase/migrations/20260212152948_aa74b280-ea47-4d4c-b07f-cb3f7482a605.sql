
-- Drop the restrictive policy and recreate as permissive
DROP POLICY IF EXISTS "Admins can read all roles" ON public.user_roles;

CREATE POLICY "Admins can read all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR (auth.uid() = user_id));
