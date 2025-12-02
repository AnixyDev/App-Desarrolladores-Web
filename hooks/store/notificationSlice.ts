import { StateCreator } from 'zustand';
import { Notification } from '../../types.ts';
import { AppState } from '../useAppStore.tsx';

export interface NotificationSlice {
  notifications: Notification[];
  notifiedInvoiceIds: string[];
  addNotification: (message: string, link: string) => void;
  markAllAsRead: () => void;
  markInvoiceAsNotified: (invoiceId: string) => void;
  checkInvoiceStatuses: () => void;
}

export const createNotificationSlice: StateCreator<AppState, [], [], NotificationSlice> = (set, get) => ({
    notifications: [],
    notifiedInvoiceIds: [],
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
    markInvoiceAsNotified: (invoiceId) => {
        set(state => ({
            notifiedInvoiceIds: [...new Set([...state.notifiedInvoiceIds, invoiceId])]
        }));
    },
    checkInvoiceStatuses: () => {
        const { invoices, notifiedInvoiceIds, addNotification, markInvoiceAsNotified, getClientById } = get();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        invoices.forEach(invoice => {
            if (invoice.paid || notifiedInvoiceIds.includes(invoice.id)) {
                return;
            }

            const dueDate = new Date(invoice.due_date);
            const clientName = getClientById(invoice.client_id)?.name || 'un cliente';
            const diffTime = dueDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays < 0) {
                addNotification(`¡Alerta! La factura #${invoice.invoice_number} para ${clientName} ha vencido.`, '/invoices');
                markInvoiceAsNotified(invoice.id);
            } else if (diffDays <= 3) {
                addNotification(`La factura #${invoice.invoice_number} para ${clientName} vence en ${diffDays === 0 ? 'hoy' : `${diffDays} día(s)`}.`, '/invoices');
                markInvoiceAsNotified(invoice.id);
            }
        });
    },
});