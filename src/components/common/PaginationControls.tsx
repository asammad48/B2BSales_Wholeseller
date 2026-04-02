import React from 'react';

interface PaginationControlsProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  currentCount: number;
  itemLabel?: string;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  pageSize,
  totalItems,
  currentCount,
  itemLabel = 'records',
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
}) => {
  const totalPages = Math.max(Math.ceil(totalItems / pageSize), 1);
  const visiblePageButtonCount = 4;
  const pageStart = Math.max(
    1,
    Math.min(currentPage - Math.floor(visiblePageButtonCount / 2), totalPages - visiblePageButtonCount + 1),
  );
  const pageNumbers = Array.from(
    { length: Math.min(visiblePageButtonCount, totalPages) },
    (_, index) => pageStart + index,
  );

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 px-2">
      <div className="flex items-center gap-4">
        <p className="text-xs text-gray-400">
          Showing <span className="font-medium text-gray-600">{currentCount}</span> of <span className="font-medium text-gray-600">{totalItems}</span> {itemLabel}
        </p>
        {onPageSizeChange ? (
          <label className="flex items-center gap-2 text-xs text-gray-500">
            <span className="text-[10px] uppercase tracking-widest text-gray-400">Page size</span>
            <select
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs font-medium text-gray-700 focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-100"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="rounded-lg border border-gray-100 bg-white px-4 py-2 text-xs font-medium transition-colors hover:bg-gray-50 disabled:opacity-50"
        >
          Previous
        </button>
        <div className="flex items-center gap-1">
          {pageNumbers.map((pageNumber) => (
            <button
              key={pageNumber}
              onClick={() => onPageChange(pageNumber)}
              className={`h-8 min-w-8 rounded-lg border px-2 text-xs font-semibold transition-colors ${
                pageNumber === currentPage
                  ? 'border-transparent text-white'
                  : 'border-gray-100 bg-white text-gray-600 hover:bg-gray-50'
              }`}
              style={pageNumber === currentPage ? { backgroundColor: 'var(--primary-color)' } : undefined}
            >
              {pageNumber}
            </button>
          ))}
        </div>
        <button
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="rounded-lg border border-gray-100 bg-white px-4 py-2 text-xs font-medium transition-colors hover:bg-gray-50 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};
