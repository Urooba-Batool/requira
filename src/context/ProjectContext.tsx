import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Project, ProjectStatus, Requirements, ChatMessage } from '@/types/requira';

interface ProjectContextType {
  projects: Project[];
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  updateProjectStatus: (id: string, status: ProjectStatus) => void;
  updateProjectRequirements: (id: string, requirements: Requirements, history: ChatMessage[]) => void;
  getProjectsByClient: (clientId: string) => Project[];
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

// Sample demo data
const initialProjects: Project[] = [
  {
    id: '1',
    clientName: 'Sarah Johnson',
    companyName: 'TechStart Inc.',
    clientId: 'demo-client-1',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    status: 'under review',
    projectTitle: 'E-Commerce Platform Redesign',
    projectDescription: 'Complete overhaul of existing e-commerce platform',
    requirements: {
      functional: 'User authentication, product catalog, shopping cart, checkout, order tracking',
      nonFunctional: 'Page load under 2 seconds, 99.9% uptime, mobile responsive',
      domain: 'Retail e-commerce with focus on fashion products',
      inverse: 'No cryptocurrency payments, no international shipping initially',
    },
    history: [
      { role: 'assistant', text: 'Hello! I\'m Requira, ready to help you define your software requirements. What is the main goal of your project?' },
      { role: 'user', text: 'We need to redesign our e-commerce platform to improve user experience and increase conversions.' },
    ],
  },
  {
    id: '2',
    clientName: 'Michael Chen',
    companyName: 'HealthFlow Systems',
    clientId: 'demo-client-2',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    status: 'in progress',
    projectTitle: 'Patient Management System',
    projectDescription: 'Healthcare management software',
    requirements: {
      functional: 'Patient records, appointment scheduling, billing integration, prescription management',
      nonFunctional: 'HIPAA compliant, encrypted data storage, audit logging',
      domain: 'Healthcare industry, outpatient clinic operations',
      inverse: 'No integration with legacy systems older than 5 years',
    },
    history: [],
  },
  {
    id: '3',
    clientName: 'Emily Davis',
    companyName: 'EduLearn Corp',
    clientId: 'demo-client-3',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    status: 'incomplete requirements',
    projectTitle: 'Learning Management System',
    projectDescription: 'Online education platform',
    requirements: {
      functional: 'Course creation, video hosting, quiz assessments',
    },
    history: [
      { role: 'assistant', text: 'Hello! I\'m Requira. Let\'s gather your requirements. What type of learners will use this platform?' },
    ],
  },
];

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
  const [projects, setProjects] = useState<Project[]>(initialProjects);

  const addProject = useCallback((projectData: Omit<Project, 'id' | 'createdAt'>): Project => {
    const newProject: Project = {
      ...projectData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
    setProjects(prev => [newProject, ...prev]);
    return newProject;
  }, []);

  const updateProject = useCallback((id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => 
      p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
    ));
  }, []);

  const updateProjectStatus = useCallback((id: string, status: ProjectStatus) => {
    setProjects(prev => prev.map(p => 
      p.id === id ? { ...p, status, updatedAt: new Date() } : p
    ));
  }, []);

  const updateProjectRequirements = useCallback((id: string, requirements: Requirements, history: ChatMessage[]) => {
    setProjects(prev => prev.map(p => 
      p.id === id ? { ...p, requirements, history, updatedAt: new Date() } : p
    ));
  }, []);

  const getProjectsByClient = useCallback((clientId: string) => {
    return projects.filter(p => p.clientId === clientId);
  }, [projects]);

  return (
    <ProjectContext.Provider value={{ 
      projects, 
      addProject, 
      updateProject, 
      updateProjectStatus,
      updateProjectRequirements,
      getProjectsByClient 
    }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
};
