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

      <div
        className="bg-[#0f172a] text-white px-4 py-2.5 shadow-lg flex items-center justify-between gap-3 text-xs sm:text-sm border-b border-white/10 relative overflow-hidden shrink-0 print:hidden"
        style={{
          background: (() => {
            if (specialDay.id === 'photography_day') return 'linear-gradient(to right, #0f172a, #31103f, #0f172a)';
            if (specialDay.id === 'daily_excellence') return 'linear-gradient(to right, #0f172a, #1e1b4b, #0f172a)';
            if (specialDay.id === 'sl_independence' || specialDay.id === 'avurudu') return 'linear-gradient(to right, #451a03, #7f1d1d, #064e3b)';
            if (specialDay.id === 'new_year' || specialDay.id === 'happiness_day') return 'linear-gradient(to right, #451a03, #581c87, #0f172a)';
            return 'linear-gradient(to right, #0f172a, #1e1b4b, #31103f)';
          })()
        }}
      >
        {/* Ring background */}
        <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full border-4 border-white/5 pointer-events-none" />

        <div className="flex items-center gap-2.5 truncate">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-white font-bold"
            style={{ background: `${specialDay.accentColor || '#f59e0b'}30`, border: `1px solid ${specialDay.accentColor || '#f59e0b'}50` }}
          >
            <span className="text-base">{specialDay.emoji}</span>
          </div>
          <div className="truncate">
            <span className="font-extrabold text-amber-300 drop-shadow-sm mr-2">
              {specialDay.title}
            </span>
            <span className="hidden md:inline text-slate-200">
              | {specialDay.subtitle}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {specialDay.interactiveType === 'photography' ? (
            <button
              type="button"
              onClick={handleAction}
              className="flex items-center gap-1.5 px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs rounded-full shadow-md transition-all hover:scale-105 active:scale-95"
            >
              <Aperture size={14} />
              <span>{specialDay.actionText}</span>
            </button>
          ) : specialDay.actionHref ? (
            <Link
              href={specialDay.actionHref}
              className="flex items-center gap-1.5 px-3.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-full shadow-md transition-all hover:scale-105"
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
