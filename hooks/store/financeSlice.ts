
import { StateCreator } from 'zustand';
import { Invoice, Expense, RecurringExpense, Budget, Proposal, Contract, RecurringInvoice } from '../../types.ts';
import { AppState } from '../useAppStore.tsx';

export interface FinanceSlice {
  invoices: Invoice[];
  recurringInvoices: RecurringInvoice[];
  expenses: Expense[];
  recurringExpenses: RecurringExpense[];
  budgets: Budget[];
  proposals: Proposal[];
  contracts: Contract[];
  monthlyGoalCents: number;
  addInvoice: (invoiceData: any, timeEntryIdsToBill?: string[]) => void;
  deleteInvoice: (id: string) => void;
  markInvoiceAsPaid: (id: string) => void;
  addRecurringInvoice: (recurringData: any) => void;
  deleteRecurringInvoice: (id: string) => void;
  checkAndGenerateRecurringInvoices: () => void;
  addExpense: (expense: Omit<Expense, 'id'|'user_id'|'created_at'>) => void;
  deleteExpense: (id: string) => void;
  addRecurringExpense: (expense: Omit<RecurringExpense, 'id'|'user_id'|'created_at'|'next_due_date'>) => void;
  deleteRecurringExpense: (id: string) => void;
  addBudget: (budget: any) => void;
  updateBudgetStatus: (id: string, status: Budget['status']) => void;
  addProposal: (proposal: any) => void;
  addContract: (contract: any) => void;
  updateContract: (id: string, updates: Partial<Contract>) => void;
  deleteContract: (id: string) => void;
  sendContract: (id: string) => void;
  signContract: (id: string, signerName: string) => void;
  setMonthlyGoal: (goal: number) => void;
}

