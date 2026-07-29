import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'warning' | 'error' | 'info' | 'success';
  link: string;
  read: boolean;
  module?: string;
}

interface NotificationState {
  notifications: NotificationItem[];
  addNotification: (item: Omit<NotificationItem, 'id' | 'time' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

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
    // Ignore audio restriction if user has not interacted
  }
};

const defaultNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'New Item Added',
    description: 'Item ITM-00103 (Removed Grass Cutting Machine) was successfully registered.',
    time: '5 mins ago',
    type: 'success',
    link: '/dashboard/items',
    read: false,
    module: 'Items',
  },
  {
    id: 'notif-2',
    title: 'GRN Received',
    description: 'GRN-2026-0042 recorded for Office Stationeries.',
    time: '20 mins ago',
    type: 'info',
    link: '/dashboard/stock/grn',
    read: false,
    module: 'GRN',
  },
  {
    id: 'notif-3',
    title: 'Stock Issue Approved',
    description: 'Issue VOUCHER-0089 approved for Revenue Department.',
    time: '1 hour ago',
    type: 'success',
    link: '/dashboard/stock/issue',
    read: false,
    module: 'Stock Issue',
  },
  {
    id: 'notif-4',
    title: 'Low Stock Warning',
    description: 'Scale Weights (ITM-00005) is below minimum reorder level.',
    time: '2 hours ago',
    type: 'warning',
    link: '/dashboard/items',
    read: false,
    module: 'Inventory',
  },
  {
    id: 'notif-5',
    title: 'Stock Return Logged',
    description: 'Return RET-0021 registered from Health Department.',
    time: '3 hours ago',
    type: 'info',
    link: '/dashboard/stock/return',
    read: false,
    module: 'Stock Return',
  },
];

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: defaultNotifications,

      addNotification: (item) => {
        const newNotif: NotificationItem = {
          ...item,
          id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          time: 'Just now',
          read: false,
        };

        // Play audio chime notification
        playChime();

        // Show toast popup
        if (item.type === 'success') {
          toast.success(item.title, { description: item.description });
        } else if (item.type === 'warning') {
          toast.warning(item.title, { description: item.description });
        } else if (item.type === 'error') {
          toast.error(item.title, { description: item.description });
        } else {
          toast.info(item.title, { description: item.description });
        }

        set((state) => ({
          notifications: [newNotif, ...state.notifications],
        }));
      },

      markAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),

      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),

      clearAll: () => set({ notifications: [] }),
    }),
    {
      name: 'nps-notifications',
    }
  )
);
