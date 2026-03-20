import React, { useEffect, useMemo, useRef, useState } from 'react';

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  error?: string;
}

export interface SearchableSelectOption {
  value: string;
  label: string;
  keywords?: string[];
}

interface SearchableSelectProps {
  name: string;
  value?: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
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
      className={`w-full bg-gray-50 border-none rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-gray-200 transition-all ${props.className || ''}`}
    />
  )
);

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  (props, ref) => (
    <select
      ref={ref}
      {...props}
      className={`w-full bg-gray-50 border-none rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-gray-200 transition-all appearance-none ${props.className || ''}`}
    />
  )
);

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  name,
  value = '',
  onChange,
  options,
  placeholder = 'Select an option',
  required,
  disabled,
  className,
  searchPlaceholder = 'Search...',
  emptyMessage = 'No options found.',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value]
  );

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return options;
    }

    return options.filter((option) => {
      const haystack = [option.label, ...(option.keywords || [])].join(' ').toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [options, query]);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      return;
    }

    const timer = window.setTimeout(() => searchInputRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className || ''}`}>
      <input type="hidden" name={name} value={value} required={required} />
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((current) => !current)}
        className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-gray-200 transition-all text-left disabled:opacity-50"
      >
        <span className={selectedOption ? 'text-gray-900' : 'text-gray-400'}>
          {selectedOption?.label || placeholder}
        </span>
        <span className="absolute inset-y-0 right-4 flex items-center text-gray-400 pointer-events-none">▾</span>
      </button>

      {isOpen && (
        <div className="absolute z-20 mt-2 w-full rounded-2xl border border-gray-100 bg-white shadow-xl overflow-hidden">
          <div className="p-3 border-b border-gray-100 bg-white">
            <Input
              ref={searchInputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="bg-gray-50"
            />
          </div>

          <div className="max-h-60 overflow-y-auto py-2">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const isSelected = option.value === value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${isSelected ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    {option.label}
                  </button>
                );
              })
            ) : (
              <p className="px-4 py-3 text-sm text-gray-400">{emptyMessage}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const Button = ({ 
  children, 
  variant = 'primary', 
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' }) => {
  const variants = {
    primary: 'bg-gray-900 text-white hover:bg-gray-800',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };

  return (
    <button
      {...props}
      className={`w-full rounded-xl py-3 font-medium transition-all disabled:opacity-50 ${variants[variant]} ${props.className || ''}`}
    >
      {children}
    </button>
  );
};
