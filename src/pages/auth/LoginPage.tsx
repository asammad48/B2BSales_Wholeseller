import React, { useState } from 'react';
import { useAuth } from '../../state/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login({ email, password });
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-app)] flex items-center justify-center p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[var(--bg-surface)] rounded-[24px] shadow-sm p-8 md:p-12"
      >
        <div className="mb-8">
          <h1 className="text-3xl font-light text-gray-900 mb-2">Admin Portal</h1>
          <p className="text-muted text-sm">Please sign in to access the dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3 text-sm">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider ml-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[var(--bg-surface-variant)] border-none rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-[var(--focus-ring)] transition-all outline-none"
                placeholder="admin@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider ml-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[var(--bg-surface-variant)] border-none rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-[var(--focus-ring)] transition-all outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gray-900 text-white rounded-xl py-3 font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-[var(--border-subtle)]">
          <p className="text-center text-xs text-gray-400">
            Mobia2Z Admin System &copy; 2026
          </p>
        </div>
      </motion.div>
    </div>
  );
};
