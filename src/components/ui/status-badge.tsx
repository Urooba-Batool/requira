import { cn } from '@/lib/utils';
import { ProjectStatus } from '@/types/requira';
import { AlertTriangle, Check, Clock, FileText, HelpCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: ProjectStatus;
  className?: string;
}

const statusConfig: Record<ProjectStatus, { 
  color: string; 
  text: string; 
  icon: React.ComponentType<{ className?: string }>;
}> = {
  "incomplete requirements": { 
    color: "bg-warning text-warning-foreground", 
    text: "Incomplete", 
    icon: AlertTriangle 
  },
  "under review": { 
    color: "bg-info text-info-foreground", 
    text: "Under Review", 
    icon: FileText 
  },
  "in progress": { 
    color: "bg-primary text-primary-foreground", 
    text: "In Progress", 
    icon: Clock 
  },
  "need improvement in requirements": { 
    color: "bg-destructive text-destructive-foreground", 
    text: "Needs Improvement", 
    icon: AlertTriangle 
  },
  "completed": { 
    color: "bg-success text-success-foreground", 
    text: "Completed", 
    icon: Check 
  },
};

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const config = statusConfig[status] || { 
    color: "bg-muted text-muted-foreground", 
    text: "Unknown", 
    icon: HelpCircle 
  };
  const Icon = config.icon;

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full shadow-sm",
      config.color,
      className
    )}>
      <Icon className="w-3 h-3" />
      {config.text}
    </span>
  );
};
