import React from 'react';
import { Search, Filter } from 'lucide-react';

interface SearchToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
}

export const SearchToolbar: React.FC<SearchToolbarProps> = ({ 
  search, 
  onSearchChange, 
  placeholder = "Search..." 
}) => {
  return (
    <div className="bg-[var(--bg-surface)] p-4 rounded-t-[24px] border-b border-[var(--border-subtle)] flex items-center gap-4">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-[var(--bg-surface-variant)] border-none rounded-xl py-2.5 pl-12 pr-4 focus:ring-2 focus:ring-[var(--focus-ring)] transition-all outline-none text-sm"
        />
      </div>
      
      <button className="p-2.5 hover:bg-[var(--bg-surface-variant)] rounded-xl text-gray-500 transition-colors border border-[var(--border-subtle)]">
        <Filter size={18} />
      </button>
    </div>
  );
};
