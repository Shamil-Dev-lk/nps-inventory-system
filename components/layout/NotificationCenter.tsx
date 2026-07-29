'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { 
  Bell, AlertTriangle, PackageX, ShoppingBag, 
  CheckCheck, ShieldCheck, ArrowRight, PackagePlus,
  ArrowRightLeft, RotateCcw, Sliders, ClipboardCheck, Trash2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useNotificationStore, NotificationItem } from '@/store/notification-store';

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { notifications, markAsRead, markAllAsRead, clearAll } = useNotificationStore();

  useEffect(() => {
    setMounted(true);
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live database alerts (Low stock & Out of stock)
  const { data: dbStockAlerts = [] } = useQuery({
    queryKey: ['notification-db-stock'],
    queryFn: async () => {
      const { data } = await supabase
        .from('items')
        .select('id, name_en, code, current_quantity, reorder_level')
        .or('current_quantity.eq.0,current_quantity.lte.reorder_level')
        .limit(10);
      return data || [];
    },
    refetchInterval: 15000,
  });

  // Combine DB alerts with store notifications
  const dbNotifications: NotificationItem[] = dbStockAlerts.map((item: any) => ({
    id: `db-stock-${item.id}`,
    title: item.current_quantity === 0 ? 'Out of Stock Alert' : 'Low Stock Warning',
    description: `${item.name_en} (${item.code || 'N/A'}) is ${item.current_quantity === 0 ? 'out of stock' : `low in stock (${item.current_quantity} remaining)`}`,
    time: 'Live System Alert',
    type: item.current_quantity === 0 ? 'error' : 'warning',
    link: '/dashboard/items',
    read: false,
    module: 'Inventory',
  }));

  const allNotifications = [...dbNotifications, ...notifications];
  const unreadCount = allNotifications.filter((n) => !n.read).length;

  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      // Ignore audio restriction
    }
  };

  const handleToggle = () => {
    playChime();
    setIsOpen(!isOpen);
  };

  const handleNotificationClick = (item: NotificationItem) => {
    markAsRead(item.id);
    setIsOpen(false);
    if (item.link) {
      router.push(item.link);
    }
  };

  const getIcon = (item: NotificationItem) => {
    if (item.module === 'Items' || item.module === 'Inventory') {
      if (item.type === 'error') return <PackageX size={16} className="text-red-500" />;
      if (item.type === 'warning') return <AlertTriangle size={16} className="text-amber-500" />;
      return <PackagePlus size={16} className="text-emerald-500" />;
    }
    if (item.module === 'GRN') return <ShoppingBag size={16} className="text-blue-500" />;
    if (item.module === 'Stock Issue') return <ArrowRightLeft size={16} className="text-indigo-500" />;
    if (item.module === 'Stock Return') return <RotateCcw size={16} className="text-amber-500" />;
    if (item.module === 'Stock Adjustment') return <Sliders size={16} className="text-purple-500" />;
    if (item.module === 'Stock Taking') return <ClipboardCheck size={16} className="text-cyan-500" />;

    return <ShieldCheck size={16} className="text-emerald-500" />;
  };

  if (!mounted) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus:outline-none"
        aria-label="Open notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-background animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-3 border-b border-border flex items-center justify-between bg-muted/40">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-primary" />
              <h3 className="font-semibold text-sm text-foreground">Notifications</h3>
              {unreadCount > 0 && (
                <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-medium">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
              >
                <CheckCheck size={14} /> Mark read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-border">
            {allNotifications.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-xs">
                No notifications right now
              </div>
            ) : (
              allNotifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-3 text-xs cursor-pointer hover:bg-muted/50 transition-colors flex items-start gap-3 ${
                    !item.read ? 'bg-primary/5 font-semibold' : 'opacity-70'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {getIcon(item)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-foreground truncate">{item.title}</p>
                      <span className="text-[10px] text-muted-foreground shrink-0">{item.time}</span>
                    </div>
                    <p className="text-muted-foreground line-clamp-2 mt-0.5">{item.description}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-2.5 border-t border-border bg-muted/20 flex items-center justify-between text-xs">
            <button
              onClick={clearAll}
              className="text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
            >
              <Trash2 size={13} /> Clear history
            </button>

            <button
              onClick={() => { setIsOpen(false); router.push('/dashboard/settings/audit-log'); }}
              className="text-primary font-medium hover:underline inline-flex items-center gap-1"
            >
              Audit Log <ArrowRight size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
