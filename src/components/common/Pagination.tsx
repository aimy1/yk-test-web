import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(totalItems, currentPage * pageSize);

  return (
    <div className="px-4 py-3 bg-white/90 backdrop-blur-md border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs select-none shadow-2xs">
      <div className="flex items-center space-x-3 text-slate-500 font-medium">
        <span>
          显示第 <strong className="text-slate-900 font-mono">{startItem}</strong> - <strong className="text-slate-900 font-mono">{endItem}</strong> 条，共 <strong className="text-blue-600 font-mono">{totalItems}</strong> 条数据
        </span>
        {onPageSizeChange && (
          <div className="flex items-center space-x-1.5 pl-2 border-l border-slate-200">
            <span>每页显示</span>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} 条
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-1.5 font-mono">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
          title="首页"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
          title="上一页"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        <div className="px-3 py-1 bg-slate-900 text-white font-bold rounded-lg text-xs shadow-2xs">
          第 {currentPage} / {totalPages} 页
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
          title="下一页"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
          title="尾页"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
