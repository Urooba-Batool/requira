import { useState } from 'react';
import { ArrowLeft, Lock, Shield, Mail, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface AdminLoginProps {
  onSuccess: () => void;
  onBack: () => void;
}

export const AdminLogin = ({ onSuccess, onBack }: AdminLoginProps) => {
  const { signIn, checkAdminRole } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter email and password');
      return;
    }
    
    setIsProcessing(true);

    try {
      const { error: signInError } = await signIn(email.trim(), password);
      
      if (signInError) {
        setError(signInError);
        setIsProcessing(false);
        return;
      }

      // Check if user has admin role
      const isAdmin = await checkAdminRole();
      
      if (!isAdmin) {
        setError('You do not have admin privileges');
        setIsProcessing(false);
        return;
      }

      toast.success('Welcome, Admin!');
      onSuccess();
    } catch (err) {
      setError('Authentication failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-card border border-border rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-center mb-6">
            <div className="p-4 gradient-primary rounded-xl">
              <Shield className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>

          <h2 className="text-2xl font-display font-bold text-center text-foreground mb-2">
            Admin Login
          </h2>
          <p className="text-center text-muted-foreground mb-8">
            Enter your admin credentials to continue
          </p>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="adminEmail">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="adminEmail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@company.com"
                  className="pl-10"
                  disabled={isProcessing}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminPassword">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="adminPassword"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="pl-10"
                  disabled={isProcessing}
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            <Button 
              type="submit" 
              className="w-full gradient-primary text-primary-foreground"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Lock className="w-4 h-4 mr-2" />
              )}
              Log In
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
