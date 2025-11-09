import { StateCreator } from 'zustand';
import { Notification } from '../../types';
import { AppState } from '../useAppStore';

// Helper function to send emails via the backend
const sendSystemEmail = async (to: string, subject: string, html: string) => {
    try {
        await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to, subject, html }),
        });
    } catch (error) {
        console.error("Failed to send system email:", error);
    }
};

export interface NotificationSlice {
  notifications: Notification[];
  notifiedInvoiceIds: string[];
  addNotification: (message: string, link: string) => void;
  markAllAsRead: () => void;
  markInvoiceAsNotified: (invoiceId: string) => void;
  checkInvoiceStatuses: () => string[]; // Returns user-facing toast messages
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
        const toastMessages: string[] = [];
        const { invoices, notifiedInvoiceIds, addNotification, markInvoiceAsNotified, getClientById, profile } = get();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        invoices.forEach(invoice => {
            if (invoice.paid || notifiedInvoiceIds.includes(invoice.id)) {
                return;
            }

            const dueDate = new Date(invoice.due_date);
            const client = getClientById(invoice.client_id);
            const clientName = client?.name || 'un cliente';
            const diffTime = dueDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            const replacePlaceholders = (template: string) => template
                .replace(/\[ClientName\]/g, client?.name || '')
                .replace(/\[InvoiceNumber\]/g, invoice.invoice_number)
                .replace(/\[Amount\]/g, new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(invoice.total_cents / 100))
                .replace(/\[DueDate\]/g, invoice.due_date)
                .replace(/\[YourName\]/g, profile.full_name);

            let shouldNotify = false;
            let inAppMessage = '';
            const isOverdue = diffDays < 0;
            const isUpcoming = diffDays >= 0 && diffDays <= 3;

            if (isOverdue) {
                shouldNotify = true;
                inAppMessage = `¡Alerta! La factura #${invoice.invoice_number} para ${clientName} ha vencido.`;

                if (profile.email_notifications.on_invoice_overdue) {
                    sendSystemEmail(profile.email, `Factura Vencida: #${invoice.invoice_number}`, `<p>Hola ${profile.full_name},</p><p>La factura #${invoice.invoice_number} para ${clientName} ha vencido.</p>`);
                    toastMessages.push(`Notificación de factura vencida enviada a tu email.`);
                }

                if (profile.payment_reminders_enabled && client?.email) {
                    const emailBody = replacePlaceholders(profile.reminder_template_overdue);
                    sendSystemEmail(client.email, `Recordatorio de Pago: Factura #${invoice.invoice_number}`, `<p>${emailBody.replace(/\n/g, '<br>')}</p>`);
                    toastMessages.push(`Recordatorio de pago VENCIDO enviado a ${client.name}.`);
                }
            } else if (isUpcoming) {
                shouldNotify = true;
                inAppMessage = `La factura #${invoice.invoice_number} para ${clientName} vence en ${diffDays === 0 ? 'hoy' : `${diffDays} día(s)`}.`;

                if (profile.payment_reminders_enabled && client?.email) {
                    const emailBody = replacePlaceholders(profile.reminder_template_upcoming);
                    sendSystemEmail(client.email, `Recordatorio: Vencimiento de Factura #${invoice.invoice_number}`, `<p>${emailBody.replace(/\n/g, '<br>')}</p>`);
                    toastMessages.push(`Recordatorio de PRÓXIMO vencimiento enviado a ${client.name}.`);
                }
            }

            if (shouldNotify) {
                addNotification(inAppMessage, '/invoices');
                markInvoiceAsNotified(invoice.id);
            }
        });
        return toastMessages;
    },
});