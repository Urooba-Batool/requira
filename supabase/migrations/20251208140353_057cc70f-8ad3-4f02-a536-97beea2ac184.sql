-- Add suggested_names column to projects table to store AI-generated project name suggestions
ALTER TABLE public.projects 
ADD COLUMN suggested_names TEXT[] DEFAULT '{}';