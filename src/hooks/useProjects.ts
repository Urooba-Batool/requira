import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Project, ProjectStatus, Requirements, ChatMessage } from '@/types/requira';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

interface DbProject {
  id: string;
  client_id: string;
  admin_id: string | null;
  project_title: string;
  project_description: string | null;
  status: string;
  requirements: Json;
  history: Json;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  suggested_names: string[] | null;
}

interface DbProfile {
  name: string;
  company: string | null;
}

const mapDbToProject = (dbProject: DbProject, profile?: DbProfile): Project => ({
  id: dbProject.id,
  clientName: profile?.name || 'Unknown',
  companyName: profile?.company || 'Unknown',
  clientId: dbProject.client_id,
  createdAt: new Date(dbProject.created_at),
  updatedAt: dbProject.updated_at ? new Date(dbProject.updated_at) : undefined,
  submittedAt: dbProject.submitted_at ? new Date(dbProject.submitted_at) : undefined,
  status: dbProject.status as ProjectStatus,
  projectTitle: dbProject.project_title,
  projectDescription: dbProject.project_description || '',
  requirements: (dbProject.requirements || {}) as unknown as Requirements,
  history: (Array.isArray(dbProject.history) ? dbProject.history : []) as unknown as ChatMessage[],
  adminId: dbProject.admin_id || undefined,
  suggestedNames: dbProject.suggested_names || undefined,
});

export const useProjects = () => {
  const { userId, isAdmin } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch projects from database
  const fetchProjects = useCallback(async () => {
    if (!userId) {
      setProjects([]);
      setIsLoading(false);
      return;
    }

    try {
      // First fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      if (!projectsData || projectsData.length === 0) {
        setProjects([]);
        setIsLoading(false);
        return;
      }

      // Get unique client IDs
      const clientIds = [...new Set(projectsData.map(p => p.client_id))];
      
      // Fetch profiles for all clients
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, name, company')
        .in('user_id', clientIds);

      if (profilesError) throw profilesError;

      // Create a map of profiles by user_id
      const profilesMap = new Map(
        profilesData?.map(p => [p.user_id, { name: p.name, company: p.company }]) || []
      );

      // Map projects with their profiles
      const mappedProjects = projectsData.map(p => 
        mapDbToProject(p as DbProject, profilesMap.get(p.client_id))
      );
      
      setProjects(mappedProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const addProject = useCallback(async (
    projectData: Omit<Project, 'id' | 'createdAt'>
  ): Promise<Project | null> => {
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          client_id: userId,
          project_title: projectData.projectTitle,
          project_description: projectData.projectDescription,
          status: projectData.status,
          requirements: projectData.requirements as Json,
          history: projectData.history as unknown as Json,
        })
        .select()
        .single();

      if (error) throw error;

      const newProject = mapDbToProject(data as DbProject, {
        name: projectData.clientName,
        company: projectData.companyName,
      });
      
      setProjects(prev => [newProject, ...prev]);
      return newProject;
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
      return null;
    }
  }, [userId]);

  const updateProject = useCallback(async (id: string, updates: Partial<Project>) => {
    try {
      const dbUpdates: Record<string, unknown> = {};
      
      if (updates.projectTitle) dbUpdates.project_title = updates.projectTitle;
      if (updates.projectDescription) dbUpdates.project_description = updates.projectDescription;
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.requirements) dbUpdates.requirements = updates.requirements;
      if (updates.history) dbUpdates.history = updates.history;
      if (updates.submittedAt) dbUpdates.submitted_at = updates.submittedAt.toISOString();
      if (updates.adminId) dbUpdates.admin_id = updates.adminId;
      if (updates.suggestedNames) dbUpdates.suggested_names = updates.suggestedNames;

      const { error } = await supabase
        .from('projects')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;

      setProjects(prev => prev.map(p => 
        p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
      ));
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Failed to update project');
    }
  }, []);

  const updateProjectStatus = useCallback(async (id: string, status: ProjectStatus) => {
    await updateProject(id, { status });
  }, [updateProject]);

  const updateProjectRequirements = useCallback(async (
    id: string, 
    requirements: Requirements, 
    history: ChatMessage[]
  ) => {
    await updateProject(id, { requirements, history });
  }, [updateProject]);

  const getProjectsByClient = useCallback((clientId: string) => {
    return projects.filter(p => p.clientId === clientId);
  }, [projects]);

  return {
    projects,
    isLoading,
    addProject,
    updateProject,
    updateProjectStatus,
    updateProjectRequirements,
    getProjectsByClient,
    refetch: fetchProjects,
  };
};
