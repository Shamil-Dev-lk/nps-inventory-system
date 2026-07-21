'use client';

import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import { Search, Box, Users, FileText, ShoppingCart, Settings } from 'lucide-react';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex justify-center pt-[20vh] p-4">
      <Command 
        className="w-full max-w-2xl bg-card rounded-2xl shadow-2xl border border-border/50 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-4 border-b border-border/50">
          <Search className="text-muted-foreground mr-2 shrink-0" size={18} />
          <Command.Input 
            placeholder="Search documents, items, actions... (or type / for commands)" 
            className="flex-1 bg-transparent py-4 outline-none text-foreground placeholder:text-muted-foreground"
          />
        </div>
        
        <Command.List className="max-h-[300px] overflow-y-auto p-2 custom-scrollbar">
          <Command.Empty className="p-6 text-center text-sm text-muted-foreground">
            No results found. Try searching for "GRN" or "Supplier".
          </Command.Empty>

          <Command.Group heading="Inventory" className="text-xs text-muted-foreground font-semibold mb-2 px-2 pt-2">
            <Command.Item 
              onSelect={() => runCommand(() => router.push('/dashboard/items'))}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-primary hover:text-primary-foreground cursor-pointer transition-colors"
            >
              <Box size={16} /> Item Master
            </Command.Item>
            <Command.Item 
              onSelect={() => runCommand(() => router.push('/dashboard/stock/grn'))}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-primary hover:text-primary-foreground cursor-pointer transition-colors mt-1"
            >
              <FileText size={16} /> Goods Received Notes (GRN)
            </Command.Item>
          </Command.Group>

          <Command.Group heading="Store Setup" className="text-xs text-muted-foreground font-semibold mb-2 px-2 pt-4">
            <Command.Item 
              onSelect={() => runCommand(() => router.push('/dashboard/store/suppliers'))}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-primary hover:text-primary-foreground cursor-pointer transition-colors"
            >
              <Users size={16} /> Suppliers
            </Command.Item>
            <Command.Item 
              onSelect={() => runCommand(() => router.push('/dashboard/settings/organization'))}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-primary hover:text-primary-foreground cursor-pointer transition-colors mt-1"
            >
              <Settings size={16} /> Organization Settings
            </Command.Item>
          </Command.Group>
        </Command.List>
      </Command>
      
      {/* Invisible backdrop click catcher */}
      <div className="fixed inset-0 -z-10" onClick={() => setOpen(false)} />
    </div>
  );
}