export const createFinanceSlice: StateCreator<AppState, [], [], FinanceSlice> = (set, get) => ({
    invoices: [],
    recurringInvoices: [],
    expenses: [],
    recurringExpenses: [],
    budgets: [],
    proposals: [],
    contracts: [],
    monthlyGoalCents: 0,
    addInvoice: (invoiceData, timeEntryIdsToBill) => {
        const subtotal = invoiceData.items.reduce((sum: number, item: any) => sum + item.price_cents * item.quantity, 0);
        
        const taxAmount = subtotal * ((invoiceData.tax_percent || 0) / 100);
        const irpfAmount = subtotal * ((invoiceData.irpf_percent || 0) / 100);
        
        // Total = Base + VAT - IRPF
        const total = Math.round(subtotal + taxAmount - irpfAmount);

        const newInvoice = {
            ...invoiceData,
            id: `inv-${Date.now()}`,
            user_id: 'u-1',
            invoice_number: `INV-${String(get().invoices.length + 1).padStart(4, '0')}`,
            subtotal_cents: subtotal,
            total_cents: total,
            paid: false,
            payment_date: null,
            created_at: new Date().toISOString(),
        };
        set(state => ({ invoices: [newInvoice, ...state.invoices] }));
        
        get().addNotification(`Nueva factura #${newInvoice.invoice_number} creada.`, '/invoices');

        if (timeEntryIdsToBill && timeEntryIdsToBill.length > 0) {
            const updatedTimeEntries = get().timeEntries.map(entry => 
                timeEntryIdsToBill.includes(entry.id) ? { ...entry, invoice_id: newInvoice.id } : entry
            );
            set({ timeEntries: updatedTimeEntries });
        }
    },
    deleteInvoice: (id) => set(state => ({ invoices: state.invoices.filter(i => i.id !== id) })),
    markInvoiceAsPaid: (id) => {
        const invoice = get().invoices.find(i => i.id === id);
        if(invoice) {
             get().addNotification(`La factura #${invoice.invoice_number} ha sido pagada.`, '/invoices');
        }
        set(state => ({ invoices: state.invoices.map(i => i.id === id ? { ...i, paid: true, payment_date: new Date().toISOString().split('T')[0] } : i) }));
    },
    addRecurringInvoice: (recurringData) => {
        const newRecurring: RecurringInvoice = {
            ...recurringData,
            id: `rec-inv-${Date.now()}`,
            user_id: 'u-1',
            next_due_date: recurringData.start_date,
            created_at: new Date().toISOString(),
        };
        set(state => ({ recurringInvoices: [...state.recurringInvoices, newRecurring] }));
        get().checkAndGenerateRecurringInvoices(); // Check immediately to create the first one
    },
    deleteRecurringInvoice: (id) => set(state => ({ recurringInvoices: state.recurringInvoices.filter(ri => ri.id !== id) })),
    checkAndGenerateRecurringInvoices: () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const recurringInvoices = get().recurringInvoices;
        const newInvoices: Invoice[] = [];
        const updatedRecurringInvoices = recurringInvoices.map(rec => {
            const nextDueDate = new Date(rec.next_due_date);
            if (nextDueDate <= today) {
                // Generate a new invoice
                const newInvoiceData = {
                    client_id: rec.client_id,
                    project_id: rec.project_id,
                    issue_date: new Date().toISOString().split('T')[0],
                    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    items: rec.items,
                    tax_percent: rec.tax_percent,
                };
                get().addInvoice(newInvoiceData);
                
                // Calculate next due date
                let newNextDueDate = new Date(rec.next_due_date);
                if (rec.frequency === 'monthly') {
                    newNextDueDate.setMonth(newNextDueDate.getMonth() + 1);
                } else { // yearly
                    newNextDueDate.setFullYear(newNextDueDate.getFullYear() + 1);
                }
                return { ...rec, next_due_date: newNextDueDate.toISOString().split('T')[0] };
            }
            return rec;
        });

        set({ recurringInvoices: updatedRecurringInvoices });
    },
    addExpense: (expense) => set(state => ({ expenses: [{ ...expense, id: `e-${Date.now()}`, user_id: 'u-1', created_at: new Date().toISOString() }, ...state.expenses] })),
    deleteExpense: (id) => set(state => ({ expenses: state.expenses.filter(e => e.id !== id) })),
    addRecurringExpense: (expense) => {
          const startDate = new Date(expense.start_date);
          let nextDueDate = new Date(startDate);
          if (expense.frequency === 'monthly') {
            nextDueDate.setMonth(nextDueDate.getMonth() + 1);
          } else {
            nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
          }
          const newRecExpense = {
              ...expense,
              id: `re-${Date.now()}`,
              user_id: 'u-1',
              next_due_date: nextDueDate.toISOString().split('T')[0],
              created_at: new Date().toISOString(),
          }
          set(state => ({ recurringExpenses: [newRecExpense, ...state.recurringExpenses] }));
    },
    deleteRecurringExpense: (id) => set(state => ({ recurringExpenses: state.recurringExpenses.filter(re => re.id !== id) })),
    addBudget: (budgetData) => {
        const amount_cents = budgetData.items.reduce((sum: number, item: any) => sum + item.price_cents * item.quantity, 0);
        const newBudget = {
            ...budgetData,
            id: `b-${Date.now()}`,
            user_id: 'u-1',
            amount_cents,
            status: 'pending',
            created_at: new Date().toLocaleDateString(),
        };
        set(state => ({ budgets: [newBudget, ...state.budgets] }));
    },
    updateBudgetStatus: (id, status) => set(state => ({ budgets: state.budgets.map(b => b.id === id ? {...b, status} : b) })),
    addProposal: (proposalData) => {
        const newProposal = {
            ...proposalData,
            id: `prop-${Date.now()}`,
            user_id: 'u-1',
            status: 'sent',
            created_at: new Date().toLocaleDateString(),
        };
        set(state => ({ proposals: [newProposal, ...state.proposals] }));
    },
    addContract: (contractData) => {
        const newContract = {
            ...contractData,
            id: `cont-${Date.now()}`,
            user_id: 'u-1',
            status: 'draft',
            created_at: new Date().toISOString(),
        };
        set(state => ({ contracts: [newContract, ...state.contracts] }));
    },
    updateContract: (id, updates) => set(state => ({ contracts: state.contracts.map(c => c.id === id ? { ...c, ...updates } : c) })),
    deleteContract: (id) => set(state => ({ contracts: state.contracts.filter(c => c.id !== id) })),
    sendContract: (id) => set(state => ({ contracts: state.contracts.map(c => c.id === id ? { ...c, status: 'sent' } : c) })),
    signContract: (id, signerName) => set(state => ({ contracts: state.contracts.map(c => c.id === id ? { ...c, status: 'signed', signed_by: signerName, signed_at: new Date().toISOString() } : c) })),
    setMonthlyGoal: (goal) => set({ monthlyGoalCents: goal }),
});
