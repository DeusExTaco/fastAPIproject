// components/Pagination.tsx
import React from 'react';
import { ArrowRightIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onNext: () => void;
  onPrev: () => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onNext,
  onPrev
}) => {
  return (
    <div className="flex items-center justify-between border-t border-gray-200 p-4">
      <span className="text-sm text-gray-700 font-normal">
        Page {currentPage} of {totalPages}
      </span>
      <div className="flex gap-2">
        <button
          onClick={onPrev}
          disabled={currentPage === 1}
          type="button"
          aria-label="Previous page"
          className={`p-2 rounded-lg border border-gray-300 transition-colors duration-200
            ${currentPage === 1
              ? 'opacity-50 cursor-default pointer-events-none bg-gray-50 text-gray-400'
              : 'hover:bg-gray-100 text-gray-700'
            }`}
        >
          <ArrowLeftIcon strokeWidth={2} className="h-4 w-4" />
        </button>
        <button
          onClick={onNext}
          disabled={currentPage === totalPages}
          type="button"
          aria-label="Next page"
          className={`p-2 rounded-lg border border-gray-300 transition-colors duration-200
            ${currentPage === totalPages
              ? 'opacity-50 cursor-default pointer-events-none bg-gray-50 text-gray-400'
              : 'hover:bg-gray-100 text-gray-700'
            }`}
        >
          <ArrowRightIcon strokeWidth={2} className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;