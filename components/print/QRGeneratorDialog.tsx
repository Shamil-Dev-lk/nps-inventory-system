import React, { useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Printer, Download, QrCode } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import QRCode from 'react-qr-code';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface QRGeneratorProps {
  items: any[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QRGeneratorDialog({ items, open, onOpenChange }: QRGeneratorProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'QR_Codes_Print',
  });

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    const canvas = await html2canvas(printRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`QR_Codes_${new Date().getTime()}.pdf`);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg sm:rounded-2xl">
          <div className="flex items-center justify-between border-b pb-4">
            <Dialog.Title className="text-xl font-bold flex items-center gap-2">
              <QrCode className="text-primary" />
              QR Code Generator
            </Dialog.Title>
            <Dialog.Close className="rounded-full p-1.5 hover:bg-muted transition-colors">
              <X size={20} />
            </Dialog.Close>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 py-4">
            <div className="space-y-4 md:col-span-1 border-r pr-4">
              <button onClick={handlePrint} className="w-full flex justify-center items-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-md">
                <Printer size={16} /> Print
              </button>
              <button onClick={handleDownloadPDF} className="w-full flex justify-center items-center gap-2 border border-border bg-card py-2.5 rounded-xl font-semibold hover:bg-muted transition-all">
                <Download size={16} /> Save PDF
              </button>
            </div>

            <div className="md:col-span-3 bg-muted/30 rounded-xl border border-dashed border-border/50 p-4 overflow-auto max-h-[50vh] custom-scrollbar">
              <div ref={printRef} className="bg-white p-4 w-full flex flex-wrap gap-6 justify-center">
                {items.length === 0 ? (
                  <p className="text-muted-foreground my-10">No items selected.</p>
                ) : (
                  items.map((item, idx) => (
                    <div key={idx} className="flex flex-col items-center border border-gray-200 p-3 rounded-lg text-black page-break-inside-avoid w-48 bg-white shadow-sm">
                      <div className="flex items-center gap-2 mb-2 w-full border-b pb-2">
                        <img src="/logo.png" className="w-6 h-6 grayscale" alt="Logo" onError={(e) => e.currentTarget.style.display = 'none'} />
                        <div className="flex flex-col leading-tight">
                          <span className="text-[7px] font-bold">නිකවැරටිය ප්‍රාදේශීය සභාව</span>
                          <span className="text-[6px] font-bold uppercase text-gray-700">Nikaweratiya Pradeshiya Sabha</span>
                        </div>
                      </div>
                      <QRCode value={item.qr_code || item.barcode || item.code || item.item_code || 'NO-CODE'} size={100} />
                      <span className="text-xs font-bold mt-2 tracking-widest">{item.code || item.item_code}</span>
                      <span className="text-[10px] text-gray-500 w-full text-center truncate px-2">{item.name_en}</span>
                      <span className="text-[8px] text-gray-400 mt-1 uppercase">Verify: {Math.random().toString(36).substring(2, 8).toUpperCase()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
