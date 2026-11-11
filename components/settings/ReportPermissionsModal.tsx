'use client';

import React from 'react';
import { X, ShieldCheck } from 'lucide-react';
import { ReportPermissionsManager } from './ReportPermissionsManager';

interface ReportPermissionsModalProps {
  user: any | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (updatedPermissions: string[]) => void;
}

export function ReportPermissionsModal({
  user,
  isOpen,
  onClose,
  onSaved
}: ReportPermissionsModalProps) {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl overflow-hidden border border-border flex flex-col animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-muted/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#701a2b] text-white flex items-center justify-center shadow-sm">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                Configure Report Permissions (වාර්තා ප්‍රවේශ අවසර කළමනාකරණය)
              </h2>
              <p className="text-xs text-muted-foreground">
                Set individual report view, download, print, and export authorizations for {user.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          <ReportPermissionsManager
            user={user}
            onSaved={(updated) => {
              if (onSaved) onSaved(updated);
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
}
