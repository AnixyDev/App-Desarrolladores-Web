import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Session, User } from '@supabase/supabase-js';
import { createAuthSlice, AuthSlice } from './store/authSlice';
import { createClientSlice, ClientSlice } from './store/clientSlice';
import { createProjectSlice, ProjectSlice } from './store/projectSlice';
import { createFinanceSlice, FinanceSlice } from './store/financeSlice';
import { createTeamSlice, TeamSlice } from './store/teamSlice';
import { createCollaborationSlice, CollaborationSlice } from './store/collaborationSlice';
import { createJobSlice, JobSlice } from './store/jobSlice';
import type { Client, Project, Task, Job, JobApplication } from '../types';

export interface GetterSlice {
    getClientById: (id: string) => Client | undefined;
    getProjectById: (id: string) => Project | undefined;
    getTasksByProjectId: (id: string) => Task[];
    getClientByName: (name: string) => Client | undefined;
    getProjectByName: (name: string) => Project | undefined;
    getJobById: (id: string) => Job | undefined;
    getSavedJobs: () => Job[];
    getApplicationsByJobId: (jobId: string) => JobApplication[];
}

export type AppStore = AuthSlice & ClientSlice & ProjectSlice & FinanceSlice & TeamSlice & CollaborationSlice & JobSlice & GetterSlice & {
    clearUserData: () => void;
};

const initialState = {
    session: null,
    profile: null,
    isAuthenticated: false,
    isLoading: true,
    
    // Data
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
    applications: [],
    savedJobIds: [],
    notifiedJobIds: [],
    notifications: [],
    projectComments: [],
    projectFiles: [],
    shadowIncome: [],
    invoiceTemplates: [],
    proposalTemplates: [],
    contractTemplates: [],
    portalComments: [],
    portalFiles: [],
    monthlyGoalCents: 500000,

    // Granular Loading States
    isClientsLoading: true,
    isProjectsLoading: true,
    isTasksLoading: true,
    isInvoicesLoading: true,
    isExpensesLoading: true,
    isTimeEntriesLoading: true,
};


export const useAppStore = create<AppStore>()(
    persist(
        (set, get) => ({
            ...initialState,

            ...createAuthSlice(set, get, {} as any),
            ...createClientSlice(set, get, {} as any),
            ...createProjectSlice(set, get, {} as any),
            ...createFinanceSlice(set, get, {} as any),
            ...createTeamSlice(set, get, {} as any),
            ...createCollaborationSlice(set, get, {} as any),
            ...createJobSlice(set, get, {} as any),

            clearUserData: () => set({ ...initialState, isLoading: false, isAuthenticated: false }),

            fetchInitialData: async (user) => {
                const state = get();
                
                // OPTIMIZATION: Do NOT set global isLoading to true here.
                // We want the Dashboard to render immediately with skeletons if needed,
                // rather than blocking the entire app with a full-screen loader.

                try {
                    // Paso 1: Cargar el perfil primero. Es crítico para la UI y para ciertas lógicas.
                    try {
                        await state.fetchProfile(user.id);
                    } catch (profileError) {
                        console.error("Error fetching profile:", profileError);
                    }

                    // Paso 2: Cargar el resto de datos en paralelo de forma robusta
                    const dataFetchers = [
                        { name: 'Clients', fn: state.fetchClients },
                        { name: 'Projects', fn: state.fetchProjects },
                        { name: 'Tasks', fn: state.fetchTasks },
                        { name: 'Invoices', fn: state.fetchInvoices },
                        { name: 'RecurringInvoices', fn: state.fetchRecurringInvoices },
                        { name: 'Expenses', fn: state.fetchExpenses },
                        { name: 'RecurringExpenses', fn: state.fetchRecurringExpenses },
                        { name: 'TimeEntries', fn: state.fetchTimeEntries },
                        { name: 'Proposals', fn: state.fetchProposals },
                        { name: 'Contracts', fn: state.fetchContracts },
                        { name: 'Budgets', fn: state.fetchBudgets },
                        { name: 'Users', fn: state.fetchUsers },
                        { name: 'Articles', fn: state.fetchArticles },
                        { name: 'Jobs', fn: state.fetchJobs },
                        { name: 'Applications', fn: state.fetchApplications },
                        { name: 'ProjectComments', fn: state.fetchProjectComments },
                        { name: 'ProjectFiles', fn: state.fetchProjectFiles },
                        { name: 'Templates', fn: state.fetchTemplates },
                    ];
                    
                    // Usamos allSettled para que si falla una tabla (ej. migración pendiente),
                    // no detenga la carga del resto de la aplicación.
                    const results = await Promise.allSettled(dataFetchers.map(fetcher => fetcher.fn()));
                    
                    results.forEach((result, index) => {
                        if (result.status === 'rejected') {
                            // Log discreto para no saturar la consola del usuario final
                            console.warn(`⚠️ Datos parciales: No se pudo cargar ${dataFetchers[index].name}`, result.reason);
                        }
                    });
                } catch (error) {
                    console.error("Critical error during initial data fetch:", error);
                } 
                // No need to set isLoading false here, handled by App.tsx or logic flow
            },

            // --- GETTERS ---
            getClientById: (id) => get().clients.find(c => c.id === id),
            getProjectById: (id) => get().projects.find(p => p.id === id),
            getTasksByProjectId: (id) => get().tasks.filter(t => t.project_id === id),
            getClientByName: (name) => get().clients.find(c => c.name.toLowerCase() === name.toLowerCase()),
            getProjectByName: (name) => get().projects.find(p => p.name.toLowerCase() === name.toLowerCase()),
            getJobById: (id) => get().jobs.find(j => j.id === id),
            getSavedJobs: () => get().jobs.filter(j => get().savedJobIds.includes(j.id)),
            getApplicationsByJobId: (jobId) => get().applications.filter(a => a.jobId === jobId),

        }),
        {
            name: 'devfreelancer-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ 
                savedJobIds: state.savedJobIds,
                notifiedJobIds: state.notifiedJobIds,
            }),
        }
    )
);