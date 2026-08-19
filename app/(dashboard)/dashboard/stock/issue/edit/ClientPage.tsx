'use client';
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

import { SearchableItemSelect } from '@/components/ui/SearchableItemSelect';

export default function IssueEditPage() {
  const params = useParams();
  const router = useRouter();
  const qc = useQueryClient();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<any[]>([]);

  const { data: itemsList = [] } = useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      const { data, error } = await supabase.from('items').select('*');
      if (error) throw error;
      return data || [];
    }
  });

  const { data: issue, isLoading } = useQuery({
    queryKey: ['issue', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_issues')
        .select('*, warehouse:warehouses(id, name_en), items:stock_issue_items(*, item:items(*))')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (issue) {
      setNotes(issue.notes || issue.remarks || '');
      setItems(issue.items?.map((item: any) => ({
        id: item.id,
        item_id: item.item_id,
        item_name: item.item?.name_en || 'Unknown Item',
        quantity: item.quantity,
      })) || []);
    }
  }, [issue]);

  const updateMutation = useMutation({
    mutationFn: async (updateData: any) => {
      const { notes } = updateData;
      const { error } = await supabase.from('stock_issues').update({ notes, remarks: notes }).eq('id', id);
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      toast.success('Issue updated successfully');
      qc.invalidateQueries({ queryKey: ['issue', id] });
      router.push(`/dashboard/stock/issue/view/?id=${id}`);
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update issue'),
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

  const updateItemId = (index: number, newItemId: string) => {
    const selected = itemsList.find((i: any) => String(i.id) === String(newItemId));
    const newItems = [...items];
    newItems[index].item_id = newItemId;
    if (selected) {
      newItems[index].item_name = selected.name_en;
    }
    setItems(newItems);
  };

  const addItemRow = () => {
    setItems([...items, { item_id: '', item_name: '', quantity: 1 }]);
  };

  const removeItemRow = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;
  if (!issue) return <div className="p-8 text-center">Issue not found</div>;

  return (
    <div className="space-y-6 max-w-[1000px]">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/stock/issue/view/?id=${id}`} className="p-2 border border-border rounded-lg hover:bg-muted transition-colors">
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
            <button
              type="button"
              onClick={addItemRow}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-md text-sm font-medium transition-colors"
            >
              <Plus size={15} /> Add Item
            </button>
          </div>
          <div className="p-5">
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex gap-3 items-center">
                  <div className="flex-1">
                    <SearchableItemSelect
                      items={itemsList}
                      value={item.item_id}
                      onChange={(val) => updateItemId(index, val)}
                      placeholder="Search item by name or code..."
                    />
                  </div>
                  <div className="w-32">
                    <input 
                      type="number" 
                      min="0.001" 
                      step="0.001"
                      value={item.quantity} 
                      onChange={e => updateItemQty(index, parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background"
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItemRow(index)}
                    className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {items.length === 0 && <div className="text-center py-4 text-muted-foreground text-sm">No items added</div>}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link href={`/dashboard/stock/issue/view/?id=${id}`} className="px-4 py-2 rounded-lg border border-border hover:bg-muted text-sm font-medium">
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


