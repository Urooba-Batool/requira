import { useState } from 'react';
import { ArrowLeft, Briefcase, Loader2, Mail, User, Building, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ClientMeta } from '@/types/requira';
import { toast } from 'sonner';

interface ClientAuthProps {
  onSuccess: (meta: ClientMeta) => void;
  onBack: () => void;
}

export const ClientAuth = ({ onSuccess, onBack }: ClientAuthProps) => {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      toast.error('Please enter email and password');
      return;
    }

    if (isSignup && (!name.trim() || !company.trim())) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsProcessing(true);

    // Simulate auth delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Demo mode: accept any credentials
    const meta: ClientMeta = {
      name: name.trim() || email.split('@')[0],
      company: company.trim() || 'Demo Company',
      email: email.trim(),
    };

    toast.success(isSignup ? 'Account created successfully!' : 'Welcome back!');
    onSuccess(meta);
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/3 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-card border border-border rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-center mb-6">
            <div className="p-4 gradient-secondary rounded-xl">
              <Briefcase className="w-8 h-8 text-secondary-foreground" />
            </div>
          </div>

          <h2 className="text-2xl font-display font-bold text-center text-foreground mb-2">
            Client Portal
          </h2>
          <p className="text-center text-muted-foreground mb-6">
            {isSignup ? 'Create your account to get started' : 'Sign in to manage your projects'}
          </p>

          {/* Tab Switch */}
          <div className="flex bg-muted p-1 rounded-xl mb-6">
            <button
              onClick={() => setIsSignup(false)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                !isSignup ? 'bg-card shadow text-foreground' : 'text-muted-foreground'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsSignup(true)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                isSignup ? 'bg-card shadow text-foreground' : 'text-muted-foreground'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Your Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="pl-10"
                      disabled={isProcessing}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Company Name</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="company"
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Acme Corp"
                      className="pl-10"
                      disabled={isProcessing}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="pl-10"
                  disabled={isProcessing}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientPassword">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="clientPassword"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isSignup ? 'Create password' : 'Enter password'}
                  className="pl-10"
                  disabled={isProcessing}
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full gradient-secondary text-secondary-foreground"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <User className="w-4 h-4 mr-2" />
              )}
              {isSignup ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          <button
            onClick={onBack}
            className="flex items-center justify-center gap-2 w-full mt-6 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Selection
          </button>
        </div>
      </motion.div>
    </div>
  );
};
