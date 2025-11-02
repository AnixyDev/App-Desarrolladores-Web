import { StateCreator } from 'zustand';
import { Notification } from '../../types.ts';
import { AppState } from '../useAppStore.tsx';

export interface NotificationSlice {
  notifications: Notification[];
  addNotification: (message: string, link: string) => void;
  markAllAsRead: () => void;
}

export const createNotificationSlice: StateCreator<AppState, [], [], NotificationSlice> = (set) => ({
    notifications: [],
    addNotification: (message, link) => {
        const newNotification: Notification = {
            id: `notif-${Date.now()}`,
            message,
            link,
            isRead: false,
            createdAt: new Date().toISOString(),
        };
        set(state => ({ notifications: [newNotification, ...state.notifications] }));
    },
    markAllAsRead: () => {
        set(state => ({
            notifications: state.notifications.map(n => ({ ...n, isRead: true })),
        }));
    },
});