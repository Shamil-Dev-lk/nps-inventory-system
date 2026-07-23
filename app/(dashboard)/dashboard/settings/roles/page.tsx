'use client';
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, RefreshCw, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Role } from '@/types';
import RoleFormModal from './RoleFormModal';
import { useAuthStore } from '@/store/auth-store';

export default function RolesPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuthStore();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [roleToEdit, setRoleToEdit] = useState<Role | null>(null);

  const { data: roles, isLoading, refetch } = useQuery({
    queryKey: ['roles', search],
    queryFn: async () => {
      let query = supabase.from('roles').select('*').order('name');
      if (search) {
        query = query.ilike('name', `%${search}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as Role[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('roles').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role deleted successfully');
    },
    onError: (error: any) => {
      console.error(error);
      toast.error(error.message || 'Failed to delete role');
    }
  });

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete the role "${name}"? This action cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (role: Role) => {
    setRoleToEdit(role);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setRoleToEdit(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-5 max-w-[1600px]">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold">Roles</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage system roles and their permissions</p>
        </div>
        {hasPermission('create-roles') && (
          <button 
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white gov-gradient shadow-sm hover:opacity-90"
          >
            <Plus size={15} /> New Role
          </button>
        )}
      </div>

      <div className="rounded-xl bg-card border border-border p-4 shadow-sm flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
          <input 
            type="search" 
            placeholder="Search roles..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" 
          />
        </div>
        <button onClick={() => refetch()} className="p-2 rounded-lg border border-border hover:bg-muted">
          <RefreshCw size={15} className="text-muted-foreground" />
        </button>
      </div>

      <div className="rounded-xl bg-card border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Role Name</th>
                <th>Description</th>
                <th>Permissions</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({length:3}).map((_, i) => (
                  <tr key={i}>
                    {Array.from({length:5}).map((_, j) => (
                      <td key={j}><div className="shimmer h-4 rounded w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : roles && roles.length > 0 ? (
                roles.map((role) => (
                  <tr key={role.id}>
                    <td className="font-medium">
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={16} className="text-primary/70" />
                        {role.name}
                      </div>
                    </td>
                    <td className="text-sm text-muted-foreground max-w-xs truncate">{role.description || '—'}</td>
                    <td>
                      <span className="inline-flex items-center justify-center bg-secondary/50 text-secondary-foreground text-xs font-medium px-2 py-1 rounded-full border">
                        {role.permissions?.length || 0} permissions
                      </span>
                    </td>
                    <td>
                      <span className={role.is_active ? 'badge-success' : 'badge-gray'}>
                        {role.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        {hasPermission('edit-roles') && (
                          <button 
                            onClick={() => handleEdit(role)}
                            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                            title="Edit Role"
                          >
                            <Edit size={15} />
                          </button>
                        )}
                        {hasPermission('delete-roles') && role.name !== 'Super Admin' && (
                          <button 
                            onClick={() => handleDelete(role.id, role.name)}
                            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-destructive transition-colors"
                            title="Delete Role"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-muted-foreground">
                    No roles found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <RoleFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        roleToEdit={roleToEdit}
      />
    </div>
  );
}