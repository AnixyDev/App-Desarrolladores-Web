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

// Combine all slice types into a single AppStore type
export type AppStore = AuthSlice & ClientSlice & ProjectSlice & FinanceSlice & TeamSlice & CollaborationSlice & JobSlice & {
    clearUserData: () => void;
};

const initialState = {
    session: null,
    profile: null,
    isAuthenticated: false,
    isLoading: true, // Set to true initially to prevent auth flicker
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
        (set, get, api) => ({
            ...initialState,

            // Compose slices
            ...createAuthSlice(set, get, api),
            ...createClientSlice(set, get),
            ...createProjectSlice(set, get),
            ...createFinanceSlice(set, get),
            ...createTeamSlice(set, get),
            ...createCollaborationSlice(set, get),
            ...createJobSlice(set, get),

            clearUserData: () => set({ ...initialState, isLoading: false }),

            // Overridden fetchInitialData to fetch from all slices
            fetchInitialData: async (user) => {
                const { 
                    fetchProfile, fetchClients, fetchProjects, fetchTasks, 
                    fetchInvoices, fetchExpenses, fetchTimeEntries, 
                    fetchProposals, fetchContracts, fetchBudgets,
                    fetchUsers, fetchArticles, fetchJobs, fetchApplications,
                    fetchProjectComments, fetchProjectFiles
                } = get();
                
                // Set loading to true only when fetching starts
                set({ isLoading: true });
                try {
                    await Promise.all([
                        fetchProfile(user.id),
                        fetchClients(),
                        fetchProjects(),
                        fetchTasks(),
                        fetchInvoices(),
                        fetchExpenses(),
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
                    ]);
                } catch (error) {
                    console.error("Failed to fetch initial data:", error);
                    // Handle error state if necessary
                } finally {
                    set({ isLoading: false });
                }
            },

            // --- GETTERS (Remain synchronous, operating on local state) ---
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
                // Only persist session and user preferences, not all the data
                savedJobIds: state.savedJobIds,
                notifiedJobIds: state.notifiedJobIds,
            }),
        }
    )
);