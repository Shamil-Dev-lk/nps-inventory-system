'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { DataTable, Column } from '@/components/ui/data-table';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import { Modal } from '@/components/ui/modal';
import { supabase } from '@/lib/supabase';

interface Project {
  id: number;
  project_code: string;
  name_en: string;
  name_si?: string;
  name_ta?: string;
  description?: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  is_active: boolean;
  created_at: string;
}

type ProjectFormData = Omit<Project, 'id' | 'created_at'>;

export default function ProjectsPage() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProjectFormData>();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Project[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ProjectFormData) => {
      const { error } = await supabase.from('projects').insert([data]);
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project created successfully');
      handleCloseForm();
    },
    onError: () => toast.error('Failed to create project'),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: number; payload: ProjectFormData }) => {
      const { error } = await supabase.from('projects').update(data.payload).eq('id', data.id);
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project updated successfully');
      handleCloseForm();
    },
    onError: () => toast.error('Failed to update project'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project deleted successfully');
      setIsDeleteOpen(false);
      setDeletingProject(null);
    },
    onError: () => toast.error('Failed to delete project'),
  });

  const handleOpenForm = (project?: Project) => {
    if (project) {
      setEditingProject(project);
      reset({
        project_code: project.project_code,
        name_en: project.name_en,
        name_si: project.name_si || '',
        name_ta: project.name_ta || '',
        description: project.description || '',
        status: project.status,
        is_active: project.is_active,
      });
    } else {
      setEditingProject(null);
      reset({
        project_code: '',
        name_en: '',
        name_si: '',
        name_ta: '',
        description: '',
        status: 'planning',
        is_active: true,
      });
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingProject(null);
    reset();
  };

  const onSubmit = (data: ProjectFormData) => {
    if (editingProject) updateMutation.mutate({ id: editingProject.id, payload: data });
    else createMutation.mutate(data);
  };

  const columns: Column<Project>[] = [
    { header: 'Code', accessor: 'project_code', className: 'font-medium' },
    { header: 'Name', accessor: 'name_en' },
    { 
      header: 'Project Status', 
      accessor: (row) => (
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
          row.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
          row.status === 'completed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
          row.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
          'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
        }`}>
          {row.status.replace('_', ' ').toUpperCase()}
        </span>
      ),
    },
    { 
      header: 'Active', 
      accessor: (row) => (
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
          row.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          {row.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full h-[calc(100vh-100px)]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Projects</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage infrastructure and internal projects</p>
      </div>

      <div className="flex-1">
        <DataTable
          data={projects}
          columns={columns}
          isLoading={isLoading}
          keyExtractor={(row) => row.id}
          searchKey="name_en"
          searchPlaceholder="Search projects..."
          addButtonLabel="Add Project"
          onAdd={() => handleOpenForm()}
          onEdit={handleOpenForm}
          onDelete={(row) => { setDeletingProject(row); setIsDeleteOpen(true); }}
        />
      </div>

      <Modal isOpen={isFormOpen} onClose={handleCloseForm} title={editingProject ? 'Edit Project' : 'Add Project'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Project Code *</label>
              <input {...register('project_code', { required: 'Required' })} className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/30" />
              {errors.project_code && <p className="text-xs text-red-500">{errors.project_code.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Name (English) *</label>
              <input {...register('name_en', { required: 'Required' })} className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/30" />
              {errors.name_en && <p className="text-xs text-red-500">{errors.name_en.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Name (Sinhala)</label>
              <input {...register('name_si')} className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/30" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Name (Tamil)</label>
              <input {...register('name_ta')} className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/30" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-sm font-medium">Status *</label>
              <select {...register('status', { required: 'Required' })} className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/30">
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description</label>
            <textarea {...register('description')} rows={3} className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/30" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_active" {...register('is_active')} className="rounded border-input text-primary focus:ring-primary/30" />
            <label htmlFor="is_active" className="text-sm font-medium cursor-pointer">Active</label>
          </div>
          
          <div className="pt-4 flex justify-end gap-3 border-t border-border mt-6">
            <button type="button" onClick={handleCloseForm} className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted">Cancel</button>
            <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50">
              {editingProject ? 'Update Project' : 'Save Project'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDeleteDialog isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} onConfirm={() => deletingProject && deleteMutation.mutate(deletingProject.id)} isLoading={deleteMutation.isPending} title="Delete Project" description={`Are you sure you want to delete "${deletingProject?.name_en}"?`} />
    </div>
  );
}
