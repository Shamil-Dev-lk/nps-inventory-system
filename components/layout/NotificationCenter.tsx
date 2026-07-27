'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { 
  Bell, AlertTriangle, PackageX, ShoppingBag, 
  CheckCheck, ShieldCheck, ArrowRight, X 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'warning' | 'error' | 'info' | 'success';
  link: string;
  read: boolean;
}

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [readIds, setReadIds] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch low stock / out of stock items
  const { data: stockAlerts = [] } = useQuery({
    queryKey: ['notification-stock-alerts'],
    queryFn: async () => {
      const { data } = await supabase
        .from('items')
        .select('id, name_en, code, current_quantity, reorder_level')
        .or('current_quantity.eq.0,current_quantity.lte.reorder_level')
        .limit(10);
      return data || [];
    },
    refetchInterval: 30000,
  });

  // Fetch pending POs
  const { data: pendingPOs = [] } = useQuery({
    queryKey: ['notification-pending-pos'],
    queryFn: async () => {
      const { data } = await supabase
        .from('purchase_orders')
        .select('id, po_number, total_amount, created_at')
        .eq('status', 'pending')
        .limit(5);
      return data || [];
    },
    refetchInterval: 30000,
  });

  // Construct notification list
  const notifications: NotificationItem[] = [
    ...stockAlerts.map((item: any) => ({
      id: `stock-${item.id}`,
      title: item.current_quantity === 0 ? 'Out of Stock Alert' : 'Low Stock Warning',
      description: `${item.name_en} (${item.code}) is ${item.current_quantity === 0 ? 'out of stock' : `low in stock (${item.current_quantity} left)`}`,
      time: 'Just now',
      type: (item.current_quantity === 0 ? 'error' : 'warning') as 'error' | 'warning',
      link: '/dashboard/items',
      read: readIds.includes(`stock-${item.id}`),
    })),
    ...pendingPOs.map((po: any) => ({
      id: `po-${po.id}`,
      title: 'Pending Purchase Order',
      description: `PO #${po.po_number} requires review and approval`,
      time: new Date(po.created_at || Date.now()).toLocaleDateString(),
      type: 'info' as 'info',
      link: '/dashboard/purchase/orders',
      read: readIds.includes(`po-${po.id}`),
    })),
    {
      id: 'system-log',
      title: 'System Audit Log Active',
      description: 'All system activities and stock movements are being recorded.',
      time: 'Today',
      type: 'success',
      link: '/dashboard/settings/audit-log',
      read: readIds.includes('system-log'),
    }
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

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

  const markAllAsRead = () => {
    setReadIds(notifications.map(n => n.id));
  };

  const handleNotificationClick = (item: NotificationItem) => {
    setReadIds(prev => [...prev, item.id]);
    setIsOpen(false);
    router.push(item.link);
  };

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
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-xs">
                No notifications right now
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-3 text-xs cursor-pointer hover:bg-muted/50 transition-colors flex items-start gap-3 ${
                    !item.read ? 'bg-primary/5 font-medium' : 'opacity-70'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {item.type === 'error' && <PackageX size={16} className="text-red-500" />}
                    {item.type === 'warning' && <AlertTriangle size={16} className="text-amber-500" />}
                    {item.type === 'info' && <ShoppingBag size={16} className="text-blue-500" />}
                    {item.type === 'success' && <ShieldCheck size={16} className="text-emerald-500" />}
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

          <div className="p-2.5 border-t border-border bg-muted/20 text-center">
            <button
              onClick={() => { setIsOpen(false); router.push('/dashboard/settings/audit-log'); }}
              className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1"
            >
              View System Audit Logs <ArrowRight size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
