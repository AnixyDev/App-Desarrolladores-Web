import { supabase } from '../../lib/supabaseClient';
import type { StateCreator } from 'zustand';
import type { AppStore } from '../useAppStore';
import { Invoice, RecurringInvoice, Expense, TimeEntry, Budget, Proposal, Contract, NewTimeEntry, ShadowIncomeEntry } from '../../types';
import { formatCurrency } from '../../lib/utils';

export interface FinanceSlice {
    invoices: Invoice[];
    recurringInvoices: RecurringInvoice[];
    expenses: Expense[];
    timeEntries: TimeEntry[];
    budgets: Budget[];
    proposals: Proposal[];
    contracts: Contract[];
    shadowIncome: ShadowIncomeEntry[];
    
    fetchInvoices: () => Promise<void>;
    fetchExpenses: () => Promise<void>;
    fetchTimeEntries: () => Promise<void>;
    fetchBudgets: () => Promise<void>;
    fetchProposals: () => Promise<void>;
    fetchContracts: () => Promise<void>;

    addInvoice: (newInvoice: Partial<Invoice>, timeEntryIdsToBill?: string[]) => Promise<void>;
    deleteInvoice: (id: string) => Promise<void>;
    markInvoiceAsPaid: (id: string) => Promise<void>;
    addExpense: (newExpense: Partial<Expense>) => Promise<void>;
    deleteExpense: (id: string) => Promise<void>;
    addTimeEntry: (newEntry: NewTimeEntry) => Promise<void>;
    addBudget: (newBudget: Partial<Budget>) => Promise<void>;
    updateBudgetStatus: (id: string, status: Budget['status']) => Promise<void>;
    addProposal: (newProposal: Partial<Proposal>) => Promise<void>;
    updateProposalStatus: (id: string, status: Proposal['status']) => Promise<string | undefined>;
    addContract: (newContract: Partial<Contract>) => Promise<void>;
    sendContract: (id: string) => Promise<void>;
    signContract: (id: string, signedBy: string, signature: string) => Promise<string | undefined>;
    addShadowIncome: (newEntry: Omit<ShadowIncomeEntry, 'id'>) => Promise<void>;
    deleteShadowIncome: (id: string) => Promise<void>;
}

