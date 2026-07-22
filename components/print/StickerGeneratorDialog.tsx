import React, { useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Printer, Download, LayoutTemplate } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { StickerEngine, StickerSize } from './StickerEngine';

interface StickerGeneratorProps {
  items: any[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StickerGeneratorDialog({ items, open, onOpenChange }: StickerGeneratorProps) {
  const [size, setSize] = useState<StickerSize>('50x25');
  const [type, setType] = useState<'qr' | 'barcode' | 'both'>('barcode');
  const [layout, setLayout] = useState<'roll' | 'sheet'>('roll');
  const [copies, setCopies] = useState<number>(1);
  
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Stickers_Print',
  });

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: layout === 'sheet' ? 'portrait' : 'landscape',
        unit: 'mm',
        format: size === 'A4' ? 'a4' : size.split('x').map(Number)
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Stickers_${new Date().getTime()}.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF', error);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-4xl translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-2xl">
          <div className="flex items-center justify-between border-b pb-4">
            <Dialog.Title className="text-xl font-bold flex items-center gap-2">
              <LayoutTemplate className="text-primary" />
              Professional Sticker Generator
            </Dialog.Title>
            <Dialog.Close className="rounded-full p-1.5 hover:bg-muted transition-colors">
              <X size={20} />
            </Dialog.Close>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
            {/* Controls Sidebar */}
            <div className="space-y-6 md:col-span-1 border-r pr-6">
              <div className="space-y-3">
                <label className="text-sm font-semibold">Sticker Layout</label>
                <select 
                  value={layout} 
                  onChange={(e) => setLayout(e.target.value as any)}
                  className="w-full p-2.5 rounded-lg border bg-muted/50 text-sm focus:ring-2 focus:ring-primary/50"
                >
                  <option value="roll">Thermal Printer (Roll)</option>
                  <option value="sheet">A4 Sheet (Grid)</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold">Sticker Size (mm)</label>
                <select 
                  value={size} 
                  onChange={(e) => setSize(e.target.value as any)}
                  className="w-full p-2.5 rounded-lg border bg-muted/50 text-sm focus:ring-2 focus:ring-primary/50"
                >
                  <option value="30x20">30 × 20 mm (Asset Small)</option>
                  <option value="50x25">50 × 25 mm (Standard Item)</option>
                  <option value="75x50">75 × 50 mm (Large Box)</option>
                  <option value="100x50">100 × 50 mm (Shipping Label)</option>
                  <option value="custom">Custom Size (From Settings)</option>
                  {layout === 'sheet' && <option value="A4">A4 Full Sheet</option>}
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold">Symbology</label>
                <div className="flex gap-2">
                  <button onClick={() => setType('barcode')} className={`flex-1 py-2 text-sm rounded-lg border ${type === 'barcode' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50'}`}>Barcode</button>
                  <button onClick={() => setType('qr')} className={`flex-1 py-2 text-sm rounded-lg border ${type === 'qr' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50'}`}>QR Code</button>
                  <button onClick={() => setType('both')} className={`flex-1 py-2 text-sm rounded-lg border ${type === 'both' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50'}`}>Both</button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold text-[#c21f4c]">Bulk Print (Copies per Item)</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    min="1" 
                    max="500" 
                    value={copies} 
                    onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full p-2.5 rounded-lg border border-[#c21f4c]/30 bg-red-50 dark:bg-red-950/20 text-sm focus:ring-2 focus:ring-[#c21f4c]/50 font-bold"
                  />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">copies</span>
                </div>
              </div>

              <div className="pt-4 space-y-3 border-t">
                <button onClick={handlePrint} className="w-full flex justify-center items-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-md">
                  <Printer size={18} />
                  Print Now
                </button>
                <button onClick={handleDownloadPDF} className="w-full flex justify-center items-center gap-2 border border-border bg-card py-3 rounded-xl font-semibold hover:bg-muted transition-all">
                  <Download size={18} />
                  Download PDF
                </button>
              </div>
            </div>

            {/* Live Preview Area */}
            <div className="md:col-span-2 bg-muted/30 rounded-xl border border-dashed border-border/50 p-6 overflow-auto max-h-[60vh] custom-scrollbar flex justify-center items-start">
              <div className={layout === 'roll' ? 'transform scale-125 md:scale-[1.5] origin-top mt-8 mb-12' : ''}>
                <div ref={printRef} className={layout === 'sheet' ? 'bg-white p-4 shadow-sm w-[210mm] min-h-[297mm] flex flex-wrap content-start gap-1' : 'flex flex-col gap-0 leading-none'}>
                  {items.length === 0 ? (
                  <div className="text-center text-muted-foreground w-full py-20 flex flex-col items-center">
                    <LayoutTemplate size={48} className="mb-4 opacity-20" />
                    <p>No items selected for sticker generation.</p>
                  </div>
                ) : (
                  items.flatMap((item, idx) => 
                    Array.from({ length: copies }).map((_, copyIdx) => (
                      <StickerEngine 
                        key={`${item.id}-${idx}-${copyIdx}`}
                        code={item.barcode || item.code || item.item_code || 'NO-CODE'}
                        type={type}
                        title={item.name_en}
                        subtitle={item.code || item.item_code}
                        price={item.selling_price}
                        size={size}
                        layout={layout}
                      />
                    ))
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
);
}
