'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, Download, RefreshCw, Aperture, Sparkles, Film, Check, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PHOTO_QUOTES = [
  { quote: "You don't take a photograph, you make it.", author: "Ansel Adams" },
  { quote: "Your first 10,000 photographs are your worst.", author: "Henri Cartier-Bresson" },
  { quote: "Photography is the story I fail to put into words.", author: "Destin Sparks" },
  { quote: "When words become unclear, I shall focus with photographs.", author: "Ansel Adams" },
  { quote: "In photography there is a reality so subtle that it becomes more real than reality.", author: "Alfred Stieglitz" },
];

const FILTERS = [
  { id: 'vintage', name: 'Classic Sepia', css: 'sepia(0.6) contrast(1.1) brightness(0.95)' },
  { id: 'film', name: '35mm Film', css: 'contrast(1.25) saturate(1.3) hue-rotate(-5deg)' },
  { id: 'bw', name: 'Monochrome B&W', css: 'grayscale(1) contrast(1.3)' },
  { id: 'vivid', name: 'Vivid Cyber', css: 'saturate(1.8) contrast(1.1)' },
  { id: 'normal', name: 'Natural Lens', css: 'none' },
];

export function PhotographyStudioModal({
  isOpen,
  onClose,
  orgName = 'ANTIGRAVITY Store',
}: {
  isOpen: boolean;
  onClose: () => void;
  orgName?: string;
}) {
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [activeFilter, setActiveFilter] = useState(FILTERS[0]);
  const [isShutterFlashing, setIsShutterFlashing] = useState(false);
  const [photoCaptured, setPhotoCaptured] = useState(false);
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Play mechanical shutter click sound using Web Audio API
  const playShutterSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      // Click 1 (Mechanical release)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(800, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);
      gain1.gain.setValueAtTime(0.3, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.05);

      // Click 2 (Mirror flip back)
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(400, ctx.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.08);
        gain2.gain.setValueAtTime(0.2, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start();
        osc2.stop(ctx.currentTime + 0.08);
      }, 70);
    } catch {
      // Audio context silenced by browser policy
    }
  };

  const handleCapture = () => {
    playShutterSound();
    setIsShutterFlashing(true);
    setTimeout(() => setIsShutterFlashing(false), 300);

    // Generate Photo Card Canvas
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 500;

    // Background Gradient
    const grad = ctx.createLinearGradient(0, 0, 800, 500);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.5, '#1e1b4b');
    grad.addColorStop(1, '#311042');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 500);

    // Decorative Aperture Ring
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.15)';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(700, 100, 160, 0, Math.PI * 2);
    ctx.stroke();

    // Frame Border
    ctx.strokeStyle = '#fdb913';
    ctx.lineWidth = 4;
    ctx.strokeRect(30, 30, 740, 440);

    // Header Badge
    ctx.fillStyle = '#fdb913';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('📸 WORLD PHOTOGRAPHY DAY 2026', 60, 75);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText(orgName, 60, 120);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px monospace';
    ctx.fillText(`ISO 100  •  f/2.8  •  1/1000s  •  RAW FINE  •  ${new Date().toLocaleDateString()}`, 60, 150);

    // Quote Section
    const currentQuote = PHOTO_QUOTES[quoteIdx];
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'italic 20px Georgia, serif';
    ctx.fillText(`"${currentQuote.quote}"`, 60, 240);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`— ${currentQuote.author}`, 60, 275);

    // Bottom Badge
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(60, 340, 680, 80);

    ctx.fillStyle = '#ffffff';
    ctx.font = '14px sans-serif';
    ctx.fillText('🏆 Official World Photography Day Commemorative Snapshot', 80, 375);
    ctx.fillStyle = '#a7f3d0';
    ctx.font = '12px monospace';
    ctx.fillText('Verified Asset Management & Photographic Precision', 80, 398);

    const dataUrl = canvas.toDataURL('image/png');
    setCapturedDataUrl(dataUrl);
    setPhotoCaptured(true);
  };

  const handleDownload = () => {
    if (!capturedDataUrl) return;
    const a = document.createElement('a');
    a.href = capturedDataUrl;
    a.download = `World_Photography_Day_2026_${Date.now()}.png`;
    a.click();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        {/* Shutter Flash Effect */}
        {isShutterFlashing && (
          <div className="fixed inset-0 bg-white z-[100] pointer-events-none animate-ping" />
        )}

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-slate-900 border border-slate-700 text-white rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden relative flex flex-col max-h-[90vh]"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
                <Camera size={18} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                  Virtual Camera Studio 📷
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono">Aug 19</span>
                </h3>
                <p className="text-xs text-slate-400">World Photography Day Special Edition</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Camera Viewfinder View */}
          <div className="p-6 overflow-y-auto space-y-6">
            {/* Viewfinder Display Box */}
            <div
              className="relative rounded-2xl border-2 border-slate-700 overflow-hidden bg-slate-950 p-6 min-h-[260px] flex flex-col justify-between shadow-inner"
              style={{ filter: activeFilter.css }}
            >
              {/* HUD Overlay Elements */}
              <div className="flex justify-between items-start text-[11px] font-mono text-emerald-400 select-none">
                <div className="flex items-center gap-2">
                  <span className="bg-red-600 text-white px-1.5 py-0.5 rounded font-bold animate-pulse">● REC</span>
                  <span>RAW + FINE</span>
                </div>
                <div className="flex items-center gap-3">
                  <span>ISO 100</span>
                  <span>f/2.8</span>
                  <span>1/1000s</span>
                  <span className="text-amber-400 font-bold">⚡ FLASH ON</span>
                </div>
              </div>

              {/* Viewfinder Center Crosshair Grid */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                <div className="w-24 h-24 border border-dashed border-white rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-amber-400 rounded-full" />
                </div>
                <div className="absolute w-full h-[1px] bg-white/20" />
                <div className="absolute h-full w-[1px] bg-white/20" />
              </div>

              {/* Center Quote Content inside Viewfinder */}
              <div className="my-6 relative z-10 text-center space-y-2 max-w-xl mx-auto px-4">
                <p className="text-lg md:text-xl font-serif italic text-amber-200 leading-snug">
                  &quot;{PHOTO_QUOTES[quoteIdx].quote}&quot;
                </p>
                <p className="text-xs font-semibold text-slate-300">
                  — {PHOTO_QUOTES[quoteIdx].author}
                </p>
              </div>

              {/* Bottom HUD */}
              <div className="flex justify-between items-end text-[11px] font-mono text-slate-400 z-10">
                <span>AF-S [SINGLE FOCUS]</span>
                <span className="text-amber-300">BATTERY: 98% 🔋</span>
              </div>
            </div>

            {/* Hidden Canvas for generating downloadable image */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Quote Cycler & Filter Selector */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-400" /> Inspiration Quote
                  </span>
                  <button
                    onClick={() => setQuoteIdx((prev) => (prev + 1) % PHOTO_QUOTES.length)}
                    className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 hover:underline"
                  >
                    <RefreshCw size={12} /> Next Quote
                  </button>
                </div>
                <p className="text-xs text-slate-400 italic">
                  Change quote before taking your snapshot card!
                </p>
              </div>

              {/* Lens Filters */}
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 space-y-2">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Film size={14} className="text-amber-400" /> Lens Filter Mode
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {FILTERS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setActiveFilter(f)}
                      className={`text-xs px-2.5 py-1 rounded-lg transition-all ${
                        activeFilter.id === f.id
                          ? 'bg-amber-500 text-slate-950 font-bold shadow'
                          : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="p-6 border-t border-slate-800 bg-slate-950/50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              onClick={handleCapture}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-extrabold text-sm rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95"
            >
              <Aperture size={18} /> Take Snapshot 📸
            </button>

            {photoCaptured && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 w-full sm:w-auto"
              >
                <button
                  onClick={handleDownload}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition-all hover:scale-105"
                >
                  <Download size={16} /> Download Photo Card 🖼️
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
