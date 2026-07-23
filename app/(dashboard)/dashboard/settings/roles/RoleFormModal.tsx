import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { X, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Role } from '@/types';

interface RoleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  roleToEdit?: Role | null;
}

const AVAILABLE_PERMISSIONS = {
  'Users & Roles': [
    { id: 'view-users', label: 'View Users' },
    { id: 'create-users', label: 'Create Users' },
    { id: 'edit-users', label: 'Edit Users' },
    { id: 'delete-users', label: 'Delete Users' },
    { id: 'view-roles', label: 'View Roles' },
    { id: 'create-roles', label: 'Create Roles' },
    { id: 'edit-roles', label: 'Edit Roles' },
    { id: 'delete-roles', label: 'Delete Roles' },
  ],
  'Inventory & Items': [
    { id: 'view-items', label: 'View Items' },
    { id: 'create-items', label: 'Create Items' },
    { id: 'edit-items', label: 'Edit Items' },
    { id: 'delete-items', label: 'Delete Items' },
    { id: 'view-categories', label: 'View Categories' },
    { id: 'manage-categories', label: 'Manage Categories' },
    { id: 'view-brands', label: 'View Brands' },
    { id: 'manage-brands', label: 'Manage Brands' },
  ],
  'Purchase & Receiving': [
    { id: 'view-purchase-requests', label: 'View Purchase Requests' },
    { id: 'create-purchase-requests', label: 'Create Purchase Requests' },
    { id: 'edit-purchase-requests', label: 'Edit Purchase Requests' },
    { id: 'approve-purchase-requests', label: 'Approve Purchase Requests' },
    { id: 'delete-purchase-requests', label: 'Delete Purchase Requests' },
    { id: 'view-purchase-orders', label: 'View Purchase Orders' },
    { id: 'create-purchase-orders', label: 'Create Purchase Orders' },
    { id: 'approve-purchase-orders', label: 'Approve Purchase Orders' },
    { id: 'view-grn', label: 'View GRNs' },
    { id: 'create-grn', label: 'Create GRNs' },
    { id: 'approve-grn', label: 'Approve GRNs' },
  ],
  'Stock Operations': [
    { id: 'view-stock-issues', label: 'View Stock Issues' },
    { id: 'create-stock-issues', label: 'Create Stock Issues' },
    { id: 'approve-stock-issues', label: 'Approve Stock Issues' },
    { id: 'view-stock-returns', label: 'View Stock Returns' },
    { id: 'create-stock-returns', label: 'Create Stock Returns' },
    { id: 'view-stock-transfers', label: 'View Stock Transfers' },
    { id: 'create-stock-transfers', label: 'Create Stock Transfers' },
    { id: 'view-stock-adjustments', label: 'View Stock Adjustments' },
    { id: 'create-stock-adjustments', label: 'Create Stock Adjustments' },
  ]
};

export default function RoleFormModal({ isOpen, onClose, roleToEdit }: RoleFormModalProps) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      description: '',
      permissions: [] as string[],
      is_active: true
    }
  });

  const selectedPermissions = watch('permissions');

  useEffect(() => {
    if (isOpen) {
      if (roleToEdit) {
        reset({
          name: roleToEdit.name,
          description: roleToEdit.description || '',
          permissions: roleToEdit.permissions || [],
          is_active: roleToEdit.is_active
        });
      } else {
        reset({
          name: '',
          description: '',
          permissions: [],
          is_active: true
        });
      }
    }
  }, [isOpen, roleToEdit, reset]);

  const togglePermission = (permId: string) => {
    const current = [...selectedPermissions];
    if (current.includes(permId)) {
      setValue('permissions', current.filter(p => p !== permId), { shouldDirty: true });
    } else {
      setValue('permissions', [...current, permId], { shouldDirty: true });
    }
  };

  const selectAllInCategory = (category: string) => {
    const categoryPerms = AVAILABLE_PERMISSIONS[category as keyof typeof AVAILABLE_PERMISSIONS].map(p => p.id);
    const current = new Set(selectedPermissions);
    categoryPerms.forEach(p => current.add(p));
    setValue('permissions', Array.from(current), { shouldDirty: true });
  };

  const deselectAllInCategory = (category: string) => {
    const categoryPerms = AVAILABLE_PERMISSIONS[category as keyof typeof AVAILABLE_PERMISSIONS].map(p => p.id);
    setValue('permissions', selectedPermissions.filter(p => !categoryPerms.includes(p)), { shouldDirty: true });
  };

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (roleToEdit) {
        const { error } = await supabase.from('roles').update({
          name: data.name,
          description: data.description,
          permissions: data.permissions,
          is_active: data.is_active,
          updated_at: new Date().toISOString()
        }).eq('id', roleToEdit.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('roles').insert([{
          name: data.name,
          description: data.description,
          permissions: data.permissions,
          is_active: data.is_active
        }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success(roleToEdit ? 'Role updated successfully' : 'Role created successfully');
      onClose();
    },
    onError: (error: any) => {
      console.error(error);
      toast.error(error.message || 'An error occurred while saving the role');
    }
  });

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">{roleToEdit ? 'Edit Role' : 'Create New Role'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="role-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">Role Name *</label>
                <input 
                  type="text" 
                  {...register('name', { required: 'Role name is required' })} 
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="e.g. Store Manager"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message as string}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select 
                  {...register('is_active')} 
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea 
                  {...register('description')} 
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Brief description of this role's responsibilities"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Permissions</h3>
                <div className="text-sm text-muted-foreground">
                  {selectedPermissions.length} selected
                </div>
              </div>
              
              <div className="space-y-6">
                {Object.entries(AVAILABLE_PERMISSIONS).map(([category, perms]) => {
                  const categoryPermIds = perms.map(p => p.id);
                  const allSelected = categoryPermIds.every(p => selectedPermissions.includes(p));
                  const someSelected = categoryPermIds.some(p => selectedPermissions.includes(p));

                  return (
                    <div key={category} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4 pb-2 border-b">
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            checked={allSelected}
                            ref={input => {
                              if (input) input.indeterminate = !allSelected && someSelected;
                            }}
                            onChange={() => allSelected ? deselectAllInCategory(category) : selectAllInCategory(category)}
                            className="w-4 h-4 text-primary rounded focus:ring-primary"
                          />
                          <h4 className="font-semibold">{category}</h4>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {perms.map(perm => (
                          <label key={perm.id} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-muted/50">
                            <input 
                              type="checkbox" 
                              checked={selectedPermissions.includes(perm.id)}
                              onChange={() => togglePermission(perm.id)}
                              className="w-4 h-4 text-primary rounded focus:ring-primary"
                            />
                            <span className="text-sm select-none">{perm.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </form>
        </div>

        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3 rounded-b-xl">
          <button 
            type="button" 
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-white transition-colors font-medium"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="role-form"
            disabled={mutation.isPending}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-colors font-medium disabled:opacity-50"
          >
            <Save size={18} />
            {mutation.isPending ? 'Saving...' : 'Save Role'}
          </button>
        </div>
      </div>
    </div>
  );
}
