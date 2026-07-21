'use client';

import { useEffect } from 'react';
import { useOrgStore } from '@/store/org-store';
import { useTheme } from 'next-themes';

function hexToHSL(hex: string): { h: number, s: number, l: number } {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) hex = hex.split('').map(x => x + x).join('');
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function applyThemeVars(color: string, resolvedTheme: string) {
  let validHex = color;
  if (!/^#[0-9A-F]{6}$/i.test(validHex)) {
     validHex = '#1D4ED8';
  }

  const { h, s, l } = hexToHSL(validHex);
  const root = document.documentElement;

  if (resolvedTheme === 'dark') {
    root.style.setProperty('--background', `${h} 30% 5%`);
    root.style.setProperty('--foreground', `${h} 10% 90%`);
    // Ensure primary is bright enough for dark mode contrast
    const primaryL = Math.max(l, 45); 
    root.style.setProperty('--primary', `${h} ${s}% ${primaryL}%`);
    root.style.setProperty('--muted', `${h} 20% 15%`);
    root.style.setProperty('--border', `${h} 20% 20%`);
    root.style.setProperty('--sidebar-background', `${h} 40% 8%`);
    root.style.setProperty('--sidebar-primary', `${h} ${s}% ${primaryL}%`);
    root.style.setProperty('--sidebar-accent', `${h} 30% 15%`);
  } else {
    root.style.setProperty('--background', `${h} 20% 99%`);
    root.style.setProperty('--foreground', `${h} 40% 10%`);
    const primaryL = Math.min(l, 45); // ensure it's dark enough for light mode
    root.style.setProperty('--primary', `${h} ${s}% ${primaryL}%`);
    root.style.setProperty('--muted', `${h} 15% 95%`);
    root.style.setProperty('--border', `${h} 20% 90%`);
    root.style.setProperty('--sidebar-background', `${h} 40% 10%`);
    root.style.setProperty('--sidebar-primary', `${h} ${s}% ${primaryL}%`);
    root.style.setProperty('--sidebar-accent', `${h} 30% 18%`);
  }
}

export function ThemeSetter() {
  const { org } = useOrgStore();
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (org?.primary_color) {
      applyThemeVars(org.primary_color, resolvedTheme || 'light');
    }
  }, [org?.primary_color, resolvedTheme]);

  return null;
}
