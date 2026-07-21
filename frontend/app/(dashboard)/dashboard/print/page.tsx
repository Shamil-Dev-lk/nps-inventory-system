'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Printer, QrCode, FileText, BarChart, Package, Tag, ArrowRight } from 'lucide-react';
import { StickerGeneratorDialog } from '@/components/print/StickerGeneratorDialog';
import { QRGeneratorDialog } from '@/components/print/QRGeneratorDialog';
import { BarcodeGeneratorDialog } from '@/components/print/BarcodeGeneratorDialog';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function PrintHubPage() {
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [stickerOpen, setStickerOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [barcodeOpen, setBarcodeOpen] = useState(false);

  // Fetch a few recent items for quick printing
  const { data: recentItemsData } = useQuery({
    queryKey: ['recent-items'],
    queryFn: () => api.get('/v1/items', { params: { per_page: 5, sort_by: 'created_at', sort_dir: 'desc' } }).then(r => r.data.data.data),
  });

  const handleQuickPrint = (item: any, type: 'sticker' | 'qr' | 'barcode') => {
    setSelectedItem(item);
    if (type === 'sticker') setStickerOpen(true);
    if (type === 'qr') setQrOpen(true);
    if (type === 'barcode') setBarcodeOpen(true);
  };

  const cards = [
    {
      title: 'Bulk Item Labels',
      description: 'Print stickers, barcodes, and QR codes for multiple items at once.',
      icon: <Tag className="w-8 h-8 text-primary" />,
      link: '/dashboard/items',
      color: 'bg-primary/10 border-primary/20',
      textColor: 'text-primary'
    },
    {
      title: 'Stock Issue Receipts',
      description: 'Find and reprint past stock issue receipts and dispatch notes.',
      icon: <FileText className="w-8 h-8 text-blue-500" />,
      link: '/dashboard/stock/issue',
      color: 'bg-blue-50 border-blue-200',
      textColor: 'text-blue-600'
    },
    {
      title: 'System Reports',
      description: 'Generate, preview, and print detailed inventory and sales reports.',
      icon: <BarChart className="w-8 h-8 text-amber-500" />,
      link: '/dashboard/reports/analytics',
      color: 'bg-amber-50 border-amber-200',
      textColor: 'text-amber-600'
    }
  ];

  return (
    <div className="space-y-6 max-w-[1200px] pb-10">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Printer className="text-primary" size={24} /> Print Center
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Central hub for generating all system printables</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, i) => (
          <Link href={card.link} key={i}>
            <div className={`p-6 rounded-2xl border ${card.color} hover:shadow-lg transition-all duration-300 h-full flex flex-col justify-between cursor-pointer group`}>
              <div>
                <div className="mb-4 bg-white/50 w-14 h-14 rounded-xl flex items-center justify-center shadow-sm">
                  {card.icon}
                </div>
                <h3 className={`text-lg font-bold mb-2 ${card.textColor}`}>{card.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{card.description}</p>
              </div>
              <div className={`mt-6 flex items-center gap-1 text-sm font-semibold ${card.textColor} group-hover:gap-2 transition-all`}>
                Go to module <ArrowRight size={16} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-bold mb-4">Quick Print (Recent Items)</h2>
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground uppercase font-semibold text-[11px] border-b">
              <tr>
                <th className="px-6 py-4">Item Name</th>
                <th className="px-6 py-4">Code</th>
                <th className="px-6 py-4 text-right">Print Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentItemsData?.map((item: any) => (
                <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-medium flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                      <Package size={16} />
                    </div>
                    {item.name_en}
                  </td>
                  <td className="px-6 py-4 font-mono">{item.item_code}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleQuickPrint(item, 'sticker')} className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg font-medium transition-colors flex items-center gap-1.5">
                        <Tag size={14} /> Sticker
                      </button>
                      <button onClick={() => handleQuickPrint(item, 'barcode')} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors flex items-center gap-1.5">
                        Barcode
                      </button>
                      <button onClick={() => handleQuickPrint(item, 'qr')} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors flex items-center gap-1.5">
                        <QrCode size={14} /> QR
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!recentItemsData?.length && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">
                    No items found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedItem && (
        <>
          <StickerGeneratorDialog open={stickerOpen} onOpenChange={setStickerOpen} items={[selectedItem]} />
          <QRGeneratorDialog open={qrOpen} onOpenChange={setQrOpen} items={[selectedItem]} />
          <BarcodeGeneratorDialog open={barcodeOpen} onOpenChange={setBarcodeOpen} items={[selectedItem]} />
        </>
      )}
    </div>
  );
}
