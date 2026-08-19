'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X, Package } from 'lucide-react';

interface Item {
  id: string | number;
  item_code?: string;
  code?: string;
  name_en: string;
  available_quantity?: number | string;
  current_quantity?: number | string;
  unit?: { symbol?: string; name_en?: string };
  barcode?: string;
}

interface SearchableItemSelectProps {
  items: Item[];
  value: string | number | undefined | null;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function SearchableItemSelect({
  items = [],
  value,
  onChange,
  placeholder = 'Search & select item...',
  disabled = false,
}: SearchableItemSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedItem = items.find((i) => String(i.id) === String(value));

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto focus search input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const filteredItems = items.filter((item) => {
    if (!search.trim()) return true;
    const query = search.toLowerCase().trim();
    const name = (item.name_en || '').toLowerCase();
    const code = (item.item_code || item.code || '').toLowerCase();
    const barcode = (item.barcode || '').toLowerCase();
    return name.includes(query) || code.includes(query) || barcode.includes(query);
  });

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) setIsOpen(!isOpen);
        }}
        className={`w-full flex items-center justify-between px-3 py-2 text-sm border rounded-lg bg-background transition-all hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 ${
          disabled ? 'opacity-50 cursor-not-allowed bg-muted' : 'cursor-pointer'
        } ${isOpen ? 'border-primary ring-2 ring-primary/20' : 'border-input'}`}
      >
        <div className="flex items-center gap-2 truncate text-left">
          <Package size={16} className="text-muted-foreground shrink-0" />
          {selectedItem ? (
            <div className="truncate">
              <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded mr-1.5 font-semibold text-foreground">
                {selectedItem.item_code || selectedItem.code || `ID:${selectedItem.id}`}
              </span>
              <span className="font-medium text-foreground">{selectedItem.name_en}</span>
              {(selectedItem.available_quantity !== undefined || selectedItem.current_quantity !== undefined) && (
                <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                  {selectedItem.available_quantity ?? selectedItem.current_quantity} {selectedItem.unit?.symbol || ''}
                </span>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </div>
        <ChevronDown size={16} className={`text-muted-foreground shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-popover border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95">
          {/* Search Bar Input */}
          <div className="p-2 border-b border-border bg-muted/30 flex items-center gap-2">
            <Search size={15} className="text-muted-foreground shrink-0 ml-1" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search item by name, code, or barcode..."
              className="w-full text-sm bg-transparent outline-none placeholder:text-muted-foreground py-1"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="p-1 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filtered Items List */}
          <div className="max-h-60 overflow-y-auto divide-y divide-border/40 p-1">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => {
                const isSelected = String(item.id) === String(value);
                const stockQty = item.available_quantity ?? item.current_quantity ?? 0;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onChange(String(item.id));
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`w-full flex items-center justify-between p-2 text-left rounded-lg transition-colors text-sm ${
                      isSelected
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'hover:bg-muted text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded font-semibold shrink-0">
                        {item.item_code || item.code || `ID:${item.id}`}
                      </span>
                      <span className="truncate font-medium">{item.name_en}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        Number(stockQty) > 0 
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' 
                          : 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300'
                      }`}>
                        {stockQty} {item.unit?.symbol || 'pcs'}
                      </span>
                      {isSelected && <Check size={16} className="text-primary ml-1" />}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No items match &quot;{search}&quot;
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
