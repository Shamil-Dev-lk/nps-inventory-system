import React from 'react';
import { X, User as UserIcon, Mail, Phone, Briefcase, MapPin, Calendar, Building2, ShieldCheck, Clock } from 'lucide-react';
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
             {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.name} className="w-16 h-16 rounded-full object-cover border-2 border-primary/20" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold uppercase border-2 border-primary/20">
                  {user.name?.charAt(0) || 'U'}
                </div>
             )}
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
