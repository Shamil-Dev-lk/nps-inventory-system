'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Package, Hash, Tag, Scale, Building2, AlignLeft, Receipt, Layers, BarChart, Printer, QrCode } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

import { StickerGeneratorDialog } from '@/components/print/StickerGeneratorDialog';

export default function ViewItemPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  const [stickerOpen, setStickerOpen] = React.useState(false);

  const { data: itemData, isLoading } = useQuery({ 
    queryKey: ['item', id], 
    queryFn: () => api.get(`/v1/items/${id}`).then(r => r.data.data) 
  });

  if (isLoading) return <div className="p-8 text-center text-muted-foreground shimmer h-32 rounded-xl" />;
  if (!itemData) return <div className="p-8 text-center text-red-500 font-bold">Item not found</div>;

  return (
    <div className="max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 print:hidden">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/items" className="p-2 rounded-lg hover:bg-muted border bg-card transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {itemData.name_en}
            </h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded font-mono text-xs font-bold">{itemData.item_code}</span>
              {itemData.barcode && <span>• Barcode: {itemData.barcode}</span>}
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <Link href={`/dashboard/stock/grn/new?item=${id}`} className="flex items-center gap-1.5 px-3 py-1.5 border rounded-md hover:bg-muted text-sm font-medium">
            Receive (GRN)
          </Link>
          <Link href={`/dashboard/stock/issue/new?item=${id}`} className="flex items-center gap-1.5 px-3 py-1.5 border rounded-md hover:bg-muted text-sm font-medium">
            Issue Stock
          </Link>
          <button onClick={() => setStickerOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 border rounded-md hover:bg-muted text-sm font-medium">
            <Tag size={14} /> Sticker
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-1.5 border rounded-md hover:bg-muted text-sm font-medium">
            <Printer size={14} /> Print
          </button>
          <Link href={`/dashboard/items/${id}/edit`} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#c21f4c] text-white rounded-md hover:bg-[#a0183e] text-sm font-medium shadow-sm">
            <Edit size={14} /> Edit Item
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Basic Info */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-card border rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 border-b pb-2 flex items-center gap-2">
              <Package size={18} className="text-primary" /> Basic Information
            </h2>
            <div className="grid grid-cols-2 gap-y-4 gap-x-6">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-1"><AlignLeft size={14} /> Name (English)</p>
                <p className="font-medium text-foreground">{itemData.name_en}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-1"><AlignLeft size={14} /> Name (Sinhala)</p>
                <p className="font-medium text-foreground">{itemData.name_si || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-1"><Hash size={14} /> Item Code</p>
                <p className="font-mono bg-muted inline-block px-1.5 rounded">{itemData.item_code}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-1"><QrCode size={14} /> Barcode / QR</p>
                <p className="font-mono bg-muted inline-block px-1.5 rounded">{itemData.barcode || itemData.item_code}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-1"><AlignLeft size={14} /> Description</p>
                <p className="font-medium text-foreground whitespace-pre-wrap bg-muted/30 p-3 rounded-lg border border-border/50 min-h-[60px]">
                  {itemData.description || 'No description provided.'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 border-b pb-2 flex items-center gap-2">
              <Tag size={18} className="text-primary" /> Classification & Location
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
                <p className="text-xs text-muted-foreground mb-1">Category</p>
                <p className="font-semibold">{itemData.category?.name_en || '—'}</p>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
                <p className="text-xs text-muted-foreground mb-1">Brand</p>
                <p className="font-semibold">{itemData.brand?.name || '—'}</p>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
                <p className="text-xs text-muted-foreground mb-1">Unit of Measure</p>
                <p className="font-semibold">{itemData.unit?.name_en || '—'} {itemData.unit?.symbol ? `(${itemData.unit.symbol})` : ''}</p>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
                <p className="text-xs text-muted-foreground mb-1">Primary Warehouse</p>
                <p className="font-semibold">{itemData.warehouse?.name_en || '—'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing & Stock */}
        <div className="space-y-6">
          <div className="bg-card border rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 border-b pb-2 flex items-center gap-2">
              <Receipt size={18} className="text-primary" /> Pricing
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-border/50 pb-2">
                <span className="text-sm text-muted-foreground">Purchase Price</span>
                <span className="font-bold">Rs. {Number(itemData.purchase_price).toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center border-b border-border/50 pb-2">
                <span className="text-sm text-muted-foreground">Selling Price</span>
                <span className="font-bold">Rs. {Number(itemData.selling_price || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center bg-primary/5 p-2 rounded">
                <span className="text-sm font-medium">Average Cost</span>
                <span className="font-black text-primary">Rs. {Number(itemData.average_cost || itemData.purchase_price).toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 border-b pb-2 flex items-center gap-2">
              <Layers size={18} className="text-primary" /> Stock Levels
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-border/50 pb-2">
                <span className="text-sm text-muted-foreground">Current Quantity</span>
                <span className={`font-bold text-lg ${itemData.is_out_of_stock ? 'text-red-500' : itemData.is_low_stock ? 'text-amber-500' : 'text-green-600'}`}>
                  {Number(itemData.current_quantity || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-border/50 pb-2">
                <span className="text-sm text-muted-foreground">Reorder Level</span>
                <span className="font-semibold">{itemData.reorder_level || 0}</span>
              </div>
              <div className="flex justify-between items-center border-b border-border/50 pb-2">
                <span className="text-sm text-muted-foreground">Minimum Stock</span>
                <span className="font-semibold">{itemData.minimum_stock || 0}</span>
              </div>
              <div className="flex justify-between items-center pb-1">
                <span className="text-sm text-muted-foreground">Maximum Stock</span>
                <span className="font-semibold">{itemData.maximum_stock || 0}</span>
              </div>
              
              {/* Status Indicator */}
              <div className={`mt-2 p-3 rounded-lg flex items-center justify-center font-bold text-sm ${
                itemData.stock_status === 'in_stock' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                itemData.stock_status === 'low_stock' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                itemData.stock_status === 'out_of_stock' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
              }`}>
                {itemData.stock_status ? itemData.stock_status.replace(/_/g, ' ').toUpperCase() : 'UNKNOWN'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {itemData && (
        <StickerGeneratorDialog 
          open={stickerOpen} 
          onOpenChange={setStickerOpen} 
          items={[itemData]} 
        />
      )}
    </div>
  );
}

export function generateStaticParams() { return []; }
