import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { jsPDF } from 'jspdf';
import { 
  Briefcase, 
  Clock, 
  Check, 
  AlertTriangle, 
  FileText,
  LogOut,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  Loader2,
  List,
  Lock,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { useProjects } from '@/context/ProjectContext';
import { Project, ProjectStatus } from '@/types/requira';

interface AdminDashboardProps {
  onLogout: () => void;
}

const ALL_STATUSES: ProjectStatus[] = [
  "incomplete requirements",
  "under review", 
  "in progress",
  "need improvement in requirements",
  "completed"
];

export const AdminDashboard = ({ onLogout }: AdminDashboardProps) => {
  const { projects, updateProjectStatus } = useProjects();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [critiqueResult, setCritiqueResult] = useState('');
  const [isCritiqueLoading, setIsCritiqueLoading] = useState(false);

  const stats = useMemo(() => [
    { name: "Total Projects", count: projects.length, icon: Briefcase, color: "text-info" },
    { name: "Under Review", count: projects.filter(p => p.status === 'under review').length, icon: FileText, color: "text-success" },
    { name: "In Progress", count: projects.filter(p => p.status === 'in progress').length, icon: Clock, color: "text-primary" },
    { name: "Completed", count: projects.filter(p => p.status === 'completed').length, icon: Check, color: "text-muted-foreground" },
    { name: "Incomplete", count: projects.filter(p => p.status === 'incomplete requirements').length, icon: AlertTriangle, color: "text-warning" },
  ], [projects]);

  const handleCritique = async () => {
    if (!selectedProject?.requirements) return;
    
    setIsCritiqueLoading(true);
    setCritiqueResult('');
    
    // Simulate AI critique
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const reqs = selectedProject.requirements;
    setCritiqueResult(`## Requirements Analysis for "${selectedProject.projectTitle}"

### Completeness Assessment
- **Functional Requirements**: ${reqs.functional ? '✅ Documented' : '⚠️ Missing'}
- **Non-Functional Requirements**: ${reqs.nonFunctional ? '✅ Documented' : '⚠️ Missing'}
- **Domain Requirements**: ${reqs.domain ? '✅ Documented' : '⚠️ Missing'}
- **Constraints/Inverse**: ${reqs.inverse ? '✅ Documented' : '⚠️ Missing'}

### Recommendations
1. Consider adding more specific acceptance criteria
2. Include performance benchmarks where applicable
3. Define integration points with external systems
4. Add user story format for functional requirements

### Risk Areas
- Ensure all stakeholders have reviewed requirements
- Validate non-functional requirements are measurable`);
    
    setIsCritiqueLoading(false);
  };

  const handleStatusChange = (projectId: string, newStatus: ProjectStatus) => {
    updateProjectStatus(projectId, newStatus);
    if (selectedProject?.id === projectId) {
      setSelectedProject(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  const requirementCategories = [
    { key: 'functional', title: 'Functional Requirements', icon: List },
    { key: 'nonFunctional', title: 'Non-Functional Requirements', icon: Lock },
    { key: 'domain', title: 'Domain Requirements', icon: Briefcase },
    { key: 'inverse', title: 'Constraints', icon: AlertTriangle },
  ];

  const exportToPDF = (project: Project) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;
    let yPos = 20;

    // Helper to add text with word wrap
    const addWrappedText = (text: string, y: number, fontSize: number = 11) => {
      doc.setFontSize(fontSize);
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, margin, y);
      return y + (lines.length * fontSize * 0.4) + 5;
    };

    // Header
    doc.setFillColor(79, 70, 229); // Primary color
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Requirements Document', margin, 25);

    // Project Info
    yPos = 55;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(project.projectTitle, margin, yPos);
    
    yPos += 10;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Client: ${project.clientName} | Company: ${project.companyName}`, margin, yPos);
    
    yPos += 6;
    doc.text(`Status: ${project.status.toUpperCase()}`, margin, yPos);
    
    yPos += 6;
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, yPos);

    // Divider
    yPos += 10;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 15;

    // Requirements sections
    const sections = [
      { title: 'Functional Requirements', content: project.requirements.functional },
      { title: 'Non-Functional Requirements', content: project.requirements.nonFunctional },
      { title: 'Domain Requirements', content: project.requirements.domain },
      { title: 'Constraints & Exclusions', content: project.requirements.inverse },
    ];

    doc.setTextColor(0, 0, 0);
    
    sections.forEach(section => {
      // Check if we need a new page
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      // Section title
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(79, 70, 229);
      doc.text(section.title, margin, yPos);
      yPos += 8;

      // Section content
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      const content = section.content || 'No requirements documented for this category.';
      yPos = addWrappedText(content, yPos);
      yPos += 10;
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Generated by Requira | Page ${i} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    // Save
    const fileName = `${project.projectTitle.replace(/[^a-z0-9]/gi, '_')}_requirements.pdf`;
    doc.save(fileName);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 gradient-primary rounded-lg">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              Admin Dashboard
            </h1>
          </div>
          <Button variant="outline" onClick={onLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {!selectedProject ? (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card border border-border rounded-xl p-4 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <stat.icon className={`w-8 h-8 ${stat.color}`} />
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.name}</p>
                      <p className="text-2xl font-display font-bold text-foreground">{stat.count}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Project List */}
            <div className="bg-card border border-border rounded-xl shadow-sm">
              <div className="p-6 border-b border-border">
                <h2 className="text-xl font-display font-semibold text-foreground">Project Submissions</h2>
              </div>
              <div className="divide-y divide-border">
                {projects.map((project, index) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => {
                      setSelectedProject(project);
                      setCritiqueResult('');
                    }}
                    className="p-4 hover:bg-muted/50 cursor-pointer transition-colors flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-foreground">{project.projectTitle}</p>
                      <p className="text-sm text-muted-foreground">
                        {project.companyName} • {project.clientName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Submitted: {project.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={project.status} />
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </motion.div>
                ))}
                {projects.length === 0 && (
                  <p className="p-8 text-center text-muted-foreground">No projects submitted yet.</p>
                )}
              </div>
            </div>
          </>
        ) : (
          /* Project Detail View */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <button
              onClick={() => setSelectedProject(null)}
              className="flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to List
            </button>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h1 className="text-3xl font-display font-bold text-foreground mb-2">
                {selectedProject.projectTitle}
              </h1>
              <p className="text-lg text-muted-foreground">
                {selectedProject.companyName} • {selectedProject.clientName}
              </p>

              {/* Status Controls */}
              <div className="mt-6">
                <p className="text-sm font-medium text-foreground mb-3">Update Status:</p>
                <div className="flex flex-wrap gap-2">
                  {ALL_STATUSES.map(status => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(selectedProject.id, status)}
                      className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
                        selectedProject.status === status
                          ? 'gradient-primary text-primary-foreground shadow-lg'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Export & AI Tools */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
              <h3 className="text-xl font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Document Tools
              </h3>
              <div className="flex flex-wrap gap-3">
                <Button 
                  onClick={() => exportToPDF(selectedProject)}
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
                <Button 
                  onClick={handleCritique}
                  disabled={isCritiqueLoading}
                  className="gradient-primary text-primary-foreground"
                >
                  {isCritiqueLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Analyze Requirements
                </Button>
              </div>
              {critiqueResult && (
                <div className="mt-4 p-4 bg-card border border-border rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm text-foreground font-sans">
                    {critiqueResult}
                  </pre>
                </div>
              )}
            </div>

            {/* Requirements */}
            <div className="grid md:grid-cols-2 gap-4">
              {requirementCategories.map(cat => (
                <div key={cat.key} className="bg-card border border-border rounded-xl p-4 shadow-sm">
                  <h4 className="flex items-center gap-2 font-semibold text-foreground mb-3">
                    <cat.icon className="w-4 h-4 text-primary" />
                    {cat.title}
                  </h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {selectedProject.requirements[cat.key as keyof typeof selectedProject.requirements] || (
                      <span className="italic">No requirements collected</span>
                    )}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};
