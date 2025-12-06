import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  LogOut, 
  Briefcase,
  Check,
  Clock,
  AlertTriangle,
  Sparkles,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RequirementChat } from './RequirementChat';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/context/AuthContext';
import { ClientMeta, ProjectStatus } from '@/types/requira';

interface ClientDashboardProps {
  clientMeta: ClientMeta;
  onLogout: () => void;
}

const getStatusInfo = (status: ProjectStatus) => {
  switch (status) {
    case "incomplete requirements":
      return { text: "Incomplete", icon: AlertTriangle, color: "text-warning" };
    case "under review":
      return { text: "Under Review", icon: Clock, color: "text-info" };
    case "in progress":
      return { text: "In Progress", icon: Clock, color: "text-primary" };
    case "need improvement in requirements":
      return { text: "Needs Improvement", icon: AlertTriangle, color: "text-destructive" };
    case "completed":
      return { text: "Completed", icon: Check, color: "text-success" };
    default:
      return { text: "Unknown", icon: Briefcase, color: "text-muted-foreground" };
  }
};

export const ClientDashboard = ({ clientMeta, onLogout }: ClientDashboardProps) => {
  const { projects, isLoading, addProject, updateProjectRequirements, updateProjectStatus } = useProjects();
  const { userId } = useAuth();
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Filter projects for this client
  const clientProjects = useMemo(() => 
    projects
      .filter(p => p.clientId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    [projects, userId]
  );

  // Set first project as active on load
  useEffect(() => {
    if (clientProjects.length > 0 && !activeProjectId) {
      setActiveProjectId(clientProjects[0].id);
    }
  }, [clientProjects, activeProjectId]);

  const activeProject = clientProjects.find(p => p.id === activeProjectId);

  const handleNewProject = async () => {
    setIsCreating(true);
    const newProject = await addProject({
      clientName: clientMeta.name,
      companyName: clientMeta.company,
      clientId: userId!,
      status: "incomplete requirements",
      projectTitle: "New Project Request",
      projectDescription: "",
      requirements: {},
      history: [],
    });
    if (newProject) {
      setActiveProjectId(newProject.id);
    }
    setIsCreating(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <div className="w-80 bg-card border-r border-border flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 gradient-secondary rounded-lg">
              <Sparkles className="w-5 h-5 text-secondary-foreground" />
            </div>
            <div>
              <h2 className="font-display font-bold text-foreground">Requira</h2>
              <p className="text-xs text-muted-foreground">Client Portal</p>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{clientMeta.name}</p>
            <p>{clientMeta.company}</p>
          </div>
        </div>

        {/* New Project Button */}
        <div className="p-4">
          <Button 
            onClick={handleNewProject} 
            className="w-full gradient-secondary text-secondary-foreground"
            disabled={isCreating}
          >
            {isCreating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            New Project Request
          </Button>
        </div>

        {/* Project List */}
        <div className="flex-1 overflow-y-auto px-4 space-y-2">
          {clientProjects.map((project) => {
            const statusInfo = getStatusInfo(project.status);
            return (
              <motion.button
                key={project.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => setActiveProjectId(project.id)}
                className={`w-full p-3 rounded-lg text-left transition-all ${
                  activeProjectId === project.id
                    ? 'bg-primary/10 border-2 border-primary shadow-sm'
                    : 'bg-muted/50 border-2 border-transparent hover:bg-muted'
                }`}
              >
                <p className="font-medium text-foreground text-sm truncate">
                  {project.projectTitle}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <statusInfo.icon className={`w-3 h-3 ${statusInfo.color}`} />
                  <span className={`text-xs ${statusInfo.color}`}>{statusInfo.text}</span>
                </div>
              </motion.button>
            );
          })}

          {clientProjects.length === 0 && (
            <div className="text-center py-8">
              <Briefcase className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No projects yet</p>
              <p className="text-xs text-muted-foreground">Click above to start</p>
            </div>
          )}
        </div>

        {/* Logout */}
        <div className="p-4 border-t border-border">
          <Button variant="outline" onClick={onLogout} className="w-full">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        {activeProject ? (
          <RequirementChat 
            project={activeProject} 
            clientName={clientMeta.name}
            onUpdateRequirements={updateProjectRequirements}
            onUpdateStatus={updateProjectStatus}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="p-4 gradient-primary rounded-2xl mb-6">
              <Sparkles className="w-12 h-12 text-primary-foreground" />
            </div>
            <h3 className="text-2xl font-display font-bold text-foreground mb-2">
              Welcome to Requira, {clientMeta.name}!
            </h3>
            <p className="text-muted-foreground text-center max-w-md">
              Start a new project request to begin gathering your software requirements with our AI assistant.
            </p>
            <Button 
              onClick={handleNewProject} 
              className="mt-6 gradient-secondary text-secondary-foreground"
              disabled={isCreating}
            >
              {isCreating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Start New Request
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
