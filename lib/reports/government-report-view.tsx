'use client';

import React from 'react';
import { logoBase64 } from '@/lib/assets/logo-base64';

export interface GovernmentReportViewProps {
  titleEn: string;
  titleSi: string;
  formCode?: string;
  subtitleEn?: string;
  subtitleSi?: string;
  reportRef?: string;
  generatedBy?: string;
  orientation?: 'landscape' | 'portrait';
  filterScopeStr?: string;
  summaryMetrics?: Array<{ label: string; val: string; sub?: string }>;
  tableHeaders: string[];
  tableRows: Array<Array<string | React.ReactNode>>;
  columnAlignments?: Array<'left' | 'center' | 'right'>;
  columnWidths?: string[];
}

export function GovernmentReportView(props: GovernmentReportViewProps) {
  const {
    titleEn,
    titleSi,
    formCode = 'ආකෘති පත්‍රය: පොදු 136 (ගබඩා නිකුත් කිරීම්) • FORM GENERAL 136 (STORES ISSUE)',
    subtitleEn = 'Stores & Inventory Management Division • Government Store System',
    subtitleSi = 'ගබඩා සහ බඩුතොග කළමනාකරණ අංශය',
    reportRef,
    generatedBy = 'Store Administration',
    orientation = 'landscape',
    filterScopeStr,
    summaryMetrics = [],
    tableHeaders,
    tableRows,
    columnAlignments = [],
    columnWidths = [],
  } = props;

  const now = new Date();
  const genDateStr = now.toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: 'numeric' });
  const genTimeStr = now.toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' });
  const defaultRef = reportRef || `NPS-RPT-${now.toISOString().slice(0, 10).replace(/-/g, '')}`;

  return (
    <div
      className={`government-document bg-white text-slate-900 mx-auto p-8 sm:p-10 shadow-xl border border-slate-300 font-sans ${
        orientation === 'landscape' ? 'max-w-[1200px]' : 'max-w-[850px]'
      }`}
      style={{
        fontFamily: "'Noto Sans Sinhala', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* ── 1. OFFICIAL INSTITUTIONAL HEADER ──────────────────────────── */}
      <div className="flex items-start justify-between gap-6 pb-4 border-b border-slate-200">
        {/* Emblem & Titles */}
        <div className="flex items-center gap-4">
          {logoBase64 ? (
            <img
              src={logoBase64}
              alt="Official Emblem"
              className="w-16 h-16 object-contain shrink-0 drop-shadow-sm"
            />
          ) : (
            <div className="w-16 h-16 rounded-full border-2 border-[#701a2b] flex items-center justify-center font-bold text-xs text-[#701a2b]">
              NPS
            </div>
          )}

          <div className="border-l-2 border-slate-200 pl-4 space-y-0.5">
            <p className="text-[11px] font-bold tracking-wide text-[#701a2b] uppercase">
              ශ්‍රී ලංකා ප්‍රජාතාන්ත්‍රික සමාජවාදී ජනරජය  •  DEMOCRATIC SOCIALIST REPUBLIC OF SRI LANKA
            </p>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              නිකවැරටිය ප්‍රාදේශීය සභාව  •  NIKAWERATIYA PRADESHIYA SABHA
            </h1>
            <p className="text-xs text-slate-600 font-medium">
              වයඹ පළාත් පාලන දෙපාර්තමේන්තුව  •  Department of Local Government (North Western Province)
            </p>
            <p className="text-xs text-slate-600">
              {subtitleSi}  •  {subtitleEn}
            </p>
            <div className="pt-1 flex items-center gap-2">
              <span className="text-xs font-extrabold text-[#701a2b] bg-[#701a2b]/10 px-2.5 py-0.5 rounded border border-[#701a2b]/20">
                {formCode}
              </span>
              <span className="text-sm font-black text-slate-900 tracking-wide uppercase">
                {titleSi}  •  {titleEn}
              </span>
            </div>
          </div>
        </div>

        {/* Right-side Government Document Passport Card */}
        <div className="shrink-0 w-64 border border-slate-300 rounded bg-slate-50 overflow-hidden text-xs">
          <div className="bg-[#701a2b] text-white px-3 py-1 font-bold text-[10px] tracking-wider uppercase text-center">
            නිල ලේඛන විස්තරය • OFFICIAL PASSPORT
          </div>
          <div className="p-2.5 space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500 font-semibold">FORM REF:</span>
              <span className="font-mono font-bold text-slate-900">GEN-136</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-semibold">REPORT REF:</span>
              <span className="font-mono font-bold text-slate-900">{defaultRef}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-semibold">DATE & TIME:</span>
              <span className="font-medium text-slate-800">{genDateStr}, {genTimeStr}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-semibold">STORE OFFICER:</span>
              <span className="font-medium text-slate-800 truncate max-w-[130px]">{generatedBy}</span>
            </div>
          </div>
          <div className="bg-slate-200/80 px-2 py-0.5 text-center text-[9px] font-bold text-[#701a2b] border-t border-slate-300 uppercase">
            රාජ්‍ය විගණනය සඳහා පමණි • FOR OFFICIAL AUDIT ONLY
          </div>
        </div>
      </div>

      {/* Maroon & Gold Dual Rule */}
      <div className="pt-2">
        <div className="h-0.5 bg-[#701a2b] w-full" />
        <div className="h-[1px] bg-[#d4a017] w-full mt-0.5" />
      </div>

      {/* ── 2. ACTIVE SCOPE & AUDIT PARAMETERS BANNER ─────────────────── */}
      {filterScopeStr && (
        <div className="mt-3.5 px-3.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs flex items-center gap-2">
          <span className="font-bold text-[#701a2b] shrink-0 uppercase text-[10px]">
            විෂය පථය සහ පෙරහන් / SCOPE:
          </span>
          <span className="text-slate-700 font-medium">{filterScopeStr}</span>
        </div>
      )}

      {/* ── 3. FORMAL GOVERNMENT SUMMARY LEDGER BLOCK ──────────────────── */}
      {summaryMetrics.length > 0 && (
        <div className="mt-3.5 border border-slate-300 rounded overflow-hidden grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-300 bg-white">
          {summaryMetrics.map((card, idx) => (
            <div key={idx} className="p-2.5 text-center bg-slate-50/40">
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                {card.label}
              </p>
              <p className="text-base sm:text-lg font-black text-[#701a2b] mt-0.5">
                {card.val}
              </p>
              {card.sub && (
                <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                  {card.sub}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── 4. OFFICIAL GOVERNMENT RECORDS TABLE ───────────────────────── */}
      <div className="mt-4 border border-slate-300 rounded overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#701a2b] text-white">
              {tableHeaders.map((header, idx) => {
                const align = columnAlignments[idx] || 'left';
                const width = columnWidths[idx] || 'auto';
                return (
                  <th
                    key={idx}
                    style={{ width, textAlign: align }}
                    className="p-2.5 font-bold border-r border-[#8d2238] last:border-r-0 whitespace-pre-line text-[11px]"
                  >
                    {header}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {tableRows.length > 0 ? (
              tableRows.map((row, rIdx) => (
                <tr
                  key={rIdx}
                  className={rIdx % 2 === 1 ? 'bg-slate-50/80' : 'bg-white'}
                >
                  {row.map((cell, cIdx) => {
                    const align = columnAlignments[cIdx] || 'left';
                    return (
                      <td
                        key={cIdx}
                        style={{ textAlign: align }}
                        className="p-2.5 text-slate-800 border-r border-slate-200 last:border-r-0 align-top leading-relaxed text-[11px]"
                      >
                        {cell}
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={tableHeaders.length}
                  className="p-6 text-center text-slate-500 font-medium italic"
                >
                  තොරතුරු හමු නොවීය / No inventory records match the selected scope.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── 5. STATUTORY CERTIFICATION & AUDIT SIGN-OFF BLOCK ──────────── */}
      <div className="mt-6 border border-slate-300 rounded bg-white overflow-hidden p-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <p className="text-xs font-bold text-[#701a2b] uppercase tracking-wider">
            නිල ප්‍රකාශනය සහ ව්‍යවස්ථාපිත සහතික කිරීම  •  STATUTORY DECLARATION & AUDIT SIGN-OFF
          </p>
          <span className="text-[10px] text-slate-500 font-mono">FR-136 VERIFICATION</span>
        </div>

        <p className="text-[10.5px] text-slate-600 mt-2 leading-relaxed">
          ඉහත විස්තර කරන ලද සියලු තොරතුරු නියමිත පරිදි බලයලත් ඉල්ලුම්පත් හා ගබඩා ප්‍රධාන ලේඛන (Store Ledger / Bin Cards) හා සසඳා බලා නිවැරදි බවට මෙයින් සහතික කරමි.
          <br />
          <span className="italic text-slate-500">
            I hereby certify that the particulars of inventory enumerated above have been duly verified with official Store Ledgers and requisitions.
          </span>
        </p>

        {/* 3 Signatures + Official Seal */}
        <div className="mt-6 grid grid-cols-4 gap-4 items-end">
          {/* 1. Store Keeper */}
          <div className="text-center">
            <div className="border-b border-dashed border-slate-400 pb-1 h-8 flex items-end justify-center" />
            <p className="text-[11px] font-bold text-slate-900 mt-1.5">
              සකස් කළේ / PREPARED BY
            </p>
            <p className="text-[10px] text-slate-600">ගබඩා භාරකරු / Store Keeper</p>
            <p className="text-[10px] text-slate-400 mt-0.5">දිනය / Date: ....................</p>
          </div>

          {/* 2. Internal Auditor */}
          <div className="text-center">
            <div className="border-b border-dashed border-slate-400 pb-1 h-8 flex items-end justify-center" />
            <p className="text-[11px] font-bold text-slate-900 mt-1.5">
              පරීක්ෂා කළේ / AUDITED & VERIFIED
            </p>
            <p className="text-[10px] text-slate-600">අභ්‍යන්තර විගණක / Accountant</p>
            <p className="text-[10px] text-slate-400 mt-0.5">දිනය / Date: ....................</p>
          </div>

          {/* 3. Secretary / Chairman */}
          <div className="text-center">
            <div className="border-b border-dashed border-slate-400 pb-1 h-8 flex items-end justify-center" />
            <p className="text-[11px] font-bold text-slate-900 mt-1.5">
              අනුමත කළේ / APPROVED
            </p>
            <p className="text-[10px] text-slate-600">ලේකම් / සභාපති (Secretary / Chairman)</p>
            <p className="text-[10px] text-slate-400 mt-0.5">දිනය / Date: ....................</p>
          </div>

          {/* 4. Official Seal Box */}
          <div className="border border-dashed border-slate-400 rounded h-24 flex flex-col items-center justify-center text-center p-2 text-slate-400 bg-slate-50/50">
            <span className="text-[10px] font-bold text-slate-500">නිල මුද්‍රාව සඳහා</span>
            <span className="text-[9px] uppercase tracking-wider font-semibold">OFFICIAL SEAL</span>
          </div>
        </div>
      </div>

      {/* ── 6. OFFICIAL RUNNING FOOTER ─────────────────────────────────── */}
      <div className="mt-6 pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
        <span>නිකවැරටිය ප්‍රාදේශීය සභාව  •  NIKAWERATIYA PRADESHIYA SABHA</span>
        <span className="font-bold text-[#701a2b]">
          රාජ්‍ය විගණනය සහ නිල කටයුතු සඳහා පමණි  •  FOR OFFICIAL USE & AUDIT ONLY
        </span>
        <span>පිටුව / Page 1 of 1</span>
      </div>
    </div>
  );
}
