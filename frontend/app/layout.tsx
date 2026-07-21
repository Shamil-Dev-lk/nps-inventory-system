import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: {
    default: 'ANTIGRAVITY — Government Store Management',
    template: '%s | ANTIGRAVITY',
  },
  description: 'Enterprise Government Store & Inventory Management System for Pradeshiya Sabha, Sri Lanka.',
  keywords: ['inventory', 'store', 'government', 'pradeshiya sabha', 'sri lanka'],
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Sinhala:wght@400;500;600;700&family=Noto+Sans+Tamil:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            richColors
            closeButton
            expand={false}
            toastOptions={{ classNames: { toast: 'font-sans text-sm' } }}
          />
        </Providers>
      </body>
    </html>
  );
}
