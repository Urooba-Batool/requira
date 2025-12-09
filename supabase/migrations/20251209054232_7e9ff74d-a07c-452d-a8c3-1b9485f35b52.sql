-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Clients can update their own incomplete projects" ON public.projects;

-- Create a new policy that allows clients to update their own projects
-- when the current status is 'incomplete requirements' AND they're setting
-- the new status to either 'incomplete requirements', 'under review', or 'completed'
CREATE POLICY "Clients can update their own incomplete projects" 
ON public.projects 
FOR UPDATE 
USING (
  auth.uid() = client_id 
  AND status = 'incomplete requirements'::project_status
)
WITH CHECK (
  auth.uid() = client_id 
  AND status IN ('incomplete requirements'::project_status, 'under review'::project_status, 'completed'::project_status)
);