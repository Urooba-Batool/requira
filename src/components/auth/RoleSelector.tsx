import { Briefcase, Shield, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface RoleSelectorProps {
  onSelectAdmin: () => void;
  onSelectClient: () => void;
}

export const RoleSelector = ({ onSelectAdmin, onSelectClient }: RoleSelectorProps) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 text-center mb-12"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 gradient-primary rounded-xl shadow-glow">
            <Sparkles className="w-8 h-8 text-primary-foreground" />
          </div>
        </div>
        <h1 className="text-5xl font-display font-bold text-foreground mb-3">
          Welcome to <span className="text-primary">Requira</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-md mx-auto">
          AI-powered software requirements gathering made simple
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="relative z-10 flex flex-col sm:flex-row gap-6"
      >
        <button
          onClick={onSelectAdmin}
          className="group relative w-64 p-8 bg-card rounded-2xl border border-border shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
        >
          <div className="absolute inset-0 gradient-primary opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity" />
          <div className="p-4 gradient-primary rounded-xl w-fit mx-auto mb-4 group-hover:shadow-glow transition-shadow">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <h3 className="text-xl font-display font-semibold text-foreground mb-2">Admin Dashboard</h3>
          <p className="text-sm text-muted-foreground">
            Review and manage project submissions
          </p>
        </button>

        <button
          onClick={onSelectClient}
          className="group relative w-64 p-8 bg-card rounded-2xl border border-border shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
        >
          <div className="absolute inset-0 gradient-secondary opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity" />
          <div className="p-4 gradient-secondary rounded-xl w-fit mx-auto mb-4 group-hover:shadow-lg transition-shadow">
            <Briefcase className="w-8 h-8 text-secondary-foreground" />
          </div>
          <h3 className="text-xl font-display font-semibold text-foreground mb-2">Client Dashboard</h3>
          <p className="text-sm text-muted-foreground">
            Submit and track your project requirements
          </p>
        </button>
      </motion.div>
    </div>
  );
};
