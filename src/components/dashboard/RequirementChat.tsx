import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Check, Loader2, Sparkles, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Project, ChatMessage, Requirements } from '@/types/requira';
import { useProjects } from '@/context/ProjectContext';

interface RequirementChatProps {
  project: Project;
  clientName: string;
}

// Simulated AI responses for demo
const AI_RESPONSES = [
  "Great! Now, who are the primary users of this system? Please describe their roles and what they'll need to accomplish.",
  "That's helpful! What are your main performance requirements? Consider load times, concurrent users, and response times.",
  "Understood. Are there any specific security or compliance requirements we need to consider? (e.g., GDPR, HIPAA, data encryption)",
  "Perfect! What integrations with external systems or services will be needed?",
  "Now let's discuss the constraints. Are there any technologies, approaches, or features that should be explicitly excluded?",
  "Excellent progress! Based on our discussion, I believe we have gathered comprehensive requirements. Would you like to review and submit them?",
];

export const RequirementChat = ({ project, clientName }: RequirementChatProps) => {
  const { updateProjectRequirements, updateProjectStatus } = useProjects();
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<ChatMessage[]>(project.history);
  const [isReadyToSubmit, setIsReadyToSubmit] = useState(false);
  const [requirements, setRequirements] = useState<Requirements>(project.requirements);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const isChatActive = project.status === 'incomplete requirements';

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  // Initialize chat with welcome message if empty
  useEffect(() => {
    if (history.length === 0) {
      const initialMessage: ChatMessage = {
        role: 'assistant',
        text: `Hello ${clientName}! I'm Requira, your AI requirements assistant. Let's gather the details for your project "${project.projectTitle}". What is the main goal or purpose of this project?`
      };
      setHistory([initialMessage]);
    }
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading || !isChatActive) return;

    const userMessage: ChatMessage = { role: 'user', text: message.trim() };
    const newHistory = [...history, userMessage];
    setHistory(newHistory);
    setMessage('');
    setIsLoading(true);

    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

    // Get next AI response
    const responseIndex = Math.min(
      Math.floor((newHistory.filter(m => m.role === 'user').length - 1)),
      AI_RESPONSES.length - 1
    );
    
    const assistantMessage: ChatMessage = {
      role: 'assistant',
      text: AI_RESPONSES[responseIndex]
    };

    const finalHistory = [...newHistory, assistantMessage];
    setHistory(finalHistory);

    // Update requirements based on conversation progress
    const userMessages = finalHistory.filter(m => m.role === 'user').map(m => m.text);
    const newRequirements: Requirements = {
      functional: userMessages[0] || '',
      nonFunctional: userMessages[1] || '',
      domain: userMessages[2] || '',
      inverse: userMessages[3] || '',
    };
    setRequirements(newRequirements);
    
    // Check if ready to submit (after 4+ user responses)
    if (userMessages.length >= 4) {
      setIsReadyToSubmit(true);
    }

    // Save to context
    updateProjectRequirements(project.id, newRequirements, finalHistory);
    setIsLoading(false);
  };

  const handleSubmit = () => {
    updateProjectStatus(project.id, 'under review');
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
        <form onSubmit={handleSend} className="p-4 border-t border-border bg-muted/30">
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
              Submit
            </Button>
          </div>
        </form>
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
