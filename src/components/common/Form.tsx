import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

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



export interface MultiSearchableSelectProps {
  options: SearchableSelectOption[];
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  noResultsText?: string;
  emptyStateText?: string;
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
      className={`w-full bg-[var(--bg-surface-variant)] border-none rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-[var(--focus-ring)] transition-all ${props.className || ''}`}
    />
  )
);

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  (props, ref) => (
    <select
      ref={ref}
      {...props}
      className={`w-full bg-[var(--bg-surface-variant)] border-none rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-[var(--focus-ring)] transition-all appearance-none ${props.className || ''}`}
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
          className="w-full bg-[var(--bg-surface-variant)] border-none rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-[var(--focus-ring)] transition-all text-left disabled:opacity-50"
        >
          <span className={selectedOption ? 'text-gray-900' : 'text-gray-400'}>
            {selectedOption?.label || placeholder}
          </span>
          <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </button>

        {isOpen && (
          <div className="absolute z-30 mt-2 w-full rounded-2xl bg-[var(--bg-surface)] shadow-lg border border-[var(--border-subtle)] overflow-hidden">
            <div className="p-3 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
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
                  className="w-full bg-[var(--bg-surface-variant)] border-none rounded-xl py-2.5 pl-9 pr-3 outline-none focus:ring-2 focus:ring-[var(--focus-ring)] transition-all text-sm"
                  placeholder={searchPlaceholder}
                />
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto p-2 bg-[var(--bg-surface)]">
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
                          ? 'bg-[var(--bg-surface-variant-strong)] text-gray-900'
                          : isHighlighted
                            ? 'bg-[var(--bg-surface-variant)] text-gray-900'
                            : 'text-gray-600 hover:bg-[var(--bg-surface-variant)]'
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


export const MultiSearchableSelect: React.FC<MultiSearchableSelectProps> = ({
  options,
  values,
  onChange,
  placeholder = 'Select options',
  searchPlaceholder = 'Search...',
  disabled,
  className,
  noResultsText = 'No matching options',
  emptyStateText = 'No items selected',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const remainingOptions = options.filter((option) => !values.includes(option.value));

    if (!normalized) {
      return remainingOptions;
    }

    return remainingOptions.filter((option) => {
      const haystack = `${option.label} ${option.searchText || ''}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [options, query, values]);

  const selectedOptions = useMemo(
    () => values.map((value) => options.find((option) => option.value === value)).filter(Boolean) as SearchableSelectOption[],
    [options, values]
  );

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

  const addValue = (nextValue: string) => {
    if (values.includes(nextValue)) {
      return;
    }

    onChange([...values, nextValue]);
    setQuery('');
  };

  const removeValue = (valueToRemove: string) => {
    onChange(values.filter((value) => value !== valueToRemove));
  };

  return (
    <div ref={containerRef} className={`space-y-3 ${className || ''}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative w-full bg-[var(--bg-surface-variant)] border-none rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-[var(--focus-ring)] transition-all text-left disabled:opacity-50"
      >
        <span className={selectedOptions.length ? 'text-gray-900' : 'text-gray-400'}>
          {selectedOptions.length ? `${selectedOptions.length} selected` : placeholder}
        </span>
        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </button>

      {selectedOptions.length ? (
        <div className="space-y-2">
          {selectedOptions.map((option) => (
            <div key={option.value} className="flex items-start justify-between gap-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{option.label}</p>
              </div>
              <button
                type="button"
                onClick={() => removeValue(option.value)}
                disabled={disabled}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-[var(--bg-surface-variant-strong)] hover:text-gray-600 disabled:opacity-50"
                title="Remove selection"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">{emptyStateText}</p>
      )}

      {isOpen && (
        <div className="z-30 rounded-2xl bg-[var(--bg-surface)] shadow-lg border border-[var(--border-subtle)] overflow-hidden">
          <div className="p-3 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
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
                      addValue(highlighted.value);
                    }
                  } else if (event.key === 'Escape') {
                    setIsOpen(false);
                    setQuery('');
                  }
                }}
                className="w-full bg-[var(--bg-surface-variant)] border-none rounded-xl py-2.5 pl-9 pr-3 outline-none focus:ring-2 focus:ring-[var(--focus-ring)] transition-all text-sm"
                placeholder={searchPlaceholder}
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto p-2 bg-[var(--bg-surface)]">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => {
                const isHighlighted = index === highlightedIndex;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onClick={() => addValue(option.value)}
                    className={`w-full rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                      isHighlighted ? 'bg-[var(--bg-surface-variant)] text-gray-900' : 'text-gray-600 hover:bg-[var(--bg-surface-variant)]'
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
};


export const Button = ({ 
  children, 
  variant = 'primary', 
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' }) => {
  const variants = {
    primary: 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]',
    secondary: 'bg-[var(--bg-surface-variant-strong)] text-gray-900 hover:bg-[var(--bg-surface-variant-strong)]',
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
