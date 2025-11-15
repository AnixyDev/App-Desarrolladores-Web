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
                const { 
                    fetchProfile, fetchClients, fetchProjects, fetchTasks, 
                    fetchInvoices, fetchRecurringInvoices, fetchExpenses, fetchRecurringExpenses, 
                    fetchTimeEntries, fetchProposals, fetchContracts, fetchBudgets,
                    fetchUsers, fetchArticles, fetchJobs, fetchApplications,
                    fetchProjectComments, fetchProjectFiles, fetchTemplates
                } = get();
                
                set({ isLoading: true });
                try {
                    await Promise.all([
                        fetchProfile(user.id),
                        fetchClients(),
                        fetchProjects(),
                        fetchTasks(),
                        fetchInvoices(),
                        fetchRecurringInvoices(),
                        fetchExpenses(),
                        fetchRecurringExpenses(),
                        fetchTimeEntries(),
                        fetchProposals(),
                        fetchContracts(),
                        fetchBudgets(),
                        fetchUsers(),
                        fetchArticles(),
                        fetchJobs(),
                        fetchApplications(),
                        fetchProjectComments(),
                        fetchProjectFiles(),
                        fetchTemplates(),
                    ]);
                } catch (error) {
                    console.error("Failed to fetch initial data:", error);
                } finally {
                    set({ isLoading: false });
                }
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