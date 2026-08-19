'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, X, Aperture, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SpecialDaysRegistry, SpecialDay } from '@/lib/special-days';
import { PhotographyStudioModal } from './PhotographyStudioModal';
import { useOrgStore } from '@/store/org-store';
import Link from 'next/link';

export function DailySpecialDayBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const [specialDay, setSpecialDay] = useState<SpecialDay | null>(null);
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const { org } = useOrgStore();

  useEffect(() => {
    setSpecialDay(SpecialDaysRegistry.getCurrentSpecialDay());
  }, []);

  if (!isVisible || !specialDay) return null;

  const handleAction = () => {
    if (specialDay.interactiveType === 'photography') {
      setIsFlashing(true);
      setTimeout(() => {
        setIsFlashing(false);
        setIsStudioOpen(true);
      }, 200);
    }
  };

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

      <div className={`bg-gradient-to-r ${specialDay.bgGradient} text-white px-4 py-2 shadow-lg flex items-center justify-between gap-3 text-xs sm:text-sm border-b border-white/10 relative overflow-hidden shrink-0 print:hidden`}>
        {/* Ring background */}
        <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full border-4 border-white/5 pointer-events-none" />

        <div className="flex items-center gap-2.5 truncate">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-white font-bold"
            style={{ background: `${specialDay.accentColor}30`, border: `1px solid ${specialDay.accentColor}50` }}
          >
            <span className="text-base">{specialDay.emoji}</span>
          </div>
          <div className="truncate">
            <span className="font-extrabold text-amber-300 mr-2">
              {specialDay.title}
            </span>
            <span className="hidden md:inline text-slate-300">
              | {specialDay.subtitle}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {specialDay.interactiveType === 'photography' ? (
            <button
              type="button"
              onClick={handleAction}
              className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs rounded-full shadow-md transition-all hover:scale-105 active:scale-95"
            >
              <Aperture size={14} />
              <span>{specialDay.actionText}</span>
            </button>
          ) : specialDay.actionHref ? (
            <Link
              href={specialDay.actionHref}
              className="flex items-center gap-1.5 px-3 py-1 bg-white/15 hover:bg-white/25 text-white font-bold text-xs rounded-full border border-white/20 transition-all hover:scale-105"
            >
              <span>{specialDay.actionText}</span>
              <ArrowRight size={13} />
            </Link>
          ) : (
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-slate-200 border border-white/10">
              {specialDay.badge}
            </span>
          )}

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
