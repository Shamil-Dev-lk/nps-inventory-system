import React from 'react';
import { X, User as UserIcon, Mail, Phone, Briefcase, MapPin, Calendar, Building2, ShieldCheck, Clock, FileText } from 'lucide-react';
import { parseUserReportPermissions, isSuperAdmin, isTrainee, SYSTEM_REPORT_CATEGORIES } from '@/lib/auth/report-permissions';
import { User } from '@/types';

interface UserViewModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function UserViewModal({ user, isOpen, onClose }: UserViewModalProps) {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card w-full max-w-lg rounded-2xl shadow-xl overflow-hidden border border-border animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-4 border-b border-border bg-muted/30">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <UserIcon size={18} className="text-primary" />
            User Details
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
            <X size={18} />
          </button>
        </div>
        
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div>
              <h3 className="text-xl font-bold">{user.name}</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <Briefcase size={14} /> {user.designation || 'No Designation'}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className={user.is_active ? 'badge-success' : 'badge-gray'}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
                <span className="badge-primary">
                  {user.roles?.[0]?.replace(/-/g, ' ') || user.role || 'Staff'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Employee ID</span>
              <p className="text-sm font-medium flex items-center gap-2">
                <ShieldCheck size={14} className="text-muted-foreground" />
                {user.employee_id || 'N/A'}
              </p>
            </div>
            
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Department</span>
              <p className="text-sm font-medium flex items-center gap-2">
                <Building2 size={14} className="text-muted-foreground" />
                {user.department?.name_en || 'Not Assigned'}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Email</span>
              <p className="text-sm font-medium flex items-center gap-2">
                <Mail size={14} className="text-muted-foreground" />
                {user.email || 'N/A'}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Phone</span>
              <p className="text-sm font-medium flex items-center gap-2">
                <Phone size={14} className="text-muted-foreground" />
                {user.phone || 'N/A'}
              </p>
            </div>

            <div className="space-y-1 md:col-span-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Address</span>
              <p className="text-sm font-medium flex gap-2">
                <MapPin size={14} className="text-muted-foreground shrink-0 mt-0.5" />
                {user.address || 'N/A'}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Joining Date</span>
              <p className="text-sm font-medium flex items-center gap-2">
                <Calendar size={14} className="text-muted-foreground" />
                {user.joining_date ? new Date(user.joining_date).toLocaleDateString() : 'N/A'}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Last Login</span>
              <p className="text-sm font-medium flex items-center gap-2">
                <Clock size={14} className="text-muted-foreground" />
                {user.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'Never'}
              </p>
            </div>
          </div>

          {/* Report Access & Permissions Summary */}
          <div className="mt-5 pt-4 border-t border-border space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1.5">
                <FileText size={14} className="text-[#701a2b]" />
                Report Access Permissions
              </span>
              <span className="text-[11px] font-mono text-muted-foreground">
                {isSuperAdmin(user) ? 'Super Admin' : isTrainee(user) ? 'Trainee' : 'Standard'}
              </span>
            </div>

            {isSuperAdmin(user) ? (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                Full Unrestricted Access to all reports, PDF generation, native printing, and Excel exports.
              </div>
            ) : (() => {
              const { pageAccess, categories } = parseUserReportPermissions(user.permissions || []);
              if (!pageAccess) {
                return (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-800 dark:text-rose-300 font-medium">
                    🚫 Reports Page Access Disabled (No report access granted).
                  </div>
                );
              }

              const allowedCats = SYSTEM_REPORT_CATEGORIES.filter(c => categories[c.id]?.view);
              if (allowedCats.length === 0) {
                return (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300 font-medium">
                    ⚠️ Reports Page access enabled, but no individual categories are granted yet.
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {allowedCats.map(cat => {
                    const st = categories[cat.id];
                    const actions = [
                      st.view && 'View',
                      st.pdf && 'PDF',
                      st.print && 'Print',
                      st.excel && 'Excel'
                    ].filter(Boolean);

                    return (
                      <div key={cat.id} className="p-2.5 rounded-lg border border-border bg-muted/40 text-xs space-y-1">
                        <span className="font-semibold text-foreground block">{cat.name}</span>
                        <div className="flex flex-wrap gap-1">
                          {actions.map(a => (
                            <span key={a} className="bg-[#701a2b]/10 text-[#701a2b] dark:text-rose-300 px-1.5 py-0.2 rounded text-[10px] font-bold">
                              {a}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
        
        <div className="p-4 border-t border-border bg-muted/30 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-background border border-input hover:bg-muted transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
