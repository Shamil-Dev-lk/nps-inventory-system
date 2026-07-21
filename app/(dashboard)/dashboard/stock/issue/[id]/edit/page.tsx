'use client';
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import Link from 'next/link';

export default function IssueEditPage() {
  const params = useParams();
  const router = useRouter();
  const qc = useQueryClient();
  const id = params.id;

  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<any[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ['issue', id],
    queryFn: () => api.get(`/v1/stock/issues/${id}`).then(r => r.data),
  });

  const issue = data?.data;

  useEffect(() => {
    if (issue) {
      setNotes(issue.notes || '');
      setItems(issue.items?.map((item: any) => ({
        id: item.id,
        item_id: item.item_id,
        item_name: item.item?.name_en || 'Unknown Item',
        quantity: item.quantity,
      })) || []);
    }
  }, [issue]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put(`/v1/stock/issues/${id}`, data),
    onSuccess: () => {
      toast.success('Issue updated successfully');
      qc.invalidateQueries({ queryKey: ['issue'] });
      router.push(`/dashboard/stock/issue/${id}`);
    },
    onError: () => toast.error('Failed to update issue'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      notes,
      items: items.map(item => ({ item_id: item.item_id, quantity: Number(item.quantity) })),
    });
  };

  const updateItemQty = (index: number, qty: number) => {
    const newItems = [...items];
    newItems[index].quantity = qty;
    setItems(newItems);
  };

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;
  if (!issue) return <div className="p-8 text-center">Issue not found</div>;

  return (
    <div className="space-y-6 max-w-[1000px]">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/stock/issue/${id}`} className="p-2 border border-border rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Issue</h1>
          <p className="text-sm text-muted-foreground mt-1">{issue.issue_number}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Warehouse</label>
              <input type="text" value={issue.warehouse?.name_en || ''} disabled className="w-full px-3 py-2 rounded-lg border border-input bg-muted text-muted-foreground" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Reference Number</label>
              <input type="text" value={issue.reference_number || ''} disabled className="w-full px-3 py-2 rounded-lg border border-input bg-muted text-muted-foreground" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea 
              value={notes} 
              onChange={e => setNotes(e.target.value)} 
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Enter notes..."
            />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex justify-between items-center">
            <h3 className="text-lg font-semibold">Issue Items</h3>
          </div>
          <div className="p-5">
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex gap-4 items-center">
                  <div className="flex-1">
                    <input type="text" value={item.item_name} disabled className="w-full px-3 py-2 rounded-lg border border-input bg-muted" />
                  </div>
                  <div className="w-32">
                    <input 
                      type="number" 
                      min="1" 
                      value={item.quantity} 
                      onChange={e => updateItemQty(index, parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background"
                      required
                    />
                  </div>
                </div>
              ))}
              {items.length === 0 && <div className="text-center py-4 text-muted-foreground text-sm">No items added</div>}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link href={`/dashboard/stock/issue/${id}`} className="px-4 py-2 rounded-lg border border-border hover:bg-muted text-sm font-medium">
            Cancel
          </Link>
          <button type="submit" disabled={updateMutation.isPending} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium">
            <Save size={16} /> {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

export function generateStaticParams() { return []; }
