'use client';

import React, { useState } from 'react';
import { Camera, Sparkles, X, Aperture } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhotographyStudioModal } from './PhotographyStudioModal';
import { useOrgStore } from '@/store/org-store';

export function PhotographyDayBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const { org } = useOrgStore();

  const handleOpenStudio = () => {
    setIsFlashing(true);
    setTimeout(() => {
      setIsFlashing(false);
      setIsStudioOpen(true);
    }, 200);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Screen Camera Flash Effect */}
      <AnimatePresence>
        {isFlashing && (
          <motion.div
            initial={{ opacity: 0.9 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-white z-[9999] pointer-events-none"
          />
        )}
      </AnimatePresence>

      <PhotographyStudioModal
        isOpen={isStudioOpen}
        onClose={() => setIsStudioOpen(false)}
        orgName={org?.name_en || 'ANTIGRAVITY Inventory System'}
      />

      <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 text-white px-4 py-2 shadow-lg flex items-center justify-between gap-3 text-xs sm:text-sm border-b border-indigo-500/30 relative overflow-hidden shrink-0 print:hidden">
        {/* Decorative background lens ring */}
        <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full border-4 border-white/5 pointer-events-none" />

        <div className="flex items-center gap-2.5 truncate">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0 text-amber-300">
            <Camera size={16} className="animate-pulse" />
          </div>
          <div className="truncate">
            <span className="font-extrabold text-amber-300 mr-2">
              📸 World Photography Day 2026
            </span>
            <span className="hidden md:inline text-slate-300">
              | Celebrating the art, science & history of photography! Capturing moments with precision.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleOpenStudio}
            className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs rounded-full shadow-md transition-all hover:scale-105 active:scale-95"
            title="Open Interactive Photo Studio"
          >
            <Aperture size={14} />
            <span>Photo Studio 📸</span>
          </button>

          <button
            type="button"
            onClick={() => setIsVisible(false)}
            className="p-1 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors ml-1"
            title="Close Banner"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </>
  );
}
