'use client';

import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, QrCode } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface GlobalScannerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalScanner({ isOpen, onClose }: GlobalScannerProps) {
  const [scanned, setScanned] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) {
      setScanned(false);
      return;
    }

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 }, rememberLastUsedCamera: true },
      /* verbose= */ false
    );

    const onScanSuccess = (decodedText: string) => {
      if (scanned) return;
      setScanned(true);
      scanner.clear();
      
      toast.success(`Scanned: ${decodedText}`);
      
      // Auto-routing logic (in production, we'd hit /v1/search/scan API)
      if (decodedText.includes('ITEM')) router.push(`/dashboard/items`);
      else if (decodedText.includes('PO')) router.push(`/dashboard/purchase/orders`);
      else if (decodedText.includes('GRN')) router.push(`/dashboard/stock/grn`);
      else toast.info(`No specific route found for ${decodedText}`);
      
      onClose();
    };

    scanner.render(onScanSuccess, (err) => {
      // Ignore routine scan errors
    });

    return () => {
      scanner.clear().catch(e => console.error("Failed to clear scanner", e));
    };
  }, [isOpen, scanned, router, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-border/50 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/20">
          <div className="flex items-center gap-2">
            <QrCode className="text-primary" size={20} />
            <h2 className="font-semibold">Scan QR / Barcode</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4">
          <div id="qr-reader" className="w-full rounded-xl overflow-hidden border border-border bg-black"></div>
          <p className="text-xs text-center text-muted-foreground mt-4">
            Point your camera at a QR code to instantly navigate.
          </p>
        </div>
      </div>
    </div>
  );
}
