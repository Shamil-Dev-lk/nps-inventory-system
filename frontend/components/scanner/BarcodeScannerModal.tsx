'use client';

import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, QrCode } from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (decodedText: string) => void;
}

export function BarcodeScannerModal({ isOpen, onClose, onScan }: BarcodeScannerModalProps) {
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setScanned(false);
      return;
    }

    const scanner = new Html5QrcodeScanner(
      "barcode-reader",
      { fps: 10, qrbox: { width: 250, height: 150 }, rememberLastUsedCamera: true },
      /* verbose= */ false
    );

    const onScanSuccess = (decodedText: string) => {
      if (scanned) return;
      setScanned(true);
      scanner.clear();
      onScan(decodedText);
      onClose();
    };

    scanner.render(onScanSuccess, (err) => {
      // Ignore routine scan errors
    });

    return () => {
      scanner.clear().catch(e => console.error("Failed to clear scanner", e));
    };
  }, [isOpen, scanned, onScan, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-border/50 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/20">
          <div className="flex items-center gap-2">
            <QrCode className="text-primary" size={20} />
            <h2 className="font-semibold">Scan Barcode</h2>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4">
          <div id="barcode-reader" className="w-full rounded-xl overflow-hidden border border-border bg-black"></div>
          <p className="text-xs text-center text-muted-foreground mt-4">
            Point your camera at a barcode or QR code to instantly add the item.
          </p>
        </div>
      </div>
    </div>
  );
}
