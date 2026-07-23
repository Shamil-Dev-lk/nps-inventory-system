'use client';
import { Suspense } from 'react';

import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';
import { Download, Printer, Share2, Mail, FileText } from 'lucide-react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export function DedicatedPrintReceiptPage({ isPreviewProp = false }: { isPreviewProp?: boolean }) {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const type = searchParams.get('type') || 'generic';
  
  const isPreview = isPreviewProp || searchParams.get('preview') === 'true';
  
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [autoPrintTriggered, setAutoPrintTriggered] = useState(false);
  const [printSize, setPrintSize] = useState<'80mm' | 'A4'>('80mm');
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  const { data: documentData, isLoading, isError, error } = useQuery({
    queryKey: ['print-document', type, id],
    queryFn: async () => {
      if (!id) return null;
      if (type === 'customer') {
        const { data } = await supabase.from('customers').select('*').eq('id', id).single();
        return data;
      }
      if (type === 'stock-issue') {
        const { data } = await supabase.from('stock_issues').select('*, department:departments(id, name_en), officer:users(id, name), project:projects(id, name_en), items:stock_issue_items(*, item:items(*))').eq('id', id).single();
        return data;
      }
      if (type === 'grn') {
        const { data } = await supabase.from('grns').select('*, supplier:suppliers(id, company_name), items:grn_items(*, item:items(*))').eq('id', id).single();
        return data;
      }
      if (type === 'supplier') {
        const { data } = await supabase.from('suppliers').select('*').eq('id', id).single();
        return data;
      }
      if (type === 'stock-return') {
        const { data } = await supabase.from('stock_returns').select('*, department:departments(id, name_en), returned_by:users(id, name), items:stock_return_items(*, item:items(*))').eq('id', id).single();
        return data;
      }
      if (type === 'stock-transfer') {
        const { data } = await supabase.from('stock_transfers').select('*, from_warehouse:warehouses!from_warehouse_id(name_en), to_warehouse:warehouses!to_warehouse_id(name_en), items:stock_transfer_items(*, item:items(*))').eq('id', id).single();
        return data;
      }
      if (type === 'stock-taking') {
        const { data } = await supabase.from('stock_taking').select('*, warehouse:warehouses(id, name_en), items:stock_taking_items(*, item:items(*))').eq('id', id).single();
        return data;
      }
      if (type === 'stock-adjustment') {
        const { data } = await supabase.from('stock_adjustments').select('*, warehouse:warehouses(id, name_en), item:items(*)').eq('id', id).single();
        return data;
      }
      if (type === 'purchase-order') {
        const { data } = await supabase.from('purchase_orders').select('*, supplier:suppliers(id, company_name), items:purchase_order_items(*, item:items(*))').eq('id', id).single();
        return data;
      }
      if (type === 'purchase-request') {
        const { data, error } = await supabase.from('purchase_requests').select('*, items:purchase_request_items(*, item:items(*))').eq('id', id).single();
        if (error) {
          console.error("PR Fetch Error:", error);
          throw error;
        }
        return data;
      }
      return null;
    },
    enabled: !!id && type !== 'generic',
  });

  const { data: orgData } = useQuery({
    queryKey: ['organization'],
    queryFn: async () => {
      const { data } = await supabase.from('organizations').select('*').single();
      return data;
    },
    staleTime: Infinity
  });



  useEffect(() => {
    if (!isLoading && (documentData || type === 'generic') && !autoPrintTriggered && !isPreview) {
      setAutoPrintTriggered(true);
      const action = searchParams.get('action');
      
      if (action === 'download') {
        handleDownloadPDF().then(() => {
          if (window.opener) {
            setTimeout(() => window.close(), 1000);
          }
        });
      } else {
        setTimeout(() => {
          window.print();
          if (window.opener) {
            window.close();
          }
        }, 800);
      }
    }
  }, [isLoading, documentData, autoPrintTriggered, type, searchParams]);

  const handleDownloadPDF = async () => {
    if (!receiptRef.current) return;
    try {
      const toastId = toast.loading('Generating PDF...');
      const canvas = await html2canvas(receiptRef.current, { scale: 4, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      
      const pdfWidth = printSize === '80mm' ? 80 : 210; // 80mm POS Roll or A4 (210mm)
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pdf = new jsPDF('p', 'mm', printSize === '80mm' ? [pdfWidth, pdfHeight] : 'a4');
      
      if (printSize === 'A4') {
        const margin = 20;
        const printW = 210 - (margin * 2);
        const printH = (canvas.height * printW) / canvas.width;
        pdf.addImage(imgData, 'PNG', margin, margin, printW, printH);
      } else {
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      }
      
      pdf.save(`Receipt-${id || type}.pdf`);
      
      toast.success('Downloaded successfully', { id: toastId });
    } catch (e) {
      console.error(e);
      toast.error('Failed to generate PDF');
    }
  };

  const receiptNumber = type === 'customer' ? `CUS-${id}` : type === 'supplier' ? `SUP-${id}` : (documentData?.issue_number || documentData?.grn_number || documentData?.adjustment_number || documentData?.return_number || documentData?.transfer_number || documentData?.st_number || documentData?.po_number || documentData?.pr_number || `REC-${id || '0000'}`);
  const customerName = type === 'customer' ? documentData?.name : type === 'supplier' ? documentData?.company_name : (documentData?.customer?.name || documentData?.department?.name_en || documentData?.warehouse?.name_en || documentData?.supplier?.company_name || 'Internal Store');
  const amountStr = (documentData?.total_amount || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 });
  const qrData = `ID: ${receiptNumber}\nName: ${customerName}\nAmount: Rs.${amountStr}\nDate: ${currentDate?.toLocaleDateString()}`;

  if (isLoading) {
    return <div className="flex h-screen w-full items-center justify-center bg-gray-100">
      <div className="animate-spin w-8 h-8 border-4 border-black border-t-transparent rounded-full"></div>
    </div>;
  }

  if (isError || (!documentData && type !== 'generic')) {
    return <div className="flex flex-col h-screen w-full items-center justify-center bg-gray-100 text-red-600 font-bold p-8 text-center space-y-4">
      <p className="text-xl">Failed to load receipt data.</p>
      <p className="text-sm font-normal text-gray-600">Please ensure the record exists and you have permission to view it.</p>
      {isError && error && (
        <div className="bg-red-50 text-red-800 p-4 rounded-md text-left font-mono text-xs w-full max-w-2xl overflow-auto border border-red-200">
          <p className="font-bold mb-2">Error Details:</p>
          <pre>{JSON.stringify(error, null, 2)}</pre>
          <pre>{(error as any)?.message}</pre>
          <pre>{(error as any)?.details}</pre>
          <pre>{(error as any)?.hint}</pre>
        </div>
      )}
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 text-black print:bg-white font-sans overflow-x-hidden">
      {/* ── Action Bar (Screen Only) ── */}
      <div className="print:hidden bg-white border-b shadow-sm sticky top-0 z-50 p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <FileText className="text-gray-400" />
          <h2 className="font-semibold">Receipt Preview</h2>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <select 
            value={printSize} 
            onChange={(e) => setPrintSize(e.target.value as '80mm' | 'A4')}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium bg-white"
          >
            <option value="80mm">POS Receipt (80mm)</option>
            <option value="A4">Standard A4</option>
          </select>
          <button onClick={() => window.print()} className="px-4 py-2 bg-black text-white rounded-md text-sm font-medium flex items-center gap-2 hover:bg-gray-800">
            <Printer size={16} /> Print Receipt
          </button>
          <button onClick={handleDownloadPDF} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium flex items-center gap-2 hover:bg-gray-50">
            <Download size={16} /> Download PDF
          </button>
          <button onClick={() => toast.success('Email prepared')} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium flex items-center gap-2 hover:bg-gray-50">
            <Mail size={16} /> Email
          </button>
          <button onClick={() => toast.success('WhatsApp sharing initiated')} className="px-4 py-2 bg-green-500 text-white rounded-md text-sm font-medium flex items-center gap-2 hover:bg-green-600">
            <Share2 size={16} /> WhatsApp
          </button>
        </div>
      </div>

      {/* ── Receipt Layout ── */}
      <style>{`@media print { @page { size: ${printSize === 'A4' ? 'A4 portrait' : '80mm auto'}; margin: ${printSize === 'A4' ? '20mm' : '0mm'}; } body { width: ${printSize === 'A4' ? '100%' : '80mm'}; } }`}</style>
      <div className={`mx-auto my-8 print:my-0 bg-white shadow-xl print:shadow-none text-[12px] leading-tight font-mono text-black ${printSize === 'A4' ? 'max-w-[210mm] w-full border border-gray-200' : 'max-w-[320px] print:max-w-[80mm] print:w-[80mm]'}`}>
        <div ref={receiptRef} className={`p-4 bg-white ${printSize === 'A4' ? 'p-12' : 'print:p-2'}`}>
          
          {/* Header */}
          <div className="flex flex-col items-center text-center border-b border-black border-dashed pb-3 mb-3">
            <div className="w-16 h-16 mb-2">
              <img src="/nps-inventory-system/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-[14px] font-bold uppercase">{orgData?.name_en || 'Pradeshiya Sabha'}</h1>
            <p className="text-[10px] uppercase font-bold mt-1">Gov Store & Inventory</p>
            <p className="text-[10px] mt-1">123 Main St, Nikaweratiya</p>
            <p className="text-[10px]">Tel: 037-1234567</p>
          </div>

          <div className="text-center mb-3">
            <h2 className="text-[16px] font-bold uppercase tracking-widest">RECEIPT</h2>
          </div>

          {/* Info block */}
          <div className="mb-3 space-y-1">
            <div className="flex justify-between">
              <span>Receipt No:</span>
              <span className="font-bold">{receiptNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{currentDate?.toLocaleDateString()} {currentDate?.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
            <div className="flex justify-between">
              <span>Billed To:</span>
              <span className="font-bold truncate max-w-[140px] text-right">{customerName}</span>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full mb-3 border-t border-b border-black border-dashed">
            <thead>
              <tr className="text-[10px] uppercase text-left border-b border-black">
                <th className="py-1">Qty</th>
                <th className="py-1">Item</th>
                <th className="py-1 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="text-[10px]">
              {type === 'stock-adjustment' && documentData?.item ? (
                  <tr className="border-b border-gray-100 last:border-0 align-top">
                    <td className="py-1">{documentData.quantity}</td>
                    <td className="py-1 pr-1">{documentData.item?.name_en || 'Unknown Item'}</td>
                    <td className="py-1 text-right">{Number(documentData.quantity * (documentData.unit_cost || documentData.unit_price || 0)).toLocaleString('en-LK', { minimumFractionDigits: 2 })}</td>
                  </tr>
              ) : ['stock-issue', 'stock-return', 'stock-transfer', 'stock-taking', 'grn', 'purchase-order', 'purchase-request'].includes(type) && documentData?.items ? (
                documentData.items.map((item: any, idx: number) => (
                  <tr key={idx} className="border-b border-gray-100 last:border-0 align-top">
                    <td className="py-1">{item.quantity || item.physical_quantity || 1}</td>
                    <td className="py-1 pr-1">{item.item?.name_en || 'Unknown Item'}</td>
                    <td className="py-1 text-right">{Number((item.quantity || item.physical_quantity || 1) * (item.unit_price || item.unit_cost || item.estimated_unit_price || 0)).toLocaleString('en-LK', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))
              ) : type === 'supplier' ? (
                <>
                  <tr className="align-top">
                    <td className="py-1" colSpan={2}>Supplier Code:</td>
                    <td className="py-1 text-right font-medium">{documentData?.supplier_code}</td>
                  </tr>
                  <tr className="align-top">
                    <td className="py-1" colSpan={2}>Contact Person:</td>
                    <td className="py-1 text-right font-medium">{documentData?.contact_person || 'N/A'}</td>
                  </tr>
                  <tr className="align-top">
                    <td className="py-1" colSpan={2}>Telephone:</td>
                    <td className="py-1 text-right font-medium">{documentData?.telephone || 'N/A'}</td>
                  </tr>
                  <tr className="align-top">
                    <td className="py-1" colSpan={2}>Email:</td>
                    <td className="py-1 text-right font-medium">{documentData?.email || 'N/A'}</td>
                  </tr>
                  <tr className="align-top">
                    <td className="py-1" colSpan={2}>Status:</td>
                    <td className="py-1 text-right font-medium uppercase">{documentData?.status || 'N/A'}</td>
                  </tr>
                </>
              ) : (
                <tr className="align-top">
                  <td className="py-1">1</td>
                  <td className="py-1 pr-1">{type === 'customer' ? 'Customer Registration' : 'Miscellaneous Service'}</td>
                  <td className="py-1 text-right">{amountStr}</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Totals */}
          <div className="space-y-1 border-b border-black border-dashed pb-3 mb-3">
            <div className="flex justify-between font-bold text-[14px]">
              <span>TOTAL</span>
              <span>Rs. {amountStr}</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span>Payment Method</span>
              <span>CASH</span>
            </div>
          </div>

          {/* Footer & QR */}
          <div className="flex flex-col items-center justify-center space-y-2 mt-4 text-center">
            {currentDate && (
              <div className="bg-white p-1">
                <QRCodeSVG value={qrData} size={80} level="M" includeMargin={true} />
              </div>
            )}
            <div className="bg-white p-1 w-full flex justify-center overflow-hidden">
              <Barcode value={receiptNumber} width={2} height={45} displayValue={false} margin={10} background="#ffffff" lineColor="#000000" />
            </div>
            <p className="text-[10px] mt-1 font-mono">{receiptNumber}</p>
            <p className="text-[10px] italic mt-3">Thank you for your business!</p>
            <p className="text-[11px] font-bold mt-2 mb-4 text-black">Powered by Nikaweratiya Pradheshiya Sabha</p>
          </div>
        </div>
      </div>

      {/* ── Print CSS Setup (Global inside this page) ── */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          html, body {
            background-color: white !important;
            margin: 0 !important;
            padding: 0 !important;
            width: ${printSize === 'A4' ? '100%' : '80mm'} !important;
            height: auto !important;
          }
          @page {
            size: ${printSize === 'A4' ? 'A4 portrait' : '80mm auto'};
            margin: ${printSize === 'A4' ? '20mm' : '0mm'};
          }
        }
      `}} />
    </div>
  );
}

export default function PageWrapper() { return <Suspense fallback={<div>Loading...</div>}><DedicatedPrintReceiptPage /></Suspense>; }

