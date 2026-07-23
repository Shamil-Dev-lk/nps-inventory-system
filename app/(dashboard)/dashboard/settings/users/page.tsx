'use client';
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, RefreshCw, Shield, UserCheck, UserX } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth-store';

export default function UsersPage() {
  const qc = useQueryClient();
  const { hasPermission } = useAuthStore();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['users', page, search],
    queryFn: async () => {
      let query = supabase
        .from('users')
        .select('*, department:departments(id, name_en)', { count: 'exact' });

      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,employee_id.ilike.%${search}%`);
      }

      const perPage = 20;
      const from = (page - 1) * perPage;
      const to = from + perPage - 1;
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data: rawUsers, error, count } = await query;
      if (error) throw error;

      return {
        data: rawUsers || [],
        meta: {
          total: count || 0,
          from: from + 1,
          to: Math.min(from + perPage, count || 0),
          last_page: Math.ceil((count || 0) / perPage),
        }
      };
    },
  });
  const toggleMutation = useMutation({
    mutationFn: async (id: number | string) => {
      const { data: user, error: fetchErr } = await supabase.from('users').select('is_active').eq('id', id).single();
      if (fetchErr) throw fetchErr;
      const { error } = await supabase.from('users').update({ is_active: !user.is_active }).eq('id', id);
      if (error) throw error;
      return true;
    },
    onSuccess: () => { toast.success('User status updated.'); qc.invalidateQueries({ queryKey: ['users'] }); },
    onError: (err: any) => toast.error(err.message || 'Failed to update status.'),
  });
  const deleteMutation = useMutation({
    mutationFn: async (id: number | string) => {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) throw error;
      return true;
    },
    onSuccess: () => { toast.success('User deleted.'); qc.invalidateQueries({ queryKey: ['users'] }); },
    onError: (err: any) => toast.error(err.message || 'Delete failed.'),
  });

  const migrateMutation = useMutation({
    mutationFn: async () => {
      const localData = localStorage.getItem('users');
      if (!localData) throw new Error('No old users found in your browser storage.');
      
      const oldUsers = JSON.parse(localData);
      if (!Array.isArray(oldUsers) || oldUsers.length === 0) throw new Error('No old users found.');

      // Format users for Supabase
      const formattedUsers = oldUsers.map(u => ({
        name: u.name || 'Unknown',
        email: u.email || `${Math.random().toString(36).substring(7)}@example.com`,
        employee_id: u.employee_id || null,
        designation: u.designation || null,
        phone: u.phone || null,
        is_active: u.status === 'active' || u.is_active !== false,
        created_at: u.created_at || new Date().toISOString(),
        role: u.role || 'staff',
      }));

      const { error } = await supabase.from('users').insert(formattedUsers);
      if (error) throw error;
      
      // Optionally remove them from localStorage so we don't migrate twice
      localStorage.removeItem('users');
      return formattedUsers.length;
    },
    onSuccess: (count) => {
      toast.success(`Successfully migrated ${count} old user(s)!`);
      qc.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: any) => {
      console.error(err);
      toast.error(err.message || 'Migration failed. Make sure you ran the SQL scripts.');
    }
  });

  const users = data?.data || [];
  const meta = data?.meta;
  const roleColors: Record<string,string> = {'super-admin':'badge-danger','store-keeper':'badge-success','secretary':'badge-info','chairman':'badge-warning'};
  return (
    <div className="space-y-5 max-w-[1600px]">
      <div className="page-header flex justify-between items-center">
        <div><h1 className="text-2xl font-bold">User Management</h1><p className="text-sm text-muted-foreground mt-1">Manage system users, roles, and access control</p></div>
        <div className="flex gap-2">
          <button 
            onClick={() => migrateMutation.mutate()} 
            disabled={migrateMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border hover:bg-muted shadow-sm transition-colors disabled:opacity-50"
          >
            <RefreshCw size={15} className={migrateMutation.isPending ? "animate-spin" : ""} /> 
            {migrateMutation.isPending ? 'Migrating...' : 'Migrate Old Users'}
          </button>
          
          {hasPermission('manage-users') && (
            <Link href="/dashboard/settings/users/new" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white gov-gradient shadow-sm hover:opacity-90">
              <Plus size={15} /> Add User
            </Link>
          )}
        </div>
      </div>
      <div className="rounded-xl bg-card border border-border p-4 shadow-sm flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
          <input type="search" placeholder="Search user name, email, or ID..." value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <button onClick={()=>refetch()} className="p-2 rounded-lg border border-border hover:bg-muted"><RefreshCw size={15} className="text-muted-foreground" /></button>
      </div>
      <div className="rounded-xl bg-card border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Employee ID</th><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Last Login</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
            <tbody>
              {isLoading ? Array.from({length:6}).map((_,i) => <tr key={i}>{Array.from({length:8}).map((_,j) => <td key={j}><div className="shimmer h-3.5 rounded w-full max-w-[80px]" /></td>)}</tr>) :
              users.map((u:any) => (
                <tr key={u.id}>
                  <td><code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{u.employee_id||'—'}</code></td>
                  <td>
                    <div className="flex items-center gap-2">
                      <img src={u.avatar_url} alt={u.name} className="w-7 h-7 rounded-full object-cover" />
                      <div><p className="text-sm font-medium">{u.name}</p>{u.designation&&<p className="text-xs text-muted-foreground">{u.designation}</p>}</div>
                    </div>
                  </td>
                  <td className="text-sm text-muted-foreground">{u.email}</td>
                  <td><span className={`${roleColors[u.roles?.[0]] || 'badge-gray'} text-xs`}>{u.roles?.[0]?.replace(/-/g,' ')||'—'}</span></td>
                  <td className="text-sm text-muted-foreground">{u.department?.name_en||'—'}</td>
                  <td className="text-xs text-muted-foreground">{u.last_login_at?new Date(u.last_login_at).toLocaleDateString('en-LK'):'Never'}</td>
                  <td><span className={u.is_active?'badge-success':'badge-gray'}>{u.is_active?'Active':'Inactive'}</span></td>
                  <td><div className="flex items-center justify-end gap-1">
                    {hasPermission('manage-users') && (<>
                      <Link href={`/dashboard/settings/users/${u.id}/edit`} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-blue-500 transition-colors"><Edit size={15}/></Link>
                      <button onClick={()=>toggleMutation.mutate(u.id)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-amber-500 transition-colors" title={u.is_active?'Deactivate':'Activate'}>
                        {u.is_active?<UserX size={15}/>:<UserCheck size={15}/>}
                      </button>
                      <button onClick={()=>{if(confirm('Delete this user?')) deleteMutation.mutate(u.id);}} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-500 transition-colors"><Trash2 size={15}/></button>
                    </>)}
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!isLoading && users.length === 0 && <div className="text-center py-16"><p className="text-muted-foreground">No users found</p></div>}
      </div>
    </div>
  );
}