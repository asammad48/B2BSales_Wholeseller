import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Palette, Save, RefreshCcw, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../../theme/AdminThemeProvider';

const ThemeSettingsPage: React.FC = () => {
  const { theme, updateTheme, isLoading } = useTheme();
  const [localTheme, setLocalTheme] = useState(theme);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    setLocalTheme(theme);
  }, [theme]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateTheme(localTheme);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save theme:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCcw className="animate-spin text-[var(--color-primary)]" size={32} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="admin-toolbar">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Theme Settings</h1>
          <p className="text-[var(--text-muted)] mt-1">Customize your Mobia2Z dashboard appearance.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="btn-primary flex items-center gap-2"
        >
          {isSaving ? <RefreshCcw size={18} className="animate-spin" /> : <Save size={18} />}
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Color Configuration */}
        <div className="admin-card p-8 space-y-8">
          <div className="flex items-center gap-3 mb-2">
            <Palette className="text-[var(--color-primary)]" size={24} />
            <h2 className="text-xl font-bold text-white">Brand Colors</h2>
          </div>

          <div className="space-y-6">
            <div className="form-group">
              <label className="form-label">Primary Color</label>
              <div className="flex gap-4 items-center">
                <input 
                  type="color" 
                  value={localTheme.primaryColor}
                  onChange={(e) => setLocalTheme({ ...localTheme, primaryColor: e.target.value })}
                  className="w-12 h-12 rounded-lg bg-transparent border-none cursor-pointer"
                />
                <input 
                  type="text"
                  value={localTheme.primaryColor}
                  onChange={(e) => setLocalTheme({ ...localTheme, primaryColor: e.target.value })}
                  className="form-input font-mono"
                />
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1">Main brand color used for buttons, active states, and highlights.</p>
            </div>

            <div className="form-group">
              <label className="form-label">Secondary Color</label>
              <div className="flex gap-4 items-center">
                <input 
                  type="color" 
                  value={localTheme.secondaryColor}
                  onChange={(e) => setLocalTheme({ ...localTheme, secondaryColor: e.target.value })}
                  className="w-12 h-12 rounded-lg bg-transparent border-none cursor-pointer"
                />
                <input 
                  type="text"
                  value={localTheme.secondaryColor}
                  onChange={(e) => setLocalTheme({ ...localTheme, secondaryColor: e.target.value })}
                  className="form-input font-mono"
                />
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1">Used for sidebar backgrounds and secondary UI elements.</p>
            </div>

            <div className="form-group">
              <label className="form-label">Accent Color</label>
              <div className="flex gap-4 items-center">
                <input 
                  type="color" 
                  value={localTheme.accentColor}
                  onChange={(e) => setLocalTheme({ ...localTheme, accentColor: e.target.value })}
                  className="w-12 h-12 rounded-lg bg-transparent border-none cursor-pointer"
                />
                <input 
                  type="text"
                  value={localTheme.accentColor}
                  onChange={(e) => setLocalTheme({ ...localTheme, accentColor: e.target.value })}
                  className="form-input font-mono"
                />
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1">Complementary color for badges, charts, and secondary accents.</p>
            </div>
          </div>
        </div>

        {/* Preview Card */}
        <div className="space-y-6">
          <div className="admin-card p-8">
            <h2 className="text-xl font-bold text-white mb-6">Live Preview</h2>
            
            <div className="space-y-6 border border-[var(--border-subtle)] p-6 rounded-2xl bg-[var(--bg-main)]">
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: localTheme.primaryColor }} />
                <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: localTheme.secondaryColor }} />
                <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: localTheme.accentColor }} />
              </div>

              <div className="space-y-3">
                <div className="h-4 w-3/4 bg-white/5 rounded" />
                <div className="h-4 w-1/2 bg-white/5 rounded" />
              </div>

              <button 
                className="px-4 py-2 rounded-lg text-white font-medium transition-all"
                style={{ backgroundColor: localTheme.primaryColor, boxShadow: `0 0 15px ${localTheme.primaryColor}66` }}
              >
                Sample Button
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: localTheme.accentColor }}>
                  Status: Active
                </span>
              </div>
            </div>
          </div>

          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-emerald-500/10 border border-emerald-500/50 p-4 rounded-xl flex items-center gap-3 text-emerald-500"
            >
              <CheckCircle2 size={20} />
              <span className="font-medium">Theme settings saved successfully!</span>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ThemeSettingsPage;
