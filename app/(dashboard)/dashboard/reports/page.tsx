'use client';

import React from 'react';
import Link from 'next/link';
import {
  FileText,
  Package,
  Receipt,
  PackageMinus,
  AlertTriangle,
  BarChart3,
  ArrowRight,
  ShieldCheck,
  Download,
  Printer,
  FileSpreadsheet,
  Lock,
  Layers,
  Building2
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import {
  SYSTEM_REPORT_CATEGORIES,
  canAccessReportsPage,
  canViewReport,
  canDownloadPdf,
  canPrintReport,
  canExportExcel,
  isTrainee,
  isSuperAdmin
} from '@/lib/auth/report-permissions';
import { ReportAccessDenied } from '@/components/common/ReportAccessDenied';

const ICONS_MAP: Record<string, React.ElementType> = {
  issue: PackageMinus,
  stock: Package,
  'stock-ledger': FileText,
  grn: Receipt,
  'low-stock': AlertTriangle,
  analytics: BarChart3
};

export default function ReportsHubPage() {
  const { user } = useAuthStore();

  // Master check: reports.page.access
  if (!canAccessReportsPage(user)) {
    return (
      <ReportAccessDenied
        reportTitle="Reports Management Hub"
        reportTitleSi="ප්‍රධාන වාර්තා පද්ධතිය"
        requiredPermission="reports.page.access"
      />
    );
  }

  const userIsTrainee = isTrainee(user);
  const userIsSuperAdmin = isSuperAdmin(user);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* ── Official Institutional Header ───────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#701a2b] bg-[#701a2b]/10 px-2.5 py-0.5 rounded border border-[#701a2b]/20">
              රාජ්‍ය ලේඛනාගාරය • Official Audit Records
            </span>
            {userIsTrainee && (
              <span className="text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded">
                Trainee Restricted View
              </span>
            )}
            {userIsSuperAdmin && (
              <span className="text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
                Super Admin Access
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Inventory & Store Reports Directory
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            නිකවැරටිය ප්‍රාදේශීය සභාව — බඩුතොග සහ ගබඩා පාලන නිල වාර්තා ලේඛනාගාරය
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 px-3.5 py-2 rounded-xl border border-border">
          <Building2 size={16} className="text-[#701a2b]" />
          <span>North Western Province • Local Government</span>
        </div>
      </div>

      {/* ── Reports Categories Grid ─────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {SYSTEM_REPORT_CATEGORIES.map((cat) => {
          const hasView = canViewReport(user, cat.id);
          const hasPdf = canDownloadPdf(user, cat.id);
          const hasPrint = canPrintReport(user, cat.id);
          const hasExcel = canExportExcel(user, cat.id);
          const IconComp = ICONS_MAP[cat.id] || FileText;

          return (
            <div
              key={cat.id}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between ${
                hasView
                  ? 'bg-card border-border shadow-sm hover:shadow-md hover:border-[#701a2b]/40'
                  : 'bg-muted/30 border-border/60 opacity-60'
              }`}
            >
              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      hasView
                        ? 'bg-[#701a2b]/10 text-[#701a2b] dark:text-rose-400 border border-[#701a2b]/20'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <IconComp size={24} />
                  </div>

                  {hasView ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300">
                      AUTHORIZED
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 flex items-center gap-1">
                      <Lock size={10} />
                      RESTRICTED
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-foreground text-base">{cat.name}</h3>
                  <p className="text-xs text-[#701a2b] dark:text-rose-400 font-sinhala font-medium">
                    {cat.nameSi}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    {cat.description}
                  </p>
                </div>
              </div>

              {/* Action Capabilities & Navigation Button */}
              <div className="px-5 py-3.5 bg-muted/20 border-t border-border flex items-center justify-between gap-2">
                {/* Permitted Action Badges */}
                <div className="flex items-center gap-1.5">
                  <span
                    className={`p-1.5 rounded-md text-[10px] font-bold flex items-center gap-1 ${
                      hasPdf
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        : 'bg-muted text-muted-foreground/40'
                    }`}
                    title={hasPdf ? 'PDF Download Allowed' : 'PDF Download Disabled'}
                  >
                    <Download size={11} />
                    <span>PDF</span>
                  </span>

                  <span
                    className={`p-1.5 rounded-md text-[10px] font-bold flex items-center gap-1 ${
                      hasPrint
                        ? 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                        : 'bg-muted text-muted-foreground/40'
                    }`}
                    title={hasPrint ? 'Native Print Allowed' : 'Native Print Disabled'}
                  >
                    <Printer size={11} />
                    <span>Print</span>
                  </span>

                  <span
                    className={`p-1.5 rounded-md text-[10px] font-bold flex items-center gap-1 ${
                      hasExcel
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-muted text-muted-foreground/40'
                    }`}
                    title={hasExcel ? 'Excel Export Allowed' : 'Excel Export Disabled'}
                  >
                    <FileSpreadsheet size={11} />
                    <span>Excel</span>
                  </span>
                </div>

                {/* Open Link */}
                {hasView ? (
                  <Link
                    href={cat.path}
                    className="flex items-center gap-1.5 text-xs font-bold text-[#701a2b] dark:text-rose-400 hover:underline"
                  >
                    <span>Open Report</span>
                    <ArrowRight size={13} />
                  </Link>
                ) : (
                  <span className="text-[11px] text-muted-foreground italic flex items-center gap-1">
                    <Lock size={12} />
                    No Access
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
