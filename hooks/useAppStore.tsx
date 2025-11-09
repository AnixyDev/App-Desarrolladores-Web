import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { supabase } from '../lib/supabaseClient.js';
import type {
    Profile, Client, Project, Task, Invoice, Expense, TimeEntry, Budget, Proposal, Contract,
    UserData, Referral, KnowledgeArticle, Job, JobApplication, Notification, ProjectMessage,
    ProjectFile, ShadowIncomeEntry, InvoiceTemplate, ProposalTemplate, PortalComment, PortalFile,
    RecurringInvoice, RecurringExpense, NewClient, NewProject, NewTimeEntry
} from '../types';
import { useToast } from './useToast';

interface AppState {
    // Core State
    isAuthenticated: boolean;
    isLoading: boolean;
    session: any | null;
    profile: Profile | null;
    
    // Data slices
    clients: Client[];
    projects: Project[];
    tasks: Task[];
    invoices: Invoice[];
    recurringInvoices: RecurringInvoice[];
    expenses: Expense[];
    recurringExpenses: RecurringExpense[];
    timeEntries: TimeEntry[];
    budgets: Budget[];
    proposals: Proposal[];
    contracts: Contract[];
    users: UserData[];
    referrals: Referral[];
    articles: KnowledgeArticle[];
    jobs: Job[];
    savedJobIds: string[];
    applications: JobApplication[];
    notifiedJobIds: string[];
    notifications: Notification[];
    projectMessages: ProjectMessage[];
    projectFiles: ProjectFile[];
    shadowIncome: ShadowIncomeEntry[];
    monthlyGoalCents: number;
    invoiceTemplates: InvoiceTemplate[];
    proposalTemplates: ProposalTemplate[];
    portalComments: PortalComment[];
    portalFiles: PortalFile[];
}

interface AppActions {
    // Auth
    reauthenticate: () => Promise<void>;
    login: (email: string, pass: string) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    register: (name: string, email: string, pass: string) => Promise<void>;
    logout: () => Promise<void>;
    
    // Generic CRUD
    fetchData: <T extends keyof AppState>(table: T) => Promise<void>;
    createData: <T extends keyof AppState>(table: T, data: any) => Promise<any>;
    updateData: <T extends keyof AppState>(table: T, id: string, data: any) => Promise<void>;
    deleteData: <T extends keyof AppState>(table: T, id: string) => Promise<void>;
    
    // Specific Actions
    addClient: (newClient: NewClient) => Promise<Client>;
    addProject: (newProject: NewProject) => Promise<void>;
    updateProfile: (profileData: Partial<Profile>) => Promise<void>;
    
    // Getters (derived state)
    getClientById: (id: string) => Client | undefined;
    getProjectById: (id: string) => Project | undefined;
    getJobById: (id: string) => Job | undefined;
    getTasksByProjectId: (projectId: string) => Task[];
    getSavedJobs: () => Job[];
    getApplicationsByJobId: (jobId: string) => JobApplication[];
    getClientByName: (name: string) => Client | undefined;
    getProjectByName: (name: string) => Project | undefined;
    
    // Other simple state updates
    completeOnboarding: () => void;
    setClientPaymentMethodStatus: (clientId: string, status: boolean) => void;
    
    // Stubs for actions to be fully migrated
    [key: string]: any;
}

type Store = AppState & AppActions;

const initialState: AppState = {
    isAuthenticated: false,
    isLoading: true,
    session: null,
    profile: null,
    clients: [],
    projects: [],
    tasks: [],
    invoices: [],
    recurringInvoices: [],
    expenses: [],
    recurringExpenses: [],
    timeEntries: [],
    budgets: [],
    proposals: [],
    contracts: [],
    users: [],
    referrals: [],
    articles: [],
    jobs: [],
    savedJobIds: [],
    applications: [],
    notifiedJobIds: [],
    notifications: [],
    projectMessages: [],
    projectFiles: [],
    shadowIncome: [],
    monthlyGoalCents: 5000,
    invoiceTemplates: [],
    proposalTemplates: [],
    portalComments: [],
    portalFiles: [],
};

const apiCall = async (body: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) {
        throw new Error("No estás autenticado.");
    }

    const response = await fetch('/api/data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ocurrió un error en el servidor.');
    }

    return response.json();
};


