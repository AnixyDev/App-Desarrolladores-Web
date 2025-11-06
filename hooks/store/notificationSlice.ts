import { StateCreator } from 'zustand';
import { Notification } from '../../types.ts';
import { AppState } from '../useAppStore.tsx';

export interface NotificationSlice {
  notifications: Notification[];
  notifiedInvoiceIds: string[];
  addNotification: (message: string, link: string) => void;
  markAllAsRead: () => void;
  markInvoiceAsNotified: (invoiceId: string) => void;
  checkInvoiceStatuses: () => string[];
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
        const emailMessages: string[] = [];
        const { invoices, notifiedInvoiceIds, addNotification, markInvoiceAsNotified, getClientById, profile } = get();
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
            
            let shouldNotify = false;
            let inAppMessage = '';

            if (diffDays < 0) {
                shouldNotify = true;
                inAppMessage = `¡Alerta! La factura #${invoice.invoice_number} para ${clientName} ha vencido.`;
                if (profile.email_notifications.on_invoice_overdue) {
                    emailMessages.push(`Simulación: Email enviado a ${profile.email} por la factura vencida #${invoice.invoice_number} para ${clientName}.`);
                }
            } else if (diffDays <= 3) {
                shouldNotify = true;
                inAppMessage = `La factura #${invoice.invoice_number} para ${clientName} vence en ${diffDays === 0 ? 'hoy' : `${diffDays} día(s)`}.`;
            }

            if (shouldNotify) {
                addNotification(inAppMessage, '/invoices');
                markInvoiceAsNotified(invoice.id);
            }
        });
        return emailMessages;
    },
});