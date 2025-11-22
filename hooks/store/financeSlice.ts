import { supabase } from '../../lib/supabaseClient';
import type { StateCreator } from 'zustand';
import type { AppStore } from '../useAppStore';
import { Invoice, RecurringInvoice, Expense, RecurringExpense, TimeEntry, Budget, Proposal, Contract, NewTimeEntry, ShadowIncomeEntry, InvoiceTemplate, ProposalTemplate, ContractTemplate } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { useToast } from '../useToast';

export interface FinanceSlice {
    invoices: Invoice[];
    recurringInvoices: RecurringInvoice[];
    expenses: Expense[];
    recurringExpenses: RecurringExpense[];
    timeEntries: TimeEntry[];
    budgets: Budget[];
    proposals: Proposal[];
    contracts: Contract[];
    shadowIncome: ShadowIncomeEntry[];
    monthlyGoalCents: number;
    invoiceTemplates: InvoiceTemplate[];
    proposalTemplates: ProposalTemplate[];
    contractTemplates: ContractTemplate[];
    
    isInvoicesLoading: boolean;
    isExpensesLoading: boolean;
    isTimeEntriesLoading: boolean;

    fetchInvoices: () => Promise<void>;
    fetchExpenses: () => Promise<void>;
    fetchTimeEntries: () => Promise<void>;
    fetchBudgets: () => Promise<void>;
    fetchProposals: () => Promise<void>;
    fetchContracts: () => Promise<void>;
    fetchRecurringInvoices: () => Promise<void>;
    fetchRecurringExpenses: () => Promise<void>;
    fetchTemplates: () => Promise<void>;

    addInvoice: (newInvoice: Partial<Invoice>, timeEntryIdsToBill?: string[]) => Promise<void>;
    deleteInvoice: (id: string) => Promise<void>;
    markInvoiceAsPaid: (id: string) => Promise<void>;
    addExpense: (newExpense: Partial<Expense>) => Promise<void>;
    deleteExpense: (id: string) => Promise<void>;
    addTimeEntry: (newEntry: Omit<NewTimeEntry, 'user_id'>) => Promise<void>;
    addBudget: (newBudget: Partial<Budget>) => Promise<void>;
    updateBudgetStatus: (id: string, status: Budget['status']) => Promise<void>;
    addProposal: (newProposal: Partial<Proposal>) => Promise<void>;
    updateProposalStatus: (id: string, status: Proposal['status']) => Promise<string | undefined>;
    addContract: (newContract: Partial<Contract>) => Promise<void>;
    sendContract: (id: string) => Promise<void>;
    signContract: (id: string, signedBy: string, signature: string) => Promise<string | undefined>;
    setContractExpiration: (id: string, date: string) => Promise<void>;
    addShadowIncome: (newEntry: Omit<ShadowIncomeEntry, 'id'>) => Promise<void>;
    deleteShadowIncome: (id: string) => Promise<void>;

    addRecurringInvoice: (newInvoice: Partial<RecurringInvoice>) => Promise<void>;
    deleteRecurringInvoice: (id: string) => Promise<void>;
    addRecurringExpense: (newExpense: Partial<RecurringExpense>) => Promise<void>;
    deleteRecurringExpense: (id: string) => Promise<void>;
    addInvoiceTemplate: (template: Omit<InvoiceTemplate, 'id'>) => Promise<void>;
    deleteInvoiceTemplate: (id: string) => Promise<void>;
    addProposalTemplate: (template: Omit<ProposalTemplate, 'id'>) => Promise<void>;
    deleteProposalTemplate: (id: string) => Promise<void>;
    addContractTemplate: (template: Omit<ContractTemplate, 'id'>) => Promise<void>;
    deleteContractTemplate: (id: string) => Promise<void>;
}

