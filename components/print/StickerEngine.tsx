import React, { forwardRef } from 'react';
import QRCode from 'react-qr-code';
import Barcode from 'react-barcode';
import { useOrgStore } from '@/store/org-store';

export type StickerSize = '30x20' | '50x25' | '75x50' | '100x50' | 'A4' | 'custom';

interface StickerProps {
  code: string;
  type: 'qr' | 'barcode' | 'both';
  title?: string;
  subtitle?: string;
  price?: string;
  size?: StickerSize;
  layout?: 'roll' | 'sheet';
  orgOverride?: any;
}

export const StickerEngine = forwardRef<HTMLDivElement, StickerProps>(
  ({ code, type = 'barcode', title, subtitle, price, size = '50x25', layout = 'roll', orgOverride }, ref) => {
    const { org: storeOrg } = useOrgStore();
    const org = orgOverride || storeOrg;

    const configKey = type === 'both' ? 'sticker' : type;
    const printSettings = org?.print_settings?.[configKey] || {};
    const finalSize = (printSettings.size as StickerSize) || size || '50x25';
    
    const nameEn = printSettings.name_en || printSettings.header || org?.name_en || 'Organization Name';
    const nameSi = printSettings.name_si || org?.name_si;
    const nameTa = printSettings.name_ta || org?.name_ta;
    const telephone = printSettings.telephone || org?.telephone;
    const hidePrice = printSettings.hide_price === true;

    // We use a FIXED base pixel canvas width (400px) and scale it down to physical mm dimensions.
    // This bypasses browser minimum font-size limitations and ensures PERFECT proportional scaling across all physical sizes.
    const dimensions = {
      '30x20': { w: '30mm', h: '20mm', baseW: 400, baseH: 267 }, // 1.5 ratio
      '50x25': { w: '50mm', h: '25mm', baseW: 400, baseH: 200 }, // 2.0 ratio
      '75x50': { w: '75mm', h: '50mm', baseW: 400, baseH: 267 }, // 1.5 ratio
      '100x50': { w: '100mm', h: '50mm', baseW: 400, baseH: 200 }, // 2.0 ratio
      'A4': { w: '210mm', h: '297mm', baseW: 800, baseH: 1131 }, // A4 uses larger base for resolution
    };

    const currentDim = dimensions[finalSize === 'custom' ? '50x25' : finalSize] || dimensions['50x25'];

    // Override with custom dimensions if specified
    if (finalSize === 'custom') {
      const customW = parseFloat(printSettings.custom_w);
      const customH = parseFloat(printSettings.custom_h);
      if (customW > 0) currentDim.w = `${customW}mm`;
      if (customH > 0) currentDim.h = `${customH}mm`;
      
      // Calculate a rough base size maintaining ratio based on physical mm
      if (customW > 0 && customH > 0) {
        currentDim.baseW = 400;
        currentDim.baseH = Math.round(400 * (customH / customW));
      }
    }

    const fontScale = parseFloat(printSettings.font_scale) || 100;
    const fontMultiplier = fontScale / 100;

    return (
      <div 
        ref={ref} 
        className={`sticker-container bg-white text-black overflow-hidden relative ${layout === 'sheet' ? 'inline-block m-1 border border-dashed border-gray-300 shadow-sm' : 'block mb-0 print:mb-0 print:pb-0 border-b border-dashed border-gray-300 print:border-none shadow-sm print:shadow-none'}`}
        style={{ 
          width: currentDim.w, 
          height: currentDim.h,
          maxHeight: currentDim.h,
          boxSizing: 'border-box'
        }}
      >
        <style type="text/css" media="print">{`
          @page { 
            size: ${layout === 'sheet' ? 'A4' : `${currentDim.w} ${currentDim.h}`};
            margin: 0;
            padding: 0;
          }
          html, body { 
            background: white !important; 
            margin: 0 !important; 
            padding: 0 !important; 
            -webkit-print-color-adjust: exact;
          }
          .sticker-container { 
            border: none !important; 
            margin: 0 !important;
            padding: 0 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: always;
            break-after: page;
            box-shadow: none !important;
          }
          .sticker-container:last-child {
            page-break-after: auto;
            break-after: auto;
          }
          .no-print { display: none !important; }
        `}</style>
        
        {/* The Base Canvas which is scaled down to fit the physical container */}
        <div 
          className="flex flex-col items-center justify-start text-center bg-white overflow-hidden absolute top-0 left-0" 
          style={{ 
            width: `${currentDim.baseW}px`, 
            height: `${currentDim.baseH}px`,
            transformOrigin: 'top left',
            transform: `scale(${parseFloat(currentDim.w) * 3.78 / currentDim.baseW})` // Approximate px to mm scale
          }}
        >
          {/* Official Government Branding Header */}
          <div className="w-full flex items-center justify-center gap-2 border-b-[2px] border-black/20 pb-1 mb-1 px-4 mt-1 shrink-0">
            <img src={org?.official_logo_url || '/nps-inventory-system/logo.png'} alt="Logo" className="w-[36px] h-[36px] object-contain grayscale shrink-0" onError={(e) => e.currentTarget.style.display = 'none'} />
            <div className="flex flex-col items-start leading-[1.1] text-left overflow-hidden w-full">
              {nameSi && <span className="font-extrabold tracking-tight truncate w-full" style={{fontSize: `${14 * fontMultiplier}px`}}>{nameSi}</span>}
              {nameTa && <span className="font-bold tracking-tight truncate w-full" style={{fontSize: `${11 * fontMultiplier}px`}}>{nameTa}</span>}
              <span className="font-bold uppercase tracking-wide text-gray-800 truncate w-full" style={{fontSize: `${11 * fontMultiplier}px`}}>{nameEn}</span>
              {telephone && <span className="font-medium text-gray-600 mt-[1px] truncate w-full" style={{fontSize: `${10 * fontMultiplier}px`}}>Tel: {telephone}</span>}
            </div>
          </div>

          {title && <div className="font-bold leading-tight w-full truncate px-4 mt-1 shrink-0" style={{fontSize: `${18 * fontMultiplier}px`}}>{title}</div>}
          
          <div className="flex items-center justify-center gap-4 my-auto flex-1 min-h-0">
            {(type === 'qr' || type === 'both') && (
              <div className="bg-white p-1 shrink-0">
                <QRCode value={code} size={type === 'both' ? 50 : 70} />
              </div>
            )}
            {(type === 'barcode' || type === 'both') && (
              <div className="overflow-hidden bg-white px-2">
                <Barcode 
                  value={code} 
                  width={type === 'both' ? 1.4 : 1.8} 
                  height={type === 'both' ? 30 : 40} 
                  fontSize={type === 'both' ? 12 : 14} 
                  margin={0}
                  displayValue={type !== 'both'}
                />
              </div>
            )}
          </div>
          
          <div className="flex justify-between w-full px-4 pb-2 items-end shrink-0">
            <div className="text-gray-600 font-mono font-bold tracking-wider" style={{fontSize: `${12 * fontMultiplier}px`}}>{type === 'both' ? code : subtitle}</div>
            {!hidePrice && price && <div className="font-black tracking-wide" style={{fontSize: `${15 * fontMultiplier}px`}}>{price}</div>}
          </div>
        </div>
      </div>
    );
  }
);

StickerEngine.displayName = 'StickerEngine';
