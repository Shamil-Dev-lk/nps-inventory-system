'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, Search, Edit2, Trash2, Plus, FileDown, Printer, FileText, Sheet, Code, Copy 
} from 'lucide-react';

import { exportToCsv, exportToExcel, exportToPdf, exportToJson, copyToClipboard } from '@/lib/document-engine';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onPrint?: (row: T) => void;
  onDownload?: (row: T) => void;
  onAdd?: () => void;
  addButtonLabel?: string;
  searchPlaceholder?: string;
  searchKey?: keyof T;
  keyExtractor: (row: T) => string | number;
  exportFilename?: string;
  selectable?: boolean;
  onSelectionChange?: (selectedRows: T[]) => void;
  toolbarActions?: React.ReactNode;
}

import { PrintLayout } from '@/components/print/PrintLayout';

export function DataTable<T>({
  data,
  columns,
  isLoading,
  onEdit,
  onDelete,
  onPrint,
  onDownload,
  onAdd,
  addButtonLabel = 'Add New',
  searchPlaceholder = 'Search...',
  searchKey,
  keyExtractor,
  exportFilename = 'export',
  selectable = false,
  onSelectionChange,
  toolbarActions,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedKeys, setSelectedKeys] = useState<Set<string | number>>(new Set());
  const itemsPerPage = 10;

  // Filter data based on search
  const filteredData = React.useMemo(() => {
    if (!searchQuery || !searchKey) return data;
    return data.filter((item) => {
      const val = item[searchKey];
      if (typeof val === 'string' || typeof val === 'number') {
        return String(val).toLowerCase().includes(searchQuery.toLowerCase());
      }
      return true;
    });
  }, [data, searchQuery, searchKey]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Selection Logic
  React.useEffect(() => {
    if (onSelectionChange) {
      const selected = data.filter(item => selectedKeys.has(keyExtractor(item)));
      onSelectionChange(selected);
    }
  }, [selectedKeys, data, onSelectionChange, keyExtractor]);

  const toggleSelectAll = () => {
    if (selectedKeys.size === paginatedData.length) {
      // Deselect all on current page
      const newKeys = new Set(selectedKeys);
      paginatedData.forEach(item => newKeys.delete(keyExtractor(item)));
      setSelectedKeys(newKeys);
    } else {
      // Select all on current page
      const newKeys = new Set(selectedKeys);
      paginatedData.forEach(item => newKeys.add(keyExtractor(item)));
      setSelectedKeys(newKeys);
    }
  };

  const toggleSelectRow = (key: string | number) => {
    const newKeys = new Set(selectedKeys);
    if (newKeys.has(key)) newKeys.delete(key);
    else newKeys.add(key);
    setSelectedKeys(newKeys);
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Hidden Print Header (Only visible on paper) */}
      <div className="hidden print:block w-full mb-8">
        <PrintLayout title={exportFilename.toUpperCase().replace(/-/g, ' ')} />
      </div>
      {/* Top Bar (Hidden during Print) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div className="relative w-full sm:max-w-md flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-input/50 bg-background/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-sm"
            />
          </div>

          <div className="relative group">
            <button
              className="flex items-center gap-2 px-4 py-2.5 border border-border/50 bg-card/50 backdrop-blur-sm text-foreground rounded-xl hover:bg-muted/80 transition-all text-sm font-medium shadow-sm hover:shadow"
              title="Export Options"
            >
              <FileDown size={16} />
              <span className="hidden sm:inline">Export As</span>
            </button>
            <div className="absolute right-0 mt-2 w-48 rounded-xl border border-border/50 bg-card/90 backdrop-blur-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden flex flex-col py-1">
              <button onClick={() => window.print()} className="text-left px-4 py-2 text-sm hover:bg-muted/50 flex items-center gap-2"><Printer size={14}/> Print Preview</button>
              <button onClick={() => exportToPdf(exportFilename, filteredData as object[])} className="text-left px-4 py-2 text-sm hover:bg-muted/50 flex items-center gap-2"><FileText size={14}/> Export PDF</button>
              <button onClick={() => exportToExcel(exportFilename, filteredData as object[])} className="text-left px-4 py-2 text-sm hover:bg-muted/50 flex items-center gap-2"><Sheet size={14}/> Export Excel</button>
              <button onClick={() => exportToCsv(exportFilename, filteredData as object[])} className="text-left px-4 py-2 text-sm hover:bg-muted/50 flex items-center gap-2"><FileText size={14}/> Export CSV</button>
              <button onClick={() => exportToJson(exportFilename, filteredData as object[])} className="text-left px-4 py-2 text-sm hover:bg-muted/50 flex items-center gap-2"><Code size={14}/> Export JSON</button>
              <div className="h-px bg-border my-1"></div>
              <button onClick={() => copyToClipboard(filteredData as object[])} className="text-left px-4 py-2 text-sm hover:bg-muted/50 flex items-center gap-2"><Copy size={14}/> Copy Data</button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          {toolbarActions}
          {onAdd && (
            <button
              onClick={onAdd}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all text-sm font-bold tracking-wide shrink-0 shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              <Plus size={16} />
              {addButtonLabel}
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.04)] flex-1">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-semibold border-b border-border">
              <tr>
                {selectable && (
                  <th className="px-5 py-3 w-12 print:hidden">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300"
                      checked={paginatedData.length > 0 && paginatedData.every(item => selectedKeys.has(keyExtractor(item)))}
                      onChange={toggleSelectAll}
                    />
                  </th>
                )}
                {columns.map((col, i) => (
                  <th key={i} className={`px-5 py-3 ${col.className || ''}`}>
                    {col.header}
                  </th>
                ))}
                {(onEdit || onDelete || onPrint || onDownload) && (
                  <th className="px-5 py-3 text-right print:hidden">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skeleton-${i}`}>
                    {selectable && <td className="px-5 py-4"><div className="shimmer h-4 w-4 rounded bg-muted/60" /></td>}
                    {columns.map((_, colI) => (
                      <td key={colI} className="px-5 py-4">
                        <div className="shimmer h-4 w-3/4 rounded bg-muted/60" />
                      </td>
                    ))}
                    {(onEdit || onDelete || onPrint || onDownload) && (
                      <td className="px-5 py-4 text-right print:hidden">
                        <div className="shimmer h-6 w-16 rounded inline-block bg-muted/60" />
                      </td>
                    )}
                  </tr>
                ))
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (onEdit || onDelete || onPrint || onDownload ? 1 : 0) + (selectable ? 1 : 0)}
                    className="px-5 py-12 text-center text-muted-foreground"
                  >
                    No records found.
                  </td>
                </tr>
              ) : (
                paginatedData.map((row) => (
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={keyExtractor(row)}
                    className="hover:bg-muted/30 transition-colors group print:break-inside-avoid"
                  >
                    {selectable && (
                      <td className="px-5 py-3 print:hidden">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300"
                          checked={selectedKeys.has(keyExtractor(row))}
                          onChange={() => toggleSelectRow(keyExtractor(row))}
                        />
                      </td>
                    )}
                    {columns.map((col, colI) => (
                      <td key={colI} className={`px-5 py-3 text-foreground ${col.className || ''}`}>
                        {typeof col.accessor === 'function'
                          ? col.accessor(row)
                          : (row[col.accessor] as React.ReactNode)}
                      </td>
                    ))}
                    {(onEdit || onDelete || onPrint || onDownload) && (
                      <td className="px-5 py-3 text-right print:hidden">
                        <div className="flex items-center justify-end gap-2">
                          {onDownload && (
                            <button
                              onClick={() => onDownload(row)}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30 rounded-md transition-colors"
                              title="Download PDF"
                            >
                              <FileDown size={16} />
                            </button>
                          )}
                          {onPrint && (
                            <button
                              onClick={() => onPrint(row)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/30 rounded-md transition-colors"
                              title="Print Document"
                            >
                              <Printer size={16} />
                            </button>
                          )}
                          {onEdit && (
                            <button
                              onClick={() => onEdit(row)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={() => onDelete(row)}
                              className="p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-md transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="px-5 py-3 border-t border-border flex items-center justify-between bg-muted/20 print:hidden">
            <span className="text-xs text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} records
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded-md text-muted-foreground hover:bg-muted disabled:opacity-50 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-medium px-2">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded-md text-muted-foreground hover:bg-muted disabled:opacity-50 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
