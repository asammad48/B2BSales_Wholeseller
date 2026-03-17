import React from 'react';

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  error?: string;
}

export const FormField: React.FC<FormFieldProps> = ({ label, children, error }) => (
  <div className="space-y-1">
    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">
      {label}
    </label>
    {children}
    {error && <p className="text-red-500 text-[10px] mt-1 ml-1">{error}</p>}
  </div>
);

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  (props, ref) => (
    <input
      ref={ref}
      {...props}
      className={`w-full bg-white/5 border border-[var(--border-subtle)] rounded-[var(--radius-lg)] py-3 px-4 text-sm font-medium text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--border-focus)]/40 transition-all hover:bg-white/[0.07] disabled:opacity-60 disabled:cursor-not-allowed ${props.className || ''}`}
    />
  )
);

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  (props, ref) => (
    <div className="relative group">
      <select
        ref={ref}
        {...props}
        className={`w-full bg-white/5 border border-[var(--border-subtle)] rounded-[var(--radius-lg)] py-3 px-4 pr-10 text-sm font-medium text-[var(--text-primary)] outline-none focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--border-focus)]/40 transition-all appearance-none hover:bg-white/[0.07] disabled:opacity-60 disabled:cursor-not-allowed [&>option]:bg-[var(--bg-card)] [&>option]:text-[var(--text-primary)] ${props.className || ''}`}
      />
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)] group-focus-within:text-[var(--text-secondary)] transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </div>
    </div>
  )
);

export const Button = ({ 
  children, 
  variant = 'primary', 
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' }) => {
  const variants = {
    primary: 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] shadow-lg shadow-[var(--color-primary-glow)]',
    secondary: 'bg-white/5 text-[var(--text-primary)] border border-[var(--border-subtle)] hover:bg-white/10',
    danger: 'bg-red-600/90 text-white hover:bg-red-600',
  };

  return (
    <button
      {...props}
      className={`w-full rounded-[var(--radius-lg)] py-3 px-4 text-sm font-semibold transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${props.className || ''}`}
    >
      {children}
    </button>
  );
};
