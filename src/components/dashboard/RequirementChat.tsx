import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Check, Loader2, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Project, ChatMessage, Requirements, ProjectStatus } from '@/types/requira';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RequirementChatProps {
  project: Project;
  clientName: string;
  onUpdateRequirements: (id: string, requirements: Requirements, history: ChatMessage[]) => Promise<void>;
  onUpdateStatus: (id: string, status: ProjectStatus) => Promise<void>;
}

export const RequirementChat = ({ project, clientName, onUpdateRequirements, onUpdateStatus }: RequirementChatProps) => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<ChatMessage[]>(project.history);
  const [isReadyToSubmit, setIsReadyToSubmit] = useState(false);
  const [requirements, setRequirements] = useState<Requirements>(project.requirements);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const isChatActive = project.status === 'incomplete requirements';

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  // Sync with project prop changes
  useEffect(() => {
    setHistory(project.history);
    setRequirements(project.requirements);
  }, [project.id, project.history, project.requirements]);

  // Initialize chat with welcome message if empty
  useEffect(() => {
    if (history.length === 0 && isChatActive) {
      initializeChat();
    }
  }, [project.id]);

  const initializeChat = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('requirement-chat', {
        body: {
          messages: [],
          projectTitle: project.projectTitle,
          clientName
        }
      });

      if (error) throw error;

      const initialMessage: ChatMessage = {
        role: 'assistant',
        text: data.response || `Hello ${clientName}! I'm Requira, your AI requirements assistant. Let's gather the details for your project "${project.projectTitle}". What is the main goal or purpose of this project?`
      };
      
      const newHistory = [initialMessage];
      setHistory(newHistory);
      await onUpdateRequirements(project.id, requirements, newHistory);
    } catch (error) {
      console.error('Error initializing chat:', error);
      // Fallback to default message
      const initialMessage: ChatMessage = {
        role: 'assistant',
        text: `Hello ${clientName}! I'm Requira, your AI requirements assistant. Let's gather the details for your project "${project.projectTitle}". What is the main goal or purpose of this project?`
      };
      const newHistory = [initialMessage];
      setHistory(newHistory);
      await onUpdateRequirements(project.id, requirements, newHistory);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading || !isChatActive) return;

    const userMessage: ChatMessage = { role: 'user', text: message.trim() };
    const newHistory = [...history, userMessage];
    setHistory(newHistory);
    setMessage('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('requirement-chat', {
        body: {
          messages: newHistory,
          projectTitle: project.projectTitle,
          clientName
        }
      });

      if (error) {
        throw error;
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        text: data.response
      };

      const finalHistory = [...newHistory, assistantMessage];
      setHistory(finalHistory);

      // Check if AI says requirements are complete
      if (data.isComplete) {
        setIsReadyToSubmit(true);
      }

      // Extract requirements from conversation (simple approach - can be enhanced)
      const userMessages = finalHistory.filter(m => m.role === 'user').map(m => m.text);
      const newRequirements: Requirements = {
        functional: userMessages.slice(0, 2).join('\n\n') || '',
        nonFunctional: userMessages.slice(2, 4).join('\n\n') || '',
        domain: userMessages.slice(4, 6).join('\n\n') || '',
        inverse: userMessages.slice(6).join('\n\n') || '',
      };
      setRequirements(newRequirements);

      // Also allow manual submit after 4+ responses
      if (userMessages.length >= 4) {
        setIsReadyToSubmit(true);
      }

      await onUpdateRequirements(project.id, newRequirements, finalHistory);
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Handle specific error cases
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
          description: "Failed to get AI response. Please try again.",
          variant: "destructive"
        });
      }

      // Remove the user message on error
      setHistory(history);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    await onUpdateStatus(project.id, 'completed');
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-xl border border-border shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-display font-bold text-foreground">{project.projectTitle}</h2>
            <p className="text-sm text-muted-foreground">Conversation with Requira AI</p>
          </div>
          {isChatActive && isReadyToSubmit && (
            <div className="flex items-center gap-2 text-success text-sm">
              <Check className="w-4 h-4" />
              Ready to submit
            </div>
          )}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {history.map((msg, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`p-2 rounded-full shrink-0 ${
                msg.role === 'user' 
                  ? 'gradient-secondary' 
                  : 'gradient-primary'
              }`}>
                {msg.role === 'user' ? (
                  <User className="w-4 h-4 text-primary-foreground" />
                ) : (
                  <Bot className="w-4 h-4 text-primary-foreground" />
                )}
              </div>
              <div className={`p-4 rounded-2xl ${
                msg.role === 'user'
                  ? 'bg-secondary text-secondary-foreground rounded-br-none'
                  : 'bg-muted text-foreground rounded-bl-none'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          </motion.div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-3">
              <div className="p-2 rounded-full gradient-primary">
                <Bot className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="bg-muted p-4 rounded-2xl rounded-bl-none flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Requira is thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      {isChatActive ? (
        <div className="border-t border-border bg-muted/30">
          {isReadyToSubmit && (
            <div className="px-4 pt-3 pb-2">
              <div className="bg-success/10 border border-success/30 rounded-lg p-3 text-center">
                <p className="text-sm text-success font-medium">
                  ✓ You've provided enough requirements. When you're done, click <strong>Submit Requirements</strong> below to complete your session.
                </p>
              </div>
            </div>
          )}
          <form onSubmit={handleSend} className="p-4 pt-2">
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your response..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading || !message.trim()}>
                <Send className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!isReadyToSubmit}
                className={isReadyToSubmit ? 'gradient-secondary text-secondary-foreground' : ''}
              >
                <Check className="w-4 h-4 mr-1" />
                Submit Requirements
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <div className="p-4 border-t border-border bg-muted/50 text-center">
          <p className="text-muted-foreground font-medium">
            This project is <span className="text-primary">{project.status}</span>
          </p>
        </div>
      )}
    </div>
  );
};