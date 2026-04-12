import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Mail, RefreshCcw, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../state/AuthContext';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Default redirect to home or the page they came from
  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center p-4">
      <div className="absolute top-8 left-8">
        <Link to="/" className="flex items-center gap-2 text-[var(--text-muted)] hover:text-white transition-colors">
          <ArrowLeft size={18} />
          Back to Mobia2z
        </Link>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md admin-card p-8 shadow-2xl"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-[var(--color-primary)] rounded-xl flex items-center justify-center mb-4 shadow-glow p-1.5">
            <img src="/mobia2z-logo.svg" alt="Mobia2z logo" className="h-full w-full" />
          </div>
          <h1 className="text-2xl font-bold text-white">Mobia2z Login</h1>
          <p className="text-[var(--text-muted)]">Access wholesale pricing and orders</p>
        </div>
        
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-rose-500/10 border border-rose-500/50 rounded-xl flex items-center gap-3 text-rose-500 text-sm"
          >
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label className="form-label flex items-center gap-2">
              <Mail size={14} />
              Email Address
            </label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              placeholder="buyer@example.com"
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <label className="form-label flex items-center gap-2">
              <Lock size={14} />
              Password
            </label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="••••••••"
              disabled={isLoading}
            />
          </div>
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full btn-primary mt-4 flex items-center justify-center gap-2"
          >
            {isLoading ? <RefreshCcw size={18} className="animate-spin" /> : null}
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[var(--surface-overlay-border)] text-center">
          <p className="text-sm text-[var(--text-muted)]">
            Don't have a wholesale account? <br />
            <Link to="/register" className="text-[var(--color-primary)] hover:underline font-medium">Apply for access</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
