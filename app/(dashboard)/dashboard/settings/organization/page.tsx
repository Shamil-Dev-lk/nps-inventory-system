'use client';
import React, { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Save, Building2, Globe, Palette, Bell, Bot, Loader2, Upload, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth-store';
import { useOrgStore } from '@/store/org-store';
import { applyThemeVars } from '@/components/theme-setter';
import { useTheme } from 'next-themes';

import { StickerEngine } from '@/components/print/StickerEngine';
import { DedicatedPrintReceiptPage } from '../../receipts/print/page';

const orgSchema = z.object({
  name_en: z.string().min(1, 'Name is required'),
  name_si: z.string().optional(),
  name_ta: z.string().optional(),
  short_name: z.string().optional(),
  district: z.string().optional(),
  province: z.string().optional(),
  address: z.string().optional(),
  telephone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  website: z.string().optional(),
  chairman_name: z.string().optional(),
  secretary_name: z.string().optional(),
  primary_color: z.string().optional(),
  secondary_color: z.string().optional(),
  accent_color: z.string().optional(),
  currency: z.string().optional(),
  currency_symbol: z.string().optional(),
  default_language: z.string().optional(),
  date_format: z.string().optional(),
  enable_ai_features: z.boolean().optional(),
  enable_email_notifications: z.boolean().optional(),
  system_name: z.string().min(1, 'System Name is required'),
  system_subtitle: z.string().optional(),
  footer_text: z.string().optional(),
  footer_color: z.string().optional(),
  footer_size: z.string().optional(),
  footer_font: z.string().optional(),
  print_settings: z.any().optional(),
});
type OrgForm = z.infer<typeof orgSchema>;

export default function OrganizationSettingsPage() {
  const qc = useQueryClient();
  const { hasPermission } = useAuthStore();
  const { setOrg } = useOrgStore();
  const { resolvedTheme } = useTheme();
  const canEdit = hasPermission('manage-settings');

  const { data, isLoading } = useQuery({
    queryKey: ['organization'],
    queryFn: async () => {
      const { data, error } = await supabase.from('organizations').select('*').single();
      if (error) {
        const { data: list, error: err2 } = await supabase.from('organizations').select('*');
        if (err2) throw err2;
        return list?.[0] || null;
      }
      return data;
    },
  });

  const form = useForm<OrgForm>({ resolver: zodResolver(orgSchema) });

  useEffect(() => {
    if (data) { 
      // Convert nulls to empty strings to satisfy Zod validation and React controlled inputs
      const sanitizedData = Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, v === null ? '' : v])
      );
      form.reset({ 
        ...sanitizedData, 
        enable_ai_features: data.enable_ai_features || false, 
        enable_email_notifications: data.enable_email_notifications || false 
      }); 
    }
  }, [data, form]);

  const mutation = useMutation({
    mutationFn: async (d: OrgForm) => {
      if (data?.id) {
        const { data: updated, error } = await supabase.from('organizations').update(d).eq('id', data.id).select().single();
        if (error) throw error;
        return updated;
      } else {
        const { data: inserted, error } = await supabase.from('organizations').insert([d]).select().single();
        if (error) throw error;
        return inserted;
      }
    },
    onSuccess: (res) => { toast.success('Organization settings saved.'); qc.invalidateQueries({ queryKey: ['organization'] }); setOrg(res); },
    onError: (err: any) => toast.error(err.message || 'Failed to save settings.'),
  });

  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage.from('logos').upload(fileName, file);
      if (error) {
        const mockUrl = URL.createObjectURL(file);
        if (data?.id) {
          await supabase.from('organizations').update({ official_logo_url: mockUrl }).eq('id', data.id);
        }
        return mockUrl;
      }
      const { data: publicUrlData } = supabase.storage.from('logos').getPublicUrl(fileName);
      const logoUrl = publicUrlData?.publicUrl;
      if (data?.id && logoUrl) {
        await supabase.from('organizations').update({ official_logo_url: logoUrl }).eq('id', data.id);
      }
      return logoUrl;
    },
    onSuccess: () => {
      toast.success('Logo uploaded successfully');
      qc.invalidateQueries({ queryKey: ['organization'] }).then(async () => {
        const { data: updatedOrg } = await supabase.from('organizations').select('*').limit(1).single();
        if (updatedOrg) setOrg(updatedOrg);
      });
    },
    onError: (err: any) => toast.error(err.message || 'Failed to upload logo'),
  });

  const onSubmit = (d: OrgForm) => mutation.mutate(d);
  const onError = (errors: any) => {
    const firstError = Object.values(errors)[0] as any;
    if (firstError?.message) {
      toast.error(`Validation Error: ${firstError.message}`);
    } else {
      toast.error('Please check all tabs for missing fields.');
    }
  };

  const [tab, setTab] = React.useState('general');
  const [previewType, setPreviewType] = React.useState<'receipt' | 'sticker' | 'barcode' | 'qr'>('receipt');

  if (isLoading) return <div className="space-y-4">{Array.from({length:4}).map((_,i)=><div key={i} className="shimmer h-40 rounded-xl"/>)}</div>;

  const tabs = [
    {key:'general',label:'General',icon:Building2},
    {key:'print',label:'Documents & Print',icon:FileText},
    {key:'appearance',label:'Appearance',icon:Palette},
    {key:'notifications',label:'Notifications',icon:Bell},
    {key:'ai',label:'AI & Features',icon:Bot},
  ];

  return (
    <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-5 max-w-4xl">
      <div className="page-header">
        <div><h1 className="text-2xl font-bold">Organization Settings</h1><p className="text-sm text-muted-foreground mt-1">Configure your Pradeshiya Sabha profile and system preferences</p></div>
        <div className="flex flex-col items-end gap-2">
          {canEdit && (
            <button type="submit" disabled={mutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white gov-gradient hover:opacity-90 disabled:opacity-60 shadow-sm">
              {mutation.isPending?<Loader2 size={15} className="animate-spin"/>:<Save size={15}/>}
              {mutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          )}
          {Object.keys(form.formState.errors).length > 0 && (
            <span className="text-xs text-red-500">Errors: {JSON.stringify(Object.keys(form.formState.errors))}</span>
          )}
        </div>
      </div>

      <div className="flex gap-1 border-b border-border">
        {tabs.map(t => (
          <button key={t.key} type="button" onClick={()=>setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab===t.key?'border-primary text-primary':'border-transparent text-muted-foreground hover:text-foreground'}`}>
            <t.icon size={15}/>{t.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl bg-card border border-border p-6 shadow-sm">
        {tab === 'general' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
              {name:'name_en',label:'Organization Name (English)',required:true},
              {name:'name_si',label:'Organization Name (Sinhala)'},
              {name:'name_ta',label:'Organization Name (Tamil)'},
              {name:'short_name',label:'Short Name / Abbreviation',required:true},
              {name:'system_name',label:'Application Name (Sidebar & Header)',required:true},
              {name:'telephone',label:'Telephone'},
              {name:'email',label:'Email'},
              {name:'website',label:'Website'},
              {name:'district',label:'District',required:true},
              {name:'province',label:'Province',required:true},
              {name:'chairman_name',label:'Chairman Name'},
              {name:'secretary_name',label:'Secretary Name'},
            ].map(f => (
              <div key={f.name} className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">{f.label}{f.required&&<span className="text-destructive ml-0.5">*</span>}</label>
                <input {...form.register(f.name as keyof OrgForm)} disabled={!canEdit}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60 disabled:bg-muted" />
              </div>
            ))}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-sm font-medium text-foreground">Address</label>
              <textarea {...form.register('address')} disabled={!canEdit} rows={2}
                className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60 resize-none" />
            </div>
          </div>
          </div>
        )}
        {tab === 'print' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex flex-col gap-4 items-start p-4 bg-muted/30 rounded-xl border border-border">
                <div className="flex gap-4 w-full">
                  <div className="w-24 h-24 shrink-0 bg-white rounded-full p-2 flex items-center justify-center border border-border shadow-sm overflow-hidden">
                    <img src={data?.official_logo_url || '/nps-inventory-system/logo.png'} alt="Logo" className="w-full h-full object-contain mix-blend-multiply" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="font-semibold text-sm">Official Document Logo</h3>
                    <p className="text-xs text-muted-foreground">This logo will appear on all printed receipts (GRN, Issues, etc.) and item stickers. Recommended size: 200x200px PNG.</p>
                    <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-background border border-border rounded-lg text-sm font-medium hover:bg-muted cursor-pointer transition-colors">
                      <Upload size={14} />
                      {uploadLogoMutation.isPending ? 'Uploading...' : 'Upload New Logo'}
                      <input type="file" className="hidden" accept="image/png, image/jpeg, image/webp" disabled={!canEdit || uploadLogoMutation.isPending} onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadLogoMutation.mutate(file);
                      }} />
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {(() => {
                  const isReceipt = previewType === 'receipt';
                  const prefix = isReceipt ? '' : `print_settings.${previewType}.`;
                  const fields = [
                    {name: 'name_en', label: 'Organization Name Override (English)', placeholder: isReceipt ? '' : 'Leave blank to use global name'},
                    {name: 'name_si', label: 'Organization Name Override (Sinhala)', placeholder: isReceipt ? '' : 'Leave blank to use global name'},
                    {name: 'name_ta', label: 'Organization Name Override (Tamil)', placeholder: isReceipt ? '' : 'Leave blank to use global name'},
                    {name: 'telephone', label: 'Telephone Override', placeholder: isReceipt ? '' : 'Leave blank to use global name'},
                  ];

                  return (
                    <>
                      <h3 className="font-semibold text-lg border-b pb-2 capitalize">{previewType} Settings</h3>
                      
                      {!isReceipt && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2 bg-muted/50 p-4 rounded-lg border border-border">
                          <div className="space-y-1.5 md:col-span-3">
                            <label className="text-sm font-medium text-foreground">Sticker Format Template</label>
                            <select {...form.register(`print_settings.${previewType}.size` as keyof OrgForm)} disabled={!canEdit} className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background">
                              <option value="50x25">50mm x 25mm (Standard)</option>
                              <option value="30x20">30mm x 20mm (Small)</option>
                              <option value="75x50">75mm x 50mm (Large)</option>
                              <option value="100x50">100mm x 50mm (Extra Large)</option>
                              <option value="custom">Custom Size</option>
                            </select>
                          </div>
                          
                          {form.watch(`print_settings.${previewType}.size` as any) === 'custom' && (
                            <>
                              <div className="space-y-1.5">
                                <label className="text-sm font-medium text-foreground">Width (mm)</label>
                                <input type="number" {...form.register(`print_settings.${previewType}.custom_w` as any)} disabled={!canEdit} placeholder="e.g. 60" className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background" />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-sm font-medium text-foreground">Height (mm)</label>
                                <input type="number" {...form.register(`print_settings.${previewType}.custom_h` as any)} disabled={!canEdit} placeholder="e.g. 40" className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background" />
                              </div>
                            </>
                          )}
                          
                          <div className="space-y-1.5 md:col-span-3">
                            <label className="text-sm font-medium text-foreground">Font Scale % (to fit long texts)</label>
                            <input type="number" {...form.register(`print_settings.${previewType}.font_scale` as any)} disabled={!canEdit} placeholder="100" className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background" />
                          </div>
                        </div>
                      )}

                      {fields.map(f => (
                        <div key={f.name} className="space-y-1.5">
                          <label className="text-sm font-medium text-foreground">{isReceipt ? f.label.replace(' Override', '') : f.label}</label>
                          <input 
                            {...form.register(`${prefix}${f.name}` as any)} 
                            placeholder={f.placeholder}
                            disabled={!canEdit}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60 disabled:bg-muted" 
                          />
                        </div>
                      ))}

                      {isReceipt && (
                        <>
                          {[
                            {name:'email',label:'Email (Printed on receipts)'},
                            {name:'system_subtitle',label:'System Subtitle (Header)'},
                            {name:'footer_text',label:'Footer Text'},
                          ].map(f => (
                            <div key={f.name} className="space-y-1.5">
                              <label className="text-sm font-medium text-foreground">{f.label}</label>
                              <input {...form.register(f.name as keyof OrgForm)} disabled={!canEdit}
                                className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60 disabled:bg-muted" />
                            </div>
                          ))}
                        </>
                      )}

                      {!isReceipt && (
                        <label className="flex items-center gap-2 text-sm font-medium mt-4">
                          <input type="checkbox" {...form.register(`print_settings.${previewType}.hide_price` as any)} disabled={!canEdit} />
                          Hide Item Price on {previewType}
                        </label>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
            
            <div className="hidden xl:flex flex-col bg-muted/20 border border-border rounded-xl overflow-hidden relative" style={{ height: '800px' }}>
              <div className="bg-muted p-2 flex gap-2 border-b border-border z-10 shrink-0 shadow-sm">
                {[
                  { id: 'receipt', label: 'Receipt Preview' },
                  { id: 'sticker', label: 'Sticker Preview' },
                  { id: 'barcode', label: 'Barcode Preview' },
                  { id: 'qr', label: 'QR Preview' }
                ].map(p => (
                  <button key={p.id} type="button" onClick={() => setPreviewType(p.id as any)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${previewType === p.id ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-background text-muted-foreground'}`}>
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto overflow-x-hidden p-8 flex flex-col items-center justify-start bg-slate-100/50">
                {previewType === 'receipt' && (
                  <div className="w-[800px] h-[1131px] origin-top shadow-xl transition-transform bg-white mb-10 overflow-hidden relative" style={{ transform: 'scale(0.6)' }}>
                    <div className="absolute top-0 left-0 w-full bg-blue-50 text-blue-600 text-center py-1 text-sm font-semibold z-10 border-b">
                      Live Preview (Save changes to update)
                    </div>
                    <div className="w-full h-full border-0 pt-8 overflow-y-auto">
                      <DedicatedPrintReceiptPage isPreviewProp={true} />
                    </div>
                  </div>
                )}
                {previewType !== 'receipt' && (
                  <div className="origin-top mt-10 shadow-xl transition-transform bg-white" style={{ transform: 'scale(1.5)' }}>
                    <StickerEngine 
                      code="ITEM-XYZ-123" 
                      type={previewType === 'qr' ? 'qr' : previewType === 'barcode' ? 'barcode' : 'both'} 
                      title="Sample Item Name" 
                      subtitle="Category: Electronics" 
                      price="Rs. 2,500.00" 
                      size="50x25" 
                      layout="sheet" 
                      orgOverride={{...data, ...form.watch()}} 
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {tab === 'appearance' && (
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-medium">System Theme (Color Palette)</label>
              <div className="flex flex-wrap gap-4">
                {[
                  { name: 'NPP Theme', hex: '#C21F4C' },
                  { name: 'Dark Black', hex: '#09090B' },
                  { name: 'Default Green', hex: '#006838' },
                  { name: 'Dark Blue', hex: '#1D4ED8' },
                  { name: 'Ruby Red', hex: '#BD084B' },
                  { name: 'Emerald Green', hex: '#059669' },
                  { name: 'Royal Purple', hex: '#7E22CE' },
                  { name: 'Slate Gray', hex: '#475569' },
                  { name: 'Crimson', hex: '#DC143C' },
                  { name: 'Orange', hex: '#F97316' },
                  { name: 'Amber', hex: '#F59E0B' },
                  { name: 'Yellow', hex: '#EAB308' },
                  { name: 'Lime', hex: '#84CC16' },
                  { name: 'Teal', hex: '#14B8A6' },
                  { name: 'Cyan', hex: '#06B6D4' },
                  { name: 'Sky Blue', hex: '#0EA5E9' },
                  { name: 'Indigo', hex: '#4F46E5' },
                  { name: 'Violet', hex: '#8B5CF6' },
                  { name: 'Fuchsia', hex: '#D946EF' },
                  { name: 'Pink', hex: '#EC4899' },
                  { name: 'Rose', hex: '#F43F5E' },
                  { name: 'Zinc', hex: '#52525B' },
                  { name: 'Neutral', hex: '#525252' },
                  { name: 'Stone', hex: '#57534E' },
                  { name: 'Navy', hex: '#0A2540' },
                  { name: 'Burgundy', hex: '#800020' },
                ].map(theme => (
                  <button
                    key={theme.hex}
                    type="button"
                    disabled={!canEdit}
                    onClick={() => {
                      form.setValue('primary_color', theme.hex, { shouldDirty: true });
                      applyThemeVars(theme.hex, resolvedTheme || 'light');
                    }}
                    className={`relative w-16 h-16 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all
                      ${form.watch('primary_color') === theme.hex ? 'ring-4 ring-primary ring-offset-2 ring-offset-background scale-105' : 'hover:scale-105 border border-border'}
                    `}
                    style={{ backgroundColor: theme.hex }}
                  >
                    <span className="text-[10px] text-white font-bold tracking-wider opacity-90 drop-shadow-md px-1 text-center leading-tight">
                      {theme.name}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Selecting a theme will instantly update the entire website's UI (Sidebar, Buttons, Accents, etc.) to a cohesive dark palette.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-border">
              {[{name:'currency',label:'Currency Code'},{name:'currency_symbol',label:'Currency Symbol'},{name:'date_format',label:'Date Format'}].map(f=>(
              <div key={f.name} className="space-y-1.5">
                <label className="text-sm font-medium">{f.label}</label>
                <input {...form.register(f.name as keyof OrgForm)} disabled={!canEdit} className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60" />
              </div>
            ))}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Default Language</label>
              <select {...form.register('default_language')} disabled={!canEdit} className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60">
                <option value="en">English</option>
                <option value="si">Sinhala (සිංහල)</option>
                <option value="ta">Tamil (தமிழ்)</option>
              </select>
            </div>
            </div>

            {/* Global Footer Settings */}
            <div className="pt-4 border-t border-border">
              <h3 className="text-sm font-semibold mb-4">Global Footer Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium">Footer Text</label>
                  <input {...form.register('footer_text')} disabled={!canEdit} placeholder="e.g. Shamil - Dev" className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Footer Font Size</label>
                  <select {...form.register('footer_size')} disabled={!canEdit} className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60">
                    <option value="">Default (Small)</option>
                    <option value="text-[10px]">Extra Small</option>
                    <option value="text-sm">Medium</option>
                    <option value="text-base">Large</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Footer Font Style</label>
                  <select {...form.register('footer_font')} disabled={!canEdit} className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60">
                    <option value="">Default (Sans-serif)</option>
                    <option value="font-serif">Serif (Elegant)</option>
                    <option value="font-mono">Monospace (Code)</option>
                    <option value="italic">Italic</option>
                    <option value="font-medium">Medium Weight</option>
                    <option value="font-bold">Bold Weight</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Footer Text Color</label>
                  <select {...form.register('footer_color')} disabled={!canEdit} className="w-full px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60">
                    <option value="">Default (Muted)</option>
                    <option value="text-primary">Primary Brand Color</option>
                    <option value="text-foreground">Solid Black/White</option>
                    <option value="text-red-500">Red</option>
                    <option value="text-blue-500">Blue</option>
                    <option value="text-emerald-500">Emerald</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
        {tab === 'notifications' && (
          <div className="space-y-4">
            {[{name:'enable_email_notifications',label:'Email Notifications',desc:'Send email alerts for low stock, GRN approvals, and more'}].map(f=>(
              <div key={f.name} className="flex items-center justify-between p-4 rounded-lg border border-border">
                <div><p className="font-medium text-sm">{f.label}</p><p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p></div>
                <input type="checkbox" {...form.register(f.name as keyof OrgForm)} disabled={!canEdit} className="w-5 h-5 accent-primary rounded cursor-pointer" />
              </div>
            ))}
          </div>
        )}
        {tab === 'ai' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border border-border">
              <div><p className="font-medium text-sm">Enable AI Features</p><p className="text-xs text-muted-foreground mt-0.5">AI chat, purchase recommendations, and duplicate detection</p></div>
              <input type="checkbox" {...form.register('enable_ai_features')} disabled={!canEdit} className="w-5 h-5 accent-primary rounded cursor-pointer" />
            </div>
            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-700 dark:text-amber-400">OpenAI API key is configured via environment variables or the database settings for security.</p>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}