export const useAppStore = create<Store>()(immer((set, get) => ({
    ...initialState,

    // --- AUTH ACTIONS ---
    reauthenticate: async () => {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) throw error;
            if (session) {
                const allData = await apiCall({ action: 'GET_ALL_FOR_USER' });
                set(state => {
                    Object.assign(state, { ...allData, isAuthenticated: true, session });
                });
            }
        } catch (error) {
            console.error("Reauthentication failed:", error);
            set({ isAuthenticated: false, session: null });
        } finally {
            set({ isLoading: false });
        }
    },
    
    login: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.session) {
            const allData = await apiCall({ action: 'GET_ALL_FOR_USER' });
            set(state => {
                Object.assign(state, { ...allData, isAuthenticated: true, session: data.session });
            });
        }
    },
    
    loginWithGoogle: async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin }
        });
        if (error) throw error;
    },
    
    register: async (name, email, password) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: name, avatar_url: '' } }
        });
        if (error) throw error;
        if (data.session) {
            const allData = await apiCall({ action: 'GET_ALL_FOR_USER' });
             set(state => {
                Object.assign(state, { ...allData, isAuthenticated: true, session: data.session });
                if (state.profile) state.profile.isNewUser = true;
            });
        }
    },
    
    logout: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error("Error logging out:", error);
        }
        set(initialState);
        set({ isLoading: false, isAuthenticated: false });
    },
    
    // --- GENERIC CRUD ---
    fetchData: async (table) => {
        const data = await apiCall({ table, action: 'GET_ALL' });
        set(state => { state[table] = data as any; });
    },
    createData: async (table, data) => {
        const createdData = await apiCall({ table, action: 'CREATE', data });
        set(state => { (state[table] as any[]).push(createdData); });
        return createdData;
    },
    updateData: async (table, id, data) => {
        const updatedData = await apiCall({ table, action: 'UPDATE', id, data });
        set(state => {
            const index = (state[table] as any[]).findIndex(item => item.id === id);
            if (index !== -1) {
                (state[table] as any[])[index] = updatedData;
            }
        });
    },
    deleteData: async (table, id) => {
        await apiCall({ table, action: 'DELETE', id });
        set(state => {
            state[table] = (state[table] as any[]).filter(item => item.id !== id) as any;
        });
    },
    
    // --- SPECIFIC ACTIONS ---
    addClient: async (newClient: NewClient) => {
        return get().createData('clients', newClient);
    },
    addProject: async (newProject: NewProject) => {
        await get().createData('projects', newProject);
    },
    updateProfile: async (profileData) => {
        if (!get().profile) return;
        await get().updateData('profile', get().profile!.id, profileData);
    },
    
    // --- DERIVED STATE / GETTERS ---
    getClientById: (id) => get().clients.find(c => c.id === id),
    getProjectById: (id) => get().projects.find(p => p.id === id),
    getJobById: (id) => get().jobs.find(j => j.id === id),
    getTasksByProjectId: (projectId) => get().tasks.filter(t => t.project_id === projectId),
    getSavedJobs: () => get().jobs.filter(j => get().savedJobIds.includes(j.id)),
    getApplicationsByJobId: (jobId) => get().applications.filter(a => a.jobId === jobId),
    getClientByName: (name) => get().clients.find(c => c.name.toLowerCase() === name.toLowerCase()),
    getProjectByName: (name) => get().projects.find(p => p.name.toLowerCase() === name.toLowerCase()),
    
    // --- SIMPLE STATE UPDATES (to be migrated if they have side effects) ---
    completeOnboarding: () => get().updateProfile({ isNewUser: false }),
    setClientPaymentMethodStatus: (clientId, status) => {
        get().updateData('clients', clientId, { payment_method_on_file: status });
    },

    // --- OTHER ACTIONS (need to be refactored to async/API calls) ---
    addInvoice: async (newInvoiceData, timeEntryIdsToBill) => {
      const createdInvoice = await get().createData('invoices', newInvoiceData);
      if (timeEntryIdsToBill && timeEntryIdsToBill.length > 0) {
        for (const entryId of timeEntryIdsToBill) {
          await get().updateData('timeEntries', entryId, { invoice_id: createdInvoice.id });
        }
      }
    },
    deleteInvoice: (id) => get().deleteData('invoices', id),
    markInvoiceAsPaid: (id) => get().updateData('invoices', id, { paid: true, payment_date: new Date().toISOString().split('T')[0] }),
    addExpense: (newExpenseData) => get().createData('expenses', newExpenseData),
    deleteExpense: (id) => get().deleteData('expenses', id),
    addTimeEntry: (newTimeEntry) => get().createData('timeEntries', newTimeEntry),
    addTask: (newTaskData) => get().createData('tasks', newTaskData),
    updateTaskStatus: (id, status) => get().updateData('tasks', id, { status }),
    deleteTask: (id) => get().deleteData('tasks', id),
    addArticle: (article) => get().createData('articles', article),
    updateArticle: (article) => get().updateData('articles', article.id, article),
    deleteArticle: (id) => get().deleteData('articles', id),
    addJob: (jobData) => get().createData('jobs', jobData),
    
    // Example for a more complex action
    updateProposalStatus: (id, status) => {
        get().updateData('proposals', id, { status });
        const { addToast } = useToast.getState();
        const proposal = get().proposals.find(p => p.id === id);
        if (proposal && get().profile?.email_notifications.on_proposal_status_change) {
          const client = get().getClientById(proposal.client_id);
          const message = `El cliente ${client?.name} ha ${status === 'accepted' ? 'aceptado' : 'rechazado'} tu propuesta "${proposal.title}".`;
          get().addNotification(message, `/proposals`);
          addToast(message, 'info');
          // In a real app, this would trigger a backend email service
          console.log(`SIMULATING EMAIL to freelancer: ${message}`);
          return `Email simulado enviado al freelancer.`;
        }
    },

    // --- Stubs for actions not fully migrated ---
    // These need to be converted to use createData, updateData, deleteData
    addRecurringInvoice: (data) => console.log('addRecurringInvoice', data),
    deleteRecurringInvoice: (id) => console.log('deleteRecurringInvoice', id),
    addRecurringExpense: (data) => console.log('addRecurringExpense', data),
    deleteRecurringExpense: (id) => console.log('deleteRecurringExpense', id),
    addShadowIncome: (data) => get().createData('shadowIncome', data),
    deleteShadowIncome: (id) => get().deleteData('shadowIncome', id),
    addBudget: (data) => get().createData('budgets', data),
    updateBudgetStatus: (id, status) => get().updateData('budgets', id, { status }),
    addProposal: (data) => get().createData('proposals', data),
    addContract: (data) => get().createData('contracts', data),
    sendContract: (id) => get().updateData('contracts', id, { status: 'sent' }),
    signContract: (id, signedBy, signature) => get().updateData('contracts', id, { status: 'signed', signed_by: signedBy, signed_at: new Date().toISOString() }),
    setContractExpiration: (id, date) => get().updateData('contracts', id, { expires_at: date }),
    addInvoiceTemplate: (template) => get().createData('invoiceTemplates', template),
    deleteInvoiceTemplate: (id) => get().deleteData('invoiceTemplates', id),
    addProposalTemplate: (template) => get().createData('proposalTemplates', template),
    deleteProposalTemplate: (id) => get().deleteData('proposalTemplates', id),
    inviteUser: (name, email, role) => get().createData('users', { name, email, role, status: 'Pendiente', invitedOn: new Date().toISOString().split('T')[0] }),
    deleteUser: (id) => get().deleteData('users', id),
    updateUserRole: (id, role) => get().updateData('users', id, { role }),
    updateUserStatus: (id, status) => get().updateData('users', id, { status }),
    updateUserHourlyRate: (id, rateCents) => get().updateData('users', id, { hourly_rate_cents: rateCents }),
    saveJob: (jobId) => set(state => {
        if (state.savedJobIds.includes(jobId)) {
            state.savedJobIds = state.savedJobIds.filter(id => id !== jobId);
        } else {
            state.savedJobIds.push(jobId);
        }
        // This needs a backend implementation to be persistent
    }),
    applyForJob: (jobId, userId, proposalText) => get().createData('applications', { jobId, userId, proposalText, status: 'sent' }),
    viewApplication: (appId) => get().updateData('applications', appId, { status: 'viewed' }),
    addNotification: (message, link) => set(state => { state.notifications.unshift({ id: Math.random().toString(), message, link, isRead: false, createdAt: new Date().toISOString() }); }),
    markAllAsRead: () => set(state => { state.notifications.forEach(n => n.isRead = true); }),
    markJobAsNotified: (jobId) => set(state => { state.notifiedJobIds.push(jobId); }),
    addProjectComment: (comment) => get().createData('projectMessages', comment),
    addProjectFile: (file) => get().createData('projectFiles', file),
    deleteProjectFile: (id) => get().deleteData('projectFiles', id),
    addPortalComment: (comment) => get().createData('portalComments', comment),
    addPortalFile: (file) => get().createData('portalFiles', file),
    deletePortalFile: (id) => get().deleteData('portalFiles', id),
    upgradePlan: async (newPlan) => get().updateProfile({ plan: newPlan }),
    purchaseCredits: async (amount) => {
        if (!get().profile) return;
        const currentCredits = get().profile!.ai_credits;
        get().updateProfile({ ai_credits: currentCredits + amount });
    },
    consumeCredits: (amount) => {
         if (!get().profile) return;
        const currentCredits = get().profile!.ai_credits;
        get().updateProfile({ ai_credits: Math.max(0, currentCredits - amount) });
    },
    updateStripeConnection: (accountId, status) => get().updateProfile({ stripe_account_id: accountId, stripe_onboarding_complete: status }),
    updateProjectStatus: (id, status) => get().updateData('projects', id, { status }),
    updateProjectBudget: (id, budgetCents) => get().updateData('projects', id, { budget_cents: budgetCents }),
})));