export const createFinanceSlice: StateCreator<AppStore, [], [], FinanceSlice> = (set, get) => ({
    invoices: [],
    recurringInvoices: [],
    expenses: [],
    recurringExpenses: [],
    timeEntries: [],
    budgets: [],
    proposals: [],
    contracts: [],
    shadowIncome: [],
    monthlyGoalCents: 500000,
    invoiceTemplates: [],
    proposalTemplates: [],
    contractTemplates: [],
    isInvoicesLoading: true,
    isExpensesLoading: true,
    isTimeEntriesLoading: true,

    fetchInvoices: async () => {
        set({ isInvoicesLoading: true });
        try {
            const { data, error } = await supabase.from('invoices').select('*');
            if (error) throw error;
            set({ invoices: data || [] });
        } catch (error) {
            console.error("Error fetching invoices:", error);
        } finally {
            set({ isInvoicesLoading: false });
        }
    },
    fetchExpenses: async () => {
        set({ isExpensesLoading: true });
        try {
            const { data, error } = await supabase.from('expenses').select('*');
            if (error) throw error;
            set({ expenses: data || [] });
        } catch (error) {
            console.error("Error fetching expenses:", error);
        } finally {
            set({ isExpensesLoading: false });
        }
    },
    fetchTimeEntries: async () => {
        set({ isTimeEntriesLoading: true });
        try {
            const { data, error } = await supabase.from('time_entries').select('*');
            if (error) throw error;
            set({ timeEntries: data || [] });
        } catch (error) {
            console.error("Error fetching time entries:", error);
        } finally {
            set({ isTimeEntriesLoading: false });
        }
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
    fetchRecurringInvoices: async () => {
        const { data, error } = await supabase.from('recurring_invoices').select('*');
        if (error) throw error;
        set({ recurringInvoices: data || [] });
    },
    fetchRecurringExpenses: async () => {
        const { data, error } = await supabase.from('recurring_expenses').select('*');
        if (error) throw error;
        set({ recurringExpenses: data || [] });
    },
    fetchTemplates: async () => {
        const [
            { data: invoiceData, error: invoiceError },
            { data: proposalData, error: proposalError },
            { data: contractData, error: contractError },
        ] = await Promise.all([
            supabase.from('invoice_templates').select('*'),
            supabase.from('proposal_templates').select('*'),
            supabase.from('contract_templates').select('*'),
        ]);
        if (invoiceError || proposalError || contractError) {
            console.error("Error fetching templates", { invoiceError, proposalError, contractError });
            throw new Error("Failed to fetch templates.");
        }
        set({ 
            invoiceTemplates: invoiceData || [], 
            proposalTemplates: proposalData || [],
            contractTemplates: contractData || [],
        });
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

        try {
            const { profile, getClientById } = get();
            const client = getClientById(data.client_id);

            if (profile && client) {
                const subject = `Confirmación de pago para la factura #${data.invoice_number}`;
                const html = `...`; // Email HTML as before

                await fetch('/api/send-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ to: client.email, subject, html }),
                });
            }
        } catch (emailError) {
            console.error("Failed to send payment confirmation email:", emailError);
            useToast.getState().addToast('Factura marcada como pagada, pero falló el envío del email de confirmación.', 'error');
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
        
        const entryWithUser = { ...newEntry, user_id: userId };
        const { data, error } = await supabase.from('time_entries').insert(entryWithUser).select().single();
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
        return undefined;
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
        return undefined;
    },

    addShadowIncome: async (newEntry) => {
        const userId = get().profile?.id;
        if (!userId) throw new Error("User not authenticated");
        const { data, error } = await supabase.from('shadow_income').insert({ ...newEntry, user_id: userId }).select().single();
        if (error) throw error;
        set(state => ({ shadowIncome: [...state.shadowIncome, data] }));
    },
    deleteShadowIncome: async (id) => {
        const { error } = await supabase.from('shadow_income').delete().eq('id', id);
        if (error) throw error;
        set(state => ({ shadowIncome: state.shadowIncome.filter(s => s.id !== id) }));
    },
    
    addRecurringInvoice: async (newInvoice) => {
        const userId = get().profile?.id;
        if (!userId) throw new Error("User not authenticated");
        const { data, error } = await supabase.from('recurring_invoices').insert({ ...newInvoice, user_id: userId }).select().single();
        if (error) throw error;
        set(state => ({ recurringInvoices: [...state.recurringInvoices, data] }));
    },
    deleteRecurringInvoice: async (id) => {
        const { error } = await supabase.from('recurring_invoices').delete().eq('id', id);
        if (error) throw error;
        set(state => ({ recurringInvoices: state.recurringInvoices.filter(i => i.id !== id) }));
    },
    addRecurringExpense: async (newExpense) => {
        const userId = get().profile?.id;
        if (!userId) throw new Error("User not authenticated");
        const { data, error } = await supabase.from('recurring_expenses').insert({ ...newExpense, user_id: userId }).select().single();
        if (error) throw error;
        set(state => ({ recurringExpenses: [...state.recurringExpenses, data] }));
    },
    deleteRecurringExpense: async (id) => {
        const { error } = await supabase.from('recurring_expenses').delete().eq('id', id);
        if (error) throw error;
        set(state => ({ recurringExpenses: state.recurringExpenses.filter(e => e.id !== id) }));
    },
    setContractExpiration: async (id, date) => {
        const { data, error } = await supabase.from('contracts').update({ expires_at: date }).eq('id', id).select().single();
        if (error) throw error;
        set(state => ({ contracts: state.contracts.map(c => c.id === id ? data : c) }));
    },
    addInvoiceTemplate: async (template) => {
        const userId = get().profile?.id;
        if (!userId) throw new Error("User not authenticated");
        const { data, error } = await supabase.from('invoice_templates').insert({ ...template, user_id: userId }).select().single();
        if (error) throw error;
        set(state => ({ invoiceTemplates: [...state.invoiceTemplates, data] }));
    },
    deleteInvoiceTemplate: async (id) => {
        const { error } = await supabase.from('invoice_templates').delete().eq('id', id);
        if (error) throw error;
        set(state => ({ invoiceTemplates: state.invoiceTemplates.filter(t => t.id !== id) }));
    },
    addProposalTemplate: async (template) => {
        const userId = get().profile?.id;
        if (!userId) throw new Error("User not authenticated");
        const { data, error } = await supabase.from('proposal_templates').insert({ ...template, user_id: userId }).select().single();
        if (error) throw error;
        set(state => ({ proposalTemplates: [...state.proposalTemplates, data] }));
    },
    deleteProposalTemplate: async (id) => {
        const { error } = await supabase.from('proposal_templates').delete().eq('id', id);
        if (error) throw error;
        set(state => ({ proposalTemplates: state.proposalTemplates.filter(t => t.id !== id) }));
    },
    addContractTemplate: async (template) => {
        const userId = get().profile?.id;
        if (!userId) throw new Error("User not authenticated");
        const { data, error } = await supabase.from('contract_templates').insert({ ...template, user_id: userId }).select().single();
        if (error) throw error;
        set(state => ({ contractTemplates: [...state.contractTemplates, data] }));
    },
    deleteContractTemplate: async (id) => {
        const { error } = await supabase.from('contract_templates').delete().eq('id', id);
        if (error) throw error;
        set(state => ({ contractTemplates: state.contractTemplates.filter(t => t.id !== id) }));
    },
});