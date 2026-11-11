'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Unlock,
  CheckSquare,
  Square,
  FileText,
  Printer,
  Download,
  FileSpreadsheet,
  Save,
  Loader2,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  User as UserIcon,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import {
  SYSTEM_REPORT_CATEGORIES,
  REPORT_PAGE_ACCESS_PERMISSION,
  parseUserReportPermissions,
  buildUpdatedPermissions,
  isTrainee,
  isSuperAdmin
} from '@/lib/auth/report-permissions';

interface ReportPermissionsManagerProps {
  user: {
    id: number | string;
    name?: string;
    email?: string;
    role?: string;
    roles?: string[];
    designation?: string;
    permissions?: string[];
  };
  onSaved?: (updatedPermissions: string[]) => void;
  isInline?: boolean; // when embedded in a form page rather than a standalone modal
}

export function ReportPermissionsManager({
  user,
  onSaved,
  isInline = false
}: ReportPermissionsManagerProps) {
  const [isSaving, setIsSaving] = useState(false);

  // Initialize state from user's current permissions
  const [pageAccess, setPageAccess] = useState(false);
  const [categories, setCategories] = useState<
    Record<string, { view: boolean; pdf: boolean; print: boolean; excel: boolean }>
  >({});

  useEffect(() => {
    if (user?.permissions) {
      const parsed = parseUserReportPermissions(user.permissions);
      setPageAccess(parsed.pageAccess);
      setCategories(parsed.categories);
    } else {
      setPageAccess(false);
      const emptyCats: Record<string, { view: boolean; pdf: boolean; print: boolean; excel: boolean }> = {};
      for (const cat of SYSTEM_REPORT_CATEGORIES) {
        emptyCats[cat.id] = { view: false, pdf: false, print: false, excel: false };
      }
      setCategories(emptyCats);
    }
  }, [user]);

  const userIsTrainee = isTrainee(user);
  const userIsSuperAdmin = isSuperAdmin(user);

  // Toggle master reports page access
  const handleTogglePageAccess = () => {
    const nextVal = !pageAccess;
    setPageAccess(nextVal);
    if (!nextVal) {
      // If master access is turned off, disable all report actions
      const updated: Record<string, { view: boolean; pdf: boolean; print: boolean; excel: boolean }> = {};
      for (const cat of SYSTEM_REPORT_CATEGORIES) {
        updated[cat.id] = { view: false, pdf: false, print: false, excel: false };
      }
      setCategories(updated);
    } else {
      // If toggled on and no report is selected, enable view for Issue and Stock by default
      if (Object.values(categories).every(c => !c.view)) {
        setCategories(prev => ({
          ...prev,
          issue: { ...prev.issue, view: true },
          stock: { ...prev.stock, view: true },
        }));
      }
    }
  };

  // Toggle specific action for a category
  const handleToggleAction = (categoryId: string, action: 'view' | 'pdf' | 'print' | 'excel') => {
    if (!pageAccess) {
      toast.error('Please enable Reports Page Access first.');
      return;
    }

    setCategories(prev => {
      const current = prev[categoryId] || { view: false, pdf: false, print: false, excel: false };
      const nextVal = !current[action];
      const updatedCat = { ...current, [action]: nextVal };

      // If granting pdf, print, or excel, automatically ensure 'view' is also granted
      if (nextVal && action !== 'view') {
        updatedCat.view = true;
      }
      // If revoking 'view', automatically revoke pdf, print, and excel
      if (!nextVal && action === 'view') {
        updatedCat.pdf = false;
        updatedCat.print = false;
        updatedCat.excel = false;
      }

      return { ...prev, [categoryId]: updatedCat };
    });
  };

  // Toggle all actions for a category
  const handleToggleCategoryAll = (categoryId: string) => {
    if (!pageAccess) {
      setPageAccess(true);
    }
    const current = categories[categoryId] || { view: false, pdf: false, print: false, excel: false };
    const allSelected = current.view && current.pdf && current.print && current.excel;
    setCategories(prev => ({
      ...prev,
      [categoryId]: {
        view: !allSelected,
        pdf: !allSelected,
        print: !allSelected,
        excel: !allSelected,
      }
    }));
  };

  // Presets
  const applyPreset = (preset: 'all' | 'view_only' | 'trainee_default' | 'clear') => {
    if (preset === 'clear') {
      setPageAccess(false);
      const cleared: Record<string, { view: boolean; pdf: boolean; print: boolean; excel: boolean }> = {};
      for (const cat of SYSTEM_REPORT_CATEGORIES) {
        cleared[cat.id] = { view: false, pdf: false, print: false, excel: false };
      }
      setCategories(cleared);
      toast.info('Cleared all report permissions.');
      return;
    }

    setPageAccess(true);
    const updated: Record<string, { view: boolean; pdf: boolean; print: boolean; excel: boolean }> = {};

    if (preset === 'all') {
      for (const cat of SYSTEM_REPORT_CATEGORIES) {
        updated[cat.id] = { view: true, pdf: true, print: true, excel: true };
      }
      toast.success('Granted full report permissions across all categories.');
    } else if (preset === 'view_only') {
      for (const cat of SYSTEM_REPORT_CATEGORIES) {
        updated[cat.id] = { view: true, pdf: false, print: false, excel: false };
      }
      toast.info('Applied View-Only permissions across all reports.');
    } else if (preset === 'trainee_default') {
      // Trainee Default: Issue Reports (View + PDF), Current Stock (View Only), All others disabled
      for (const cat of SYSTEM_REPORT_CATEGORIES) {
        if (cat.id === 'issue') {
          updated[cat.id] = { view: true, pdf: true, print: false, excel: false };
        } else if (cat.id === 'stock') {
          updated[cat.id] = { view: true, pdf: false, print: false, excel: false };
        } else {
          updated[cat.id] = { view: false, pdf: false, print: false, excel: false };
        }
      }
      toast.success('Applied Trainee Restricted Preset: Issue (View+PDF), Stock (View only).');
    }

    setCategories(updated);
  };

  // Save handler
  const handleSave = async () => {
    setIsSaving(true);
    const toastId = toast.loading(`Saving report permissions for ${user.name || user.email}...`);

    try {
      const updatedPermissions = buildUpdatedPermissions(
        user.permissions || [],
        pageAccess,
        categories
      );

      // Persist to Supabase users table
      const { error } = await supabase
        .from('users')
        .update({
          permissions: updatedPermissions,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      // Log to audit log if possible
      try {
        const auditPayload = {
          user_name: 'Admin',
          user_role: 'Super Admin',
          action: 'UPDATE',
          module: 'User Permissions',
          details: `Updated granular report permissions for user ${user.name} (${user.email}). Reports Page Access: ${pageAccess ? 'ENABLED' : 'DISABLED'}.`,
          timestamp: new Date().toISOString()
        };
        await supabase.from('audit_logs').insert([auditPayload]);
      } catch {
        // Silently continue if audit_logs table does not exist
      }

      toast.success(`Report permissions updated successfully for ${user.name || user.email}!`, { id: toastId });
      if (onSaved) onSaved(updatedPermissions);
    } catch (err: any) {
      console.error('Error saving report permissions:', err);
      toast.error(err.message || 'Failed to save report permissions.', { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  // Summary counts
  const totalReportsGranted = Object.values(categories).filter(c => c.view).length;
  const totalActionsGranted = Object.values(categories).reduce((sum, c) => {
    return sum + (c.view ? 1 : 0) + (c.pdf ? 1 : 0) + (c.print ? 1 : 0) + (c.excel ? 1 : 0);
  }, 0);

  return (
    <div className={`space-y-5 ${isInline ? '' : 'p-1'}`}>
      {/* ── Trainee Notice / Role Info Banner ────────────────────────── */}
      <div className="rounded-xl border border-border bg-muted/40 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#701a2b]/10 text-[#701a2b] dark:text-rose-400 border border-[#701a2b]/20 flex items-center justify-center font-bold shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground text-sm">{user.name || 'User'}</span>
              <span className="text-xs font-mono text-muted-foreground">({user.email})</span>
              {userIsTrainee && (
                <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Trainee Account
                </span>
              )}
              {userIsSuperAdmin && (
                <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Super Admin (Unrestricted)
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Role: <strong className="text-foreground">{user.roles?.[0] || user.role || 'Staff'}</strong>
              {user.designation ? ` • Designation: ${user.designation}` : ''}
            </p>
          </div>
        </div>

        {userIsTrainee && (
          <div className="text-xs bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800/50 rounded-lg p-2.5 max-w-sm">
            <span className="font-semibold block mb-0.5">⚠️ Trainee Isolation Policy:</span>
            Trainee accounts have zero report access by default. Explicitly grant individual categories and actions below.
          </div>
        )}
      </div>

      {/* ── 1. Master Switch: Reports Page Access ────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="text-base font-bold text-foreground">
                1. Reports Page Access (ප්‍රධාන වාර්තා පිටු අවසරය)
              </span>
              <code className="text-xs bg-muted text-foreground px-2 py-0.5 rounded font-mono border border-border">
                {REPORT_PAGE_ACCESS_PERMISSION}
              </code>
            </div>
            <p className="text-xs text-muted-foreground max-w-xl">
              Controls whether this user can navigate to the Reports module in the sidebar and access the Reports Hub. If disabled, all report URLs will be completely blocked.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                pageAccess
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300'
              }`}
            >
              {pageAccess ? 'ACCESS GRANTED' : 'ACCESS DISABLED'}
            </span>

            <button
              type="button"
              onClick={handleTogglePageAccess}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#701a2b] ${
                pageAccess ? 'bg-[#701a2b]' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  pageAccess ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Quick Presets Bar */}
        <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-muted-foreground font-medium flex items-center gap-1.5">
            <Sparkles size={13} className="text-[#701a2b]" />
            Quick Presets:
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => applyPreset('trainee_default')}
              className="px-2.5 py-1 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700 text-xs font-medium hover:opacity-90"
            >
              Trainee Preset (Issue PDF + Stock View)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('view_only')}
              className="px-2.5 py-1 rounded-lg border border-border bg-muted/60 hover:bg-muted text-xs font-medium"
            >
              View-Only All
            </button>
            <button
              type="button"
              onClick={() => applyPreset('all')}
              className="px-2.5 py-1 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700 text-xs font-medium"
            >
              Full Access (All Reports & Actions)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('clear')}
              className="px-2.5 py-1 rounded-lg border border-border bg-card hover:bg-muted text-rose-600 text-xs font-medium"
            >
              Revoke All
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. Granular Report Category & Action Permissions Matrix ── */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/30 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <FileText size={16} className="text-[#701a2b]" />
              2. Individual Report Categories & Action Permissions
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Authorize specific reports and independent actions (View, PDF Download, Native Print, Excel Export).
            </p>
          </div>

          <div className="text-xs bg-muted px-2.5 py-1 rounded-full font-mono text-muted-foreground">
            Active: <strong className="text-foreground">{totalReportsGranted}/6</strong> Reports • <strong className="text-foreground">{totalActionsGranted}</strong> Total Capabilities
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border font-semibold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 w-[38%]">Report Category (වාර්තා වර්ගය)</th>
                <th className="py-3 px-3 text-center w-[15%]">
                  <span className="flex items-center justify-center gap-1">
                    <FileText size={13} className="text-blue-600" />
                    View Report
                  </span>
                </th>
                <th className="py-3 px-3 text-center w-[15%]">
                  <span className="flex items-center justify-center gap-1">
                    <Download size={13} className="text-rose-600" />
                    Download PDF
                  </span>
                </th>
                <th className="py-3 px-3 text-center w-[15%]">
                  <span className="flex items-center justify-center gap-1">
                    <Printer size={13} className="text-slate-600 dark:text-slate-300" />
                    Print Report
                  </span>
                </th>
                <th className="py-3 px-3 text-center w-[15%]">
                  <span className="flex items-center justify-center gap-1">
                    <FileSpreadsheet size={13} className="text-emerald-600" />
                    Export Excel
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {SYSTEM_REPORT_CATEGORIES.map(cat => {
                const catState = categories[cat.id] || { view: false, pdf: false, print: false, excel: false };
                const isCatActive = catState.view;

                return (
                  <tr
                    key={cat.id}
                    className={`transition-colors ${
                      isCatActive
                        ? 'bg-[#701a2b]/[0.02] hover:bg-muted/40'
                        : 'opacity-70 hover:opacity-100 hover:bg-muted/20'
                    }`}
                  >
                    {/* Category Title & Quick Toggle */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-start gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleToggleCategoryAll(cat.id)}
                          className="mt-0.5 text-muted-foreground hover:text-[#701a2b] transition-colors"
                          title="Toggle all permissions for this report"
                        >
                          {catState.view && catState.pdf && catState.print && catState.excel ? (
                            <CheckSquare size={16} className="text-[#701a2b]" />
                          ) : (
                            <Square size={16} />
                          )}
                        </button>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground text-sm">{cat.name}</span>
                            <span className="text-[11px] text-muted-foreground font-sinhala">({cat.nameSi})</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                            {cat.description}
                          </p>
                          <div className="mt-1 flex items-center gap-1.5 font-mono text-[10px] text-slate-500">
                            <span>Route: {cat.path}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* View Permission */}
                    <td className="py-3 px-3 text-center">
                      <label className="inline-flex items-center justify-center cursor-pointer p-1">
                        <input
                          type="checkbox"
                          checked={catState.view}
                          onChange={() => handleToggleAction(cat.id, 'view')}
                          className="w-4 h-4 rounded text-[#701a2b] focus:ring-[#701a2b] border-border"
                        />
                      </label>
                    </td>

                    {/* PDF Permission */}
                    <td className="py-3 px-3 text-center">
                      <label className={`inline-flex items-center justify-center p-1 ${catState.view ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}`}>
                        <input
                          type="checkbox"
                          disabled={!catState.view}
                          checked={catState.pdf}
                          onChange={() => handleToggleAction(cat.id, 'pdf')}
                          className="w-4 h-4 rounded text-[#701a2b] focus:ring-[#701a2b] border-border"
                        />
                      </label>
                    </td>

                    {/* Print Permission */}
                    <td className="py-3 px-3 text-center">
                      <label className={`inline-flex items-center justify-center p-1 ${catState.view ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}`}>
                        <input
                          type="checkbox"
                          disabled={!catState.view}
                          checked={catState.print}
                          onChange={() => handleToggleAction(cat.id, 'print')}
                          className="w-4 h-4 rounded text-[#701a2b] focus:ring-[#701a2b] border-border"
                        />
                      </label>
                    </td>

                    {/* Excel Permission */}
                    <td className="py-3 px-3 text-center">
                      <label className={`inline-flex items-center justify-center p-1 ${catState.view ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}`}>
                        <input
                          type="checkbox"
                          disabled={!catState.view}
                          checked={catState.excel}
                          onChange={() => handleToggleAction(cat.id, 'excel')}
                          className="w-4 h-4 rounded text-[#701a2b] focus:ring-[#701a2b] border-border"
                        />
                      </label>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Matrix Footer Notes */}
        <div className="p-3 bg-muted/20 border-t border-border flex flex-wrap items-center justify-between text-[11px] text-muted-foreground gap-2">
          <span>
            ℹ️ Note: Granting Download PDF, Print, or Export Excel automatically enables View Report access for that category.
          </span>
          <span className="font-mono text-[10px]">
            Security Standard: ISO 27001 Granular ACL
          </span>
        </div>
      </div>

      {/* ── Save Action Button ───────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-muted-foreground">
          Permissions will take effect on the user&apos;s next request or navigation.
        </p>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#701a2b] text-white hover:bg-[#852033] font-semibold text-sm shadow-md transition-all disabled:opacity-50"
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          <span>Save Report Permissions</span>
        </button>
      </div>
    </div>
  );
}
