import React from 'react';
import { ChevronDown, Search } from 'lucide-react';

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  error?: string;
}

export interface SearchableSelectOption {
  value: string;
  label: string;
  description?: string;
}

const fieldClassName = 'w-full bg-gray-50 border-none rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-gray-200 transition-all';

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
      className={`${fieldClassName} ${props.className || ''}`}
    />
  )
);
Input.displayName = 'Input';

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  (props, ref) => (
    <select
      ref={ref}
      {...props}
      className={`${fieldClassName} appearance-none ${props.className || ''}`}
    />
  )
);
Select.displayName = 'Select';

interface SearchableSelectProps {
  name?: string;
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  noResultsText?: string;
  emptyLabel?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  name,
  value,
  onChange,
  options,
  placeholder = 'Search and select',
  required,
  disabled,
  className,
  noResultsText = 'No results found',
  emptyLabel,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  const selectedOption = React.useMemo(
    () => options.find((option) => option.value === value),
    [options, value]
  );

  const filteredOptions = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return options;
    }

    return options.filter((option) => {
      const haystack = `${option.label} ${option.description || ''}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [options, query]);

  React.useEffect(() => {
    if (!isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (nextValue: string) => {
    onChange(nextValue);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div ref={containerRef} className={`relative ${className || ''}`}>
      {name ? <input type="hidden" name={name} value={value} required={required} /> : null}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((current) => !current)}
        className={`${fieldClassName} flex items-center justify-between text-left ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
      >
        <span className={selectedOption ? 'text-gray-900' : 'text-gray-400'}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && !disabled ? (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
          <div className="border-b border-gray-100 p-3">
            <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2">
              <Search size={14} className="text-gray-400" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={placeholder}
                className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto py-2">
            {emptyLabel ? (
              <button
                type="button"
                onClick={() => handleSelect('')}
                className={`flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-gray-50 ${!value ? 'bg-gray-50' : ''}`}
              >
                <span className="text-sm text-gray-500">{emptyLabel}</span>
                {!value ? <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Selected</span> : null}
              </button>
            ) : null}
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const isSelected = option.value === value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`flex w-full items-start justify-between px-4 py-3 text-left transition-colors hover:bg-gray-50 ${isSelected ? 'bg-gray-50' : ''}`}
                  >
                    <div>
                      <p className="text-sm text-gray-900">{option.label}</p>
                      {option.description ? (
                        <p className="mt-1 text-[11px] text-gray-400">{option.description}</p>
                      ) : null}
                    </div>
                    {isSelected ? <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Selected</span> : null}
                  </button>
                );
              })
            ) : (
              <p className="px-4 py-3 text-sm text-gray-400">{noResultsText}</p>
            )}
          </div>
        </div>
      ) : null}
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
