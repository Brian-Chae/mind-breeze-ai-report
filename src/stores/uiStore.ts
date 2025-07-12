import { create } from 'zustand';

export type MenuId = 'engine' | 'linkband' | 'visualizer' | 'datacenter' | 'cloudmanager' | 'applications' | 'settings';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  autoHide?: boolean;
  duration?: number;
}

interface UIState {
  activeMenu: MenuId;
  notifications: Notification[];
  setActiveMenu: (menu: MenuId) => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  activeMenu: 'engine',
  notifications: [],
  setActiveMenu: (menu) => set({ activeMenu: menu }),
  addNotification: (notification) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newNotification: Notification = {
      id,
      autoHide: true,
      duration: 5000,
      ...notification,
    };
    
    set((state) => ({
      notifications: [...state.notifications, newNotification]
    }));

    // 자동 숨김 처리
    if (newNotification.autoHide) {
      setTimeout(() => {
        get().removeNotification(id);
      }, newNotification.duration);
    }
  },
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id)
  })),
  clearNotifications: () => set({ notifications: [] }),
})); 