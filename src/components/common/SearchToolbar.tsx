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
  placeholder = 'Search...'
}) => {
  return (
    <div className="bg-[var(--bg-card)] p-4 rounded-t-[24px] border-b border-[var(--border-subtle)] flex items-center gap-4">
      <div className="relative flex-1 max-w-md group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--text-secondary)] transition-colors" size={18} />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-white/5 border border-[var(--border-subtle)] rounded-[var(--radius-lg)] py-2.5 pl-12 pr-4 outline-none text-sm font-medium text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--border-focus)]/40 transition-all hover:bg-white/[0.07]"
        />
      </div>

      <button className="p-2.5 rounded-[var(--radius-md)] text-[var(--text-secondary)] bg-white/5 border border-[var(--border-subtle)] hover:bg-white/10 hover:text-[var(--text-primary)] transition-all">
        <Filter size={18} />
      </button>
    </div>
  );
};