export const createFinanceSlice: StateCreator<AppStore, [], [], FinanceSlice> = (set, get) => ({
    invoices: [],
    recurringInvoices: [],
    expenses: [],
    timeEntries: [],
    budgets: [],
    proposals: [],
    contracts: [],
    shadowIncome: [],

    fetchInvoices: async () => {
        const { data, error } = await supabase.from('invoices').select('*');
        if (error) throw error;
        set({ invoices: data || [] });
    },
    fetchExpenses: async () => {
        const { data, error } = await supabase.from('expenses').select('*');
        if (error) throw error;
        set({ expenses: data || [] });
    },
    fetchTimeEntries: async () => {
        const { data, error } = await supabase.from('time_entries').select('*');
        if (error) throw error;
        set({ timeEntries: data || [] });
    },
     fetchBudgets: async () => {
        const { data, error } = await supabase.from('budgets').select('*');
        if (error) throw error;
        set({ budgets: data || [] });
    },
    fetchProposals: async () => {
        const { data, error } = await supabase.from('proposals').select('*');
        if (error) throw error;
        set({ proposals: data || [] });
    },
    fetchContracts: async () => {
        const { data, error } = await supabase.from('contracts').select('*');
        if (error) throw error;
        set({ contracts: data || [] });
    },

    addInvoice: async (newInvoice, timeEntryIdsToBill) => {
        const state = get();
        const userId = state.profile?.id;
        if (!userId) throw new Error("User not authenticated");

        const nextInvoiceNumber = `INV-${new Date().getFullYear()}-${String(state.invoices.length + 1).padStart(3, '0')}`;
        const subtotal_cents = newInvoice.items!.reduce((sum, item) => sum + item.price_cents * item.quantity, 0);
        const total_cents = subtotal_cents * (1 + (newInvoice.tax_percent || 0) / 100);

        const invoiceToInsert = {
            ...newInvoice,
            user_id: userId,
            invoice_number: nextInvoiceNumber,
            subtotal_cents,
            total_cents,
            paid: false,
        };

        const { data, error } = await supabase.from('invoices').insert(invoiceToInsert).select().single();
        if (error) throw error;

        set({ invoices: [...state.invoices, data] });

        if (timeEntryIdsToBill && timeEntryIdsToBill.length > 0) {
            const { error: timeError } = await supabase.from('time_entries').update({ invoice_id: data.id }).in('id', timeEntryIdsToBill);
            if (timeError) throw timeError;
            // Refresh time entries locally
            await state.fetchTimeEntries();
        }
    },

    deleteInvoice: async (id) => {
        const { error } = await supabase.from('invoices').delete().eq('id', id);
        if (error) throw error;
        set(state => ({ invoices: state.invoices.filter(i => i.id !== id) }));
    },
    
    markInvoiceAsPaid: async (id) => {
        const { data, error } = await supabase
            .from('invoices')
            .update({ paid: true, payment_date: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        
        set(state => ({
            invoices: state.invoices.map(i => i.id === id ? data : i)
        }));

        // --- NEW EMAIL NOTIFICATION LOGIC ---
        try {
            const { profile, getClientById } = get();
            const client = getClientById(data.client_id);

            if (profile && client) {
                const subject = `Confirmación de pago para la factura #${data.invoice_number}`;
                const html = `
                    <div style="font-family: sans-serif; line-height: 1.6;">
                        <h2>¡Pago Recibido!</h2>
                        <p>Hola ${client.name},</p>
                        <p>Te confirmamos que hemos recibido tu pago de <strong>${formatCurrency(data.total_cents)}</strong> para la factura <strong>#${data.invoice_number}</strong>.</p>
                        <p>Agradecemos tu confianza y esperamos seguir colaborando contigo.</p>
                        <br>
                        <p>Saludos cordiales,</p>
                        <p>
                            <strong>${profile.full_name}</strong><br>
                            ${profile.business_name || ''}
                        </p>
                    </div>
                `;

                const response = await fetch('/api/send-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ to: client.email, subject, html }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'El servidor de correo no respondió correctamente.');
                }
                
                console.log(`Email simulation successful for invoice ${data.invoice_number}.`);
            }
        } catch (emailError) {
            console.error("Failed to send payment confirmation email:", emailError);
            // Silently fail for email, the main action was successful.
            // A toast could be added here if needed to notify the user of email failure.
        }
    },
    
    addExpense: async (newExpense) => {
        const userId = get().profile?.id;
        if (!userId) throw new Error("User not authenticated");

        const { data, error } = await supabase.from('expenses').insert({ ...newExpense, user_id: userId }).select().single();
        if (error) throw error;
        set(state => ({ expenses: [...state.expenses, data] }));
    },

    deleteExpense: async (id) => {
        const { error } = await supabase.from('expenses').delete().eq('id', id);
        if (error) throw error;
        set(state => ({ expenses: state.expenses.filter(e => e.id !== id) }));
    },

    addTimeEntry: async (newEntry) => {
        const userId = get().profile?.id;
        if (!userId) throw new Error("User not authenticated");
        
        const { data, error } = await supabase.from('time_entries').insert({ ...newEntry, user_id: userId }).select().single();
        if (error) throw error;
        set(state => ({ timeEntries: [...state.timeEntries, data] }));
    },
    
    addBudget: async (newBudget) => {
        const userId = get().profile?.id;
        if (!userId) throw new Error("User not authenticated");
        
        const amount_cents = newBudget.items!.reduce((sum, item) => sum + item.price_cents * item.quantity, 0);
        
        const { data, error } = await supabase.from('budgets').insert({
             ...newBudget,
             user_id: userId,
             status: 'pending',
             amount_cents
        }).select().single();
        if(error) throw error;
        set(state => ({ budgets: [...state.budgets, data] }));
    },

    updateBudgetStatus: async (id, status) => {
        const { data, error } = await supabase.from('budgets').update({ status }).eq('id', id).select().single();
        if (error) throw error;
        set(state => ({ budgets: state.budgets.map(b => b.id === id ? data : b)}));
    },
    
    addProposal: async (newProposal) => {
        const userId = get().profile?.id;
        if (!userId) throw new Error("User not authenticated");
        
        const { data, error } = await supabase.from('proposals').insert({
             ...newProposal,
             user_id: userId,
             status: 'sent'
        }).select().single();
        if(error) throw error;
        set(state => ({ proposals: [...state.proposals, data] }));
    },
    
    updateProposalStatus: async (id, status) => {
        const proposal = get().proposals.find(p => p.id === id);
        if (proposal?.status !== 'sent') {
            return `Esta propuesta ya ha sido ${proposal?.status === 'accepted' ? 'aceptada' : 'rechazada'}.`;
        }
        const { data, error } = await supabase.from('proposals').update({ status }).eq('id', id).select().single();
        if(error) throw error;
        set(state => ({ proposals: state.proposals.map(p => p.id === id ? data : p) }));
    },

    addContract: async (newContract) => {
        const userId = get().profile?.id;
        if (!userId) throw new Error("User not authenticated");
        
        const { data, error } = await supabase.from('contracts').insert({
            ...newContract,
            user_id: userId,
            status: 'draft'
        }).select().single();
        if(error) throw error;
        set(state => ({ contracts: [...state.contracts, data] }));
    },
    
    sendContract: async (id) => {
        const { data, error } = await supabase.from('contracts').update({ status: 'sent' }).eq('id', id).select().single();
        if(error) throw error;
        set(state => ({ contracts: state.contracts.map(c => c.id === id ? data : c) }));
    },

    signContract: async (id, signedBy, signature) => {
        const contract = get().contracts.find(c => c.id === id);
        if (contract?.status === 'signed') return "Este contrato ya ha sido firmado.";

        const { data, error } = await supabase.from('contracts').update({
            status: 'signed',
            signed_by: signedBy,
            signed_at: new Date().toISOString(),
            signature
        }).eq('id', id).select().single();

        if(error) throw error;
        set(state => ({ contracts: state.contracts.map(c => c.id === id ? data : c) }));
    },

    // These are local only for now, would need DB tables.
    addShadowIncome: async (newEntry) => {
        const createdEntry = { ...newEntry, id: `shadow-${Date.now()}` };
        set(state => ({ shadowIncome: [...state.shadowIncome, createdEntry] }));
    },
    deleteShadowIncome: async (id) => {
        set(state => ({ shadowIncome: state.shadowIncome.filter(s => s.id !== id) }));
    },
});