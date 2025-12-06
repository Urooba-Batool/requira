export type ProjectStatus = 
  | "incomplete requirements"
  | "under review"
  | "in progress"
  | "need improvement in requirements"
  | "completed";

export interface Requirements {
  functional?: string;
  nonFunctional?: string;
  domain?: string;
  inverse?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

export interface Project {
  id: string;
  clientName: string;
  companyName: string;
  clientId: string;
  createdAt: Date;
  updatedAt?: Date;
  submittedAt?: Date;
  status: ProjectStatus;
  projectTitle: string;
  projectDescription: string;
  requirements: Requirements;
  history: ChatMessage[];
  adminId?: string;
}

export interface ClientMeta {
  name: string;
  company: string;
  email: string;
}

export type DashboardType = 'admin' | 'client' | null;
