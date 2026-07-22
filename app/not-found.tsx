'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    // GitHub Pages SPA redirect hack
    // The 404.html will load this page. We grab the pathname and redirect to the base URL
    // with the pathname as a query param. The root layout/page then parses it.
    // However, since we are inside the Next.js router already (if hydrated), 
    // it's easier to just use window.location directly.
    const path = window.location.pathname;
    if (path !== '/government-stock-system/' && path !== '/government-stock-system') {
      window.location.replace('/nps-inventory-system/?p=' + encodeURIComponent(path));
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-card border border-border rounded-2xl shadow-xl overflow-hidden p-8 text-center">
        <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <FileQuestion size={48} className="text-[#c21f4c]" />
        </div>
        
        <h1 className="text-4xl font-black text-foreground tracking-tight mb-2">404</h1>
        <h2 className="text-xl font-semibold text-foreground mb-3">Page Not Found</h2>
        
        <p className="text-muted-foreground mb-8">
          The page you are looking for doesn't exist or has been moved. Please check the URL or navigate back to the dashboard.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button 
            onClick={() => router.back()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl border border-border bg-background hover:bg-muted text-foreground transition-colors font-medium"
          >
            <ArrowLeft size={18} />
            Go Back
          </button>
          
          <Link 
            href="/dashboard"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#c21f4c] hover:bg-[#a0183e] text-white transition-colors font-medium shadow-md shadow-[#c21f4c]/20"
          >
            <Home size={18} />
            Dashboard
          </Link>
        </div>
        
        <div className="mt-10 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
            Nikaweratiya Pradeshiya Sabha
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            ANTIGRAVITY Store Management
          </p>
        </div>
      </div>
    </div>
  );
}
