import React from 'react';

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  onRowClick?: (item: T) => void;
  maxHeightClassName?: string;
}

export function DataTable<T extends { id: string | number }>({ 
  data, 
  columns, 
  loading,
  onRowClick,
  maxHeightClassName = 'max-h-[62vh]',
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="bg-[var(--bg-surface)] rounded-b-[24px] p-12 flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-4 border-[var(--border-subtle)] border-t-gray-900 rounded-full animate-spin"></div>
        <p className="text-gray-400 text-sm">Loading data...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-[var(--bg-surface)] rounded-b-[24px] p-12 text-center">
        <p className="text-gray-400">No records found.</p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-surface)] rounded-b-[24px] overflow-hidden">
      <div className={`overflow-auto ${maxHeightClassName}`}>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--border-subtle)]">
              {columns.map((col, idx) => (
                <th 
                  key={idx} 
                  className={`px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-gray-400 ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, rowIndex) => (
              <tr 
                key={`${item.id}-${rowIndex}`}
                onClick={() => onRowClick?.(item)}
                className={`border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface-variant)] transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
              >
                {columns.map((col, idx) => (
                  <td key={`${col.header}-${idx}`} className={`px-6 py-4 text-sm text-gray-600 ${col.className || ''}`}>
                    {typeof col.accessor === 'function' 
                      ? col.accessor(item) 
                      : (item[col.accessor] as React.ReactNode)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
