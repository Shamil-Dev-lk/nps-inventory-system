'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, LayoutDashboard, FileText, Lock } from 'lucide-react';

interface ReportAccessDeniedProps {
  reportTitle?: string;
  reportTitleSi?: string;
  requiredPermission?: string;
}

export function ReportAccessDenied({
  reportTitle = 'Report',
  reportTitleSi = 'වාර්තාව',
  requiredPermission = 'reports.page.access'
}: ReportAccessDeniedProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-lg text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert size={32} />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#701a2b] bg-[#701a2b]/10 px-3 py-1 rounded-full border border-[#701a2b]/20">
            අවසර සීමා කර ඇත • Access Restricted
          </span>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground pt-1">
            වාර්තා ප්‍රවේශය සීමා කර ඇත
          </h1>
          <p className="text-sm font-semibold text-muted-foreground">
            You do not have permission to view {reportTitle} ({reportTitleSi}).
          </p>
        </div>

        <div className="bg-muted/50 rounded-xl p-4 border border-border text-xs text-muted-foreground text-left space-y-2">
          <div className="flex items-center gap-2 text-foreground font-medium">
            <Lock size={14} className="text-[#701a2b]" />
            <span>Administrative Security Policy</span>
          </div>
          <p>
            Under the Nikaweratiya Pradeshiya Sabha internal audit control standards, report access must be explicitly authorized by a System Administrator.
          </p>
          <div className="font-mono text-[11px] bg-background px-2.5 py-1 rounded border border-border inline-block">
            Required Permission: <code>{requiredPermission}</code>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-sm font-medium transition-colors shadow-sm"
          >
            <LayoutDashboard size={16} />
            <span>Go to Dashboard</span>
          </Link>
          <Link
            href="/dashboard/reports"
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#701a2b] text-white hover:bg-[#852033] text-sm font-medium transition-colors shadow-sm"
          >
            <FileText size={16} />
            <span>Reports Directory</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
