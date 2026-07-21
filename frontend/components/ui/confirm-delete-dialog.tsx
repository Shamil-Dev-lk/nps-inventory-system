'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './modal';

interface ConfirmDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  isLoading?: boolean;
}

export function ConfirmDeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you absolutely sure?',
  description = 'This action cannot be undone. This will permanently delete the record and remove it from our servers.',
  isLoading = false,
}: ConfirmDeleteDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Deletion" maxWidth="max-w-md">
      <div className="flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4">
          <AlertTriangle size={24} className="text-red-600 dark:text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground mt-2 mb-6">{description}</p>
        
        <div className="flex items-center gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted transition-colors font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors font-medium disabled:opacity-70 flex items-center justify-center"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Delete Record'
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
