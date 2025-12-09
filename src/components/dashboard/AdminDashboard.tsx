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
import { useProjects } from '@/hooks/useProjects';
import { Project, ProjectStatus } from '@/types/requira';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CritiqueDisplay } from './CritiqueDisplay';

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
  const [isExportLoading, setIsExportLoading] = useState(false);
  const { toast } = useToast();

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
    
    try {
      const { data, error } = await supabase.functions.invoke('requirement-critique', {
        body: {
          projectTitle: selectedProject.projectTitle,
          requirements: selectedProject.requirements
        }
      });

      if (error) {
        throw error;
      }

      setCritiqueResult(data.critique);
    } catch (error: any) {
      console.error('Error generating critique:', error);
      
      if (error.message?.includes('429') || error.status === 429) {
        toast({
          title: "Rate Limited",
          description: "Too many requests. Please wait a moment and try again.",
          variant: "destructive"
        });
      } else if (error.message?.includes('402') || error.status === 402) {
        toast({
          title: "Credits Exhausted",
          description: "AI credits have been exhausted. Please add more credits.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to analyze requirements. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setIsCritiqueLoading(false);
    }
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

  interface SRSData {
    introduction: {
      purpose: string;
      scope: string;
    };
    overallDescription: {
      productPerspective: string;
      userCharacteristics: string;
    };
    systemFeatures: Array<{
      title: string;
      description: string;
      inputs: string;
      outputs: string;
      behavior: string;
    }>;
    nonFunctionalRequirements: {
      performance: string[];
      security: string[];
      usability: string[];
      reliability: string[];
      other: string[];
    };
    externalInterfaces: {
      userInterface: string;
      hardware: string;
      software: string;
      communication: string;
    };
    constraints: string[];
  }

  const generatePDFFromSRS = (project: Project, srsData: SRSData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;
    let yPos = 20;

    const addWrappedText = (text: string, y: number, fontSize: number = 11): number => {
      doc.setFontSize(fontSize);
      const lines = doc.splitTextToSize(text, maxWidth);
      const lineHeight = fontSize * 0.5;
      
      lines.forEach((line: string) => {
        if (y > pageHeight - 30) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, margin, y);
        y += lineHeight;
      });
      
      return y + 5;
    };

    const checkPageBreak = (requiredSpace: number): number => {
      if (yPos + requiredSpace > pageHeight - 30) {
        doc.addPage();
        return 20;
      }
      return yPos;
    };

    const addSectionHeader = (number: string, title: string, isSubsection: boolean = false): number => {
      yPos = checkPageBreak(15);
      const fontSize = isSubsection ? 12 : 14;
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(79, 70, 229);
      doc.text(`${number} ${title}`, margin, yPos);
      return yPos + (isSubsection ? 8 : 10);
    };

    const addBulletList = (items: string[]): number => {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      items.forEach(item => {
        if (item && item.trim()) {
          yPos = addWrappedText(`• ${item}`, yPos);
        }
      });
      return yPos;
    };

    // ===== TITLE PAGE =====
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('Software Requirements', pageWidth / 2, pageHeight / 2 - 30, { align: 'center' });
    doc.text('Specification (SRS)', pageWidth / 2, pageHeight / 2 - 10, { align: 'center' });
    
    doc.setFontSize(18);
    doc.setFont('helvetica', 'normal');
    doc.text(project.projectTitle, pageWidth / 2, pageHeight / 2 + 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Client: ${project.clientName}`, pageWidth / 2, pageHeight / 2 + 45, { align: 'center' });
    doc.text(`Company: ${project.companyName}`, pageWidth / 2, pageHeight / 2 + 57, { align: 'center' });
    doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth / 2, pageHeight / 2 + 69, { align: 'center' });
    doc.text(`Version: 1.0`, pageWidth / 2, pageHeight / 2 + 81, { align: 'center' });

    // ===== SECTION 1: INTRODUCTION =====
    doc.addPage();
    yPos = 20;
    
    yPos = addSectionHeader('1.', 'Introduction');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    yPos = addWrappedText(
      'This Software Requirements Specification (SRS) provides a detailed description of the system, its purpose, scope, and the features it will include.',
      yPos
    );
    yPos += 5;

    yPos = addSectionHeader('1.1', 'Purpose', true);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    yPos = addWrappedText(srsData.introduction.purpose, yPos);
    yPos += 5;

    yPos = addSectionHeader('1.2', 'Scope', true);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    yPos = addWrappedText(srsData.introduction.scope, yPos);
    yPos += 10;

    // ===== SECTION 2: OVERALL DESCRIPTION =====
    yPos = checkPageBreak(40);
    yPos = addSectionHeader('2.', 'Overall Description');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    yPos = addWrappedText(
      'This section describes the product\'s perspective, major functions, users, and general constraints.',
      yPos
    );
    yPos += 5;

    yPos = addSectionHeader('2.1', 'Product Perspective', true);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    yPos = addWrappedText(srsData.overallDescription.productPerspective, yPos);
    yPos += 5;

    yPos = addSectionHeader('2.2', 'User Characteristics', true);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    yPos = addWrappedText(srsData.overallDescription.userCharacteristics, yPos);
    yPos += 10;

    // ===== SECTION 3: SYSTEM FEATURES =====
    yPos = checkPageBreak(40);
    yPos = addSectionHeader('3.', 'System Features');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    yPos = addWrappedText(
      'This section outlines the key functional features of the system.',
      yPos
    );
    yPos += 5;

    srsData.systemFeatures.forEach((feature, index) => {
      yPos = checkPageBreak(30);
      yPos = addSectionHeader(`3.${index + 1}`, feature.title, true);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      yPos = addWrappedText(feature.description, yPos);
      
      if (feature.inputs && feature.inputs !== 'Not specified' && feature.inputs !== 'To be determined') {
        yPos = addWrappedText(`Inputs: ${feature.inputs}`, yPos);
      }
      if (feature.outputs && feature.outputs !== 'Not specified' && feature.outputs !== 'To be determined') {
        yPos = addWrappedText(`Outputs: ${feature.outputs}`, yPos);
      }
      if (feature.behavior && feature.behavior !== 'Not specified' && feature.behavior !== 'To be determined') {
        yPos = addWrappedText(`Behavior: ${feature.behavior}`, yPos);
      }
      yPos += 5;
    });
    yPos += 5;

    // ===== SECTION 4: NON-FUNCTIONAL REQUIREMENTS =====
    yPos = checkPageBreak(40);
    yPos = addSectionHeader('4.', 'Non-Functional Requirements');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    yPos = addWrappedText(
      'Requirements regarding performance, security, usability, reliability, and other quality attributes.',
      yPos
    );
    yPos += 5;

    let nfIndex = 1;
    
    if (srsData.nonFunctionalRequirements.performance?.length > 0) {
      yPos = addSectionHeader(`4.${nfIndex}`, 'Performance Requirements', true);
      yPos = addBulletList(srsData.nonFunctionalRequirements.performance);
      yPos += 3;
      nfIndex++;
    }

    if (srsData.nonFunctionalRequirements.security?.length > 0) {
      yPos = addSectionHeader(`4.${nfIndex}`, 'Security Requirements', true);
      yPos = addBulletList(srsData.nonFunctionalRequirements.security);
      yPos += 3;
      nfIndex++;
    }

    if (srsData.nonFunctionalRequirements.usability?.length > 0) {
      yPos = addSectionHeader(`4.${nfIndex}`, 'Usability Requirements', true);
      yPos = addBulletList(srsData.nonFunctionalRequirements.usability);
      yPos += 3;
      nfIndex++;
    }

    if (srsData.nonFunctionalRequirements.reliability?.length > 0) {
      yPos = addSectionHeader(`4.${nfIndex}`, 'Reliability Requirements', true);
      yPos = addBulletList(srsData.nonFunctionalRequirements.reliability);
      yPos += 3;
      nfIndex++;
    }

    if (srsData.nonFunctionalRequirements.other?.length > 0) {
      yPos = addSectionHeader(`4.${nfIndex}`, 'Other Requirements', true);
      yPos = addBulletList(srsData.nonFunctionalRequirements.other);
      yPos += 3;
    }
    yPos += 5;

    // ===== SECTION 5: EXTERNAL INTERFACE REQUIREMENTS =====
    yPos = checkPageBreak(40);
    yPos = addSectionHeader('5.', 'External Interface Requirements');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    yPos = addWrappedText(
      'Details about user interface, hardware, software, and communication interfaces.',
      yPos
    );
    yPos += 5;

    yPos = addSectionHeader('5.1', 'User Interface', true);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    yPos = addWrappedText(srsData.externalInterfaces.userInterface, yPos);
    yPos += 3;

    if (srsData.externalInterfaces.hardware && srsData.externalInterfaces.hardware !== 'To be determined') {
      yPos = addSectionHeader('5.2', 'Hardware Interfaces', true);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      yPos = addWrappedText(srsData.externalInterfaces.hardware, yPos);
      yPos += 3;
    }

    if (srsData.externalInterfaces.software && srsData.externalInterfaces.software !== 'To be determined') {
      yPos = addSectionHeader('5.3', 'Software Interfaces', true);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      yPos = addWrappedText(srsData.externalInterfaces.software, yPos);
      yPos += 3;
    }

    if (srsData.externalInterfaces.communication && srsData.externalInterfaces.communication !== 'To be determined') {
      yPos = addSectionHeader('5.4', 'Communication Interfaces', true);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      yPos = addWrappedText(srsData.externalInterfaces.communication, yPos);
      yPos += 3;
    }
    yPos += 5;

    // ===== SECTION 6: CONSTRAINTS =====
    yPos = checkPageBreak(40);
    yPos = addSectionHeader('6.', 'Constraints & Other Requirements');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    yPos = addWrappedText(
      'This section documents any additional constraints, exclusions, or specifications.',
      yPos
    );
    yPos += 5;

    if (srsData.constraints?.length > 0) {
      yPos = addBulletList(srsData.constraints);
    } else {
      yPos = addWrappedText('No specific constraints documented.', yPos);
    }

    // ===== FOOTER ON ALL PAGES =====
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      
      if (i === 1) {
        doc.text('Generated by Requira', pageWidth / 2, pageHeight - 15, { align: 'center' });
      } else {
        doc.text(
          `Software Requirements Specification - ${project.projectTitle} | Page ${i - 1} of ${pageCount - 1}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }
    }

    const fileName = `SRS_${project.projectTitle.replace(/[^a-z0-9]/gi, '_')}.pdf`;
    doc.save(fileName);
  };

  const handleExportPDF = async (project: Project) => {
    setIsExportLoading(true);
    
    try {
      toast({
        title: "Generating SRS Document",
        description: "AI is organizing your requirements into the SRS format...",
      });

      const { data, error } = await supabase.functions.invoke('format-srs', {
        body: {
          projectTitle: project.projectTitle,
          projectDescription: project.projectDescription,
          requirements: project.requirements,
          clientName: project.clientName,
          companyName: project.companyName
        }
      });

      if (error) {
        throw error;
      }

      if (data.srsData) {
        generatePDFFromSRS(project, data.srsData);
        toast({
          title: "Success",
          description: "SRS document has been generated and downloaded.",
        });
      } else {
        throw new Error('No SRS data returned');
      }
    } catch (error: any) {
      console.error('Error exporting PDF:', error);
      
      if (error.message?.includes('429') || error.status === 429) {
        toast({
          title: "Rate Limited",
          description: "Too many requests. Please wait a moment and try again.",
          variant: "destructive"
        });
      } else if (error.message?.includes('402') || error.status === 402) {
        toast({
          title: "Credits Exhausted",
          description: "AI credits have been exhausted. Please add more credits.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to generate SRS document. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setIsExportLoading(false);
    }
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
                  onClick={() => handleExportPDF(selectedProject)}
                  disabled={isExportLoading}
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  {isExportLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  {isExportLoading ? 'Generating...' : 'Export SRS PDF'}
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
                <div className="mt-4 p-5 bg-card border border-border rounded-lg">
                  <CritiqueDisplay critique={critiqueResult} />
                </div>
              )}
            </div>

            {/* Suggested Names (if any) */}
            {selectedProject.suggestedNames && selectedProject.suggestedNames.length > 0 && (
              <div className="bg-secondary/10 border border-secondary/20 rounded-xl p-4">
                <h4 className="flex items-center gap-2 font-semibold text-foreground mb-3">
                  <Sparkles className="w-4 h-4 text-secondary" />
                  AI-Suggested Project Names
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedProject.suggestedNames.map((name, idx) => (
                    <span
                      key={idx}
                      className={`px-3 py-1.5 text-sm rounded-full ${
                        name === selectedProject.projectTitle
                          ? 'gradient-secondary text-secondary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {name}
                      {name === selectedProject.projectTitle && (
                        <Check className="w-3 h-3 ml-1 inline" />
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}

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
