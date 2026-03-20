import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  error?: string;
}

export interface SearchableSelectOption {
  value: string;
  label: string;
  searchText?: string;
}

interface SearchableSelectProps {
  name: string;
  options: SearchableSelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  noResultsText?: string;
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

export const SearchableSelect = React.forwardRef<HTMLInputElement, SearchableSelectProps>(
  (
    {
      name,
      options,
      value,
      defaultValue,
      onChange,
      placeholder = 'Select an option',
      searchPlaceholder = 'Search...',
      required,
      disabled,
      className,
      noResultsText = 'No matching options',
    },
    ref
  ) => {
    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = useState(defaultValue || '');
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const searchInputRef = useRef<HTMLInputElement | null>(null);

    const selectedValue = isControlled ? value : internalValue;

    const filteredOptions = useMemo(() => {
      const normalized = query.trim().toLowerCase();
      if (!normalized) {
        return options;
      }

      return options.filter((option) => {
        const haystack = `${option.label} ${option.searchText || ''}`.toLowerCase();
        return haystack.includes(normalized);
      });
    }, [options, query]);

    const selectedOption = options.find((option) => option.value === selectedValue);

    useEffect(() => {
      if (!isOpen) {
        return;
      }

      const handleClickOutside = (event: MouseEvent) => {
        if (!containerRef.current?.contains(event.target as Node)) {
          setIsOpen(false);
          setQuery('');
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    useEffect(() => {
      if (isOpen) {
        setHighlightedIndex(0);
        window.setTimeout(() => searchInputRef.current?.focus(), 0);
      }
    }, [isOpen]);

    const commitValue = (nextValue: string) => {
      if (!isControlled) {
        setInternalValue(nextValue);
      }
      onChange?.(nextValue);
      setIsOpen(false);
      setQuery('');
    };

    return (
      <div ref={containerRef} className={`relative ${className || ''}`}>
        <input ref={ref} type="hidden" name={name} value={selectedValue || ''} required={required} />
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen((prev) => !prev)}
          className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-gray-200 transition-all text-left disabled:opacity-50"
        >
          <span className={selectedOption ? 'text-gray-900' : 'text-gray-400'}>
            {selectedOption?.label || placeholder}
          </span>
          <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </button>

        {isOpen && (
          <div className="absolute z-30 mt-2 w-full rounded-2xl bg-white shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-3 border-b border-gray-100 bg-white">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'ArrowDown') {
                      event.preventDefault();
                      setHighlightedIndex((prev) => Math.min(prev + 1, Math.max(filteredOptions.length - 1, 0)));
                    } else if (event.key === 'ArrowUp') {
                      event.preventDefault();
                      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
                    } else if (event.key === 'Enter') {
                      event.preventDefault();
                      const highlighted = filteredOptions[highlightedIndex];
                      if (highlighted) {
                        commitValue(highlighted.value);
                      }
                    } else if (event.key === 'Escape') {
                      setIsOpen(false);
                      setQuery('');
                    }
                  }}
                  className="w-full bg-gray-50 border-none rounded-xl py-2.5 pl-9 pr-3 outline-none focus:ring-2 focus:ring-gray-200 transition-all text-sm"
                  placeholder={searchPlaceholder}
                />
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto p-2 bg-white">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option, index) => {
                  const isSelected = option.value === selectedValue;
                  const isHighlighted = index === highlightedIndex;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onMouseEnter={() => setHighlightedIndex(index)}
                      onClick={() => commitValue(option.value)}
                      className={`w-full rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                        isSelected
                          ? 'bg-gray-100 text-gray-900'
                          : isHighlighted
                            ? 'bg-gray-50 text-gray-900'
                            : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })
              ) : (
                <p className="px-3 py-2 text-sm text-gray-400">{noResultsText}</p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);

SearchableSelect.displayName = 'SearchableSelect';

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
