import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MOCK_DATA } from '../lib/mock-data';

// Slices
import { AuthSlice, createAuthSlice } from './store/authSlice';
import { ClientSlice, createClientSlice } from './store/clientSlice';
import { ProjectSlice, createProjectSlice } from './store/projectSlice';
import { FinanceSlice, createFinanceSlice } from './store/financeSlice';
import { TeamSlice, createTeamSlice } from './store/teamSlice';
import { NotificationSlice, createNotificationSlice } from './store/notificationSlice';
import { JobSlice, createJobSlice } from './store/jobSlice';
import { PortalSlice, createPortalSlice } from './store/portalSlice';

// Combine all slices into one AppState
export type AppState = AuthSlice & ClientSlice & ProjectSlice & FinanceSlice & TeamSlice & NotificationSlice & JobSlice & PortalSlice;

export const useAppStore = create<AppState>()(
  persist(
    (...a) => ({
      ...MOCK_DATA,
      ...createAuthSlice(...a),
      ...createClientSlice(...a),
      ...createProjectSlice(...a),
      ...createFinanceSlice(...a),
      ...createTeamSlice(...a),
      ...createNotificationSlice(...a),
      ...createJobSlice(...a),
      ...createPortalSlice(...a),
    }),
    {
      name: 'devfreelancer-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist parts of the state
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        profile: state.profile,
        clients: state.clients,
        projects: state.projects,
        tasks: state.tasks,
        invoices: state.invoices,
        recurringInvoices: state.recurringInvoices,
        expenses: state.expenses,
        recurringExpenses: state.recurringExpenses,
        timeEntries: state.timeEntries,
        budgets: state.budgets,
        proposals: state.proposals,
        contracts: state.contracts,
        users: state.users,
        referrals: state.referrals,
        articles: state.articles,
        jobs: state.jobs,
        applications: state.applications,
        savedJobIds: state.savedJobIds,
        notifiedJobIds: state.notifiedJobIds,
        monthlyGoalCents: state.monthlyGoalCents,
        notifications: state.notifications,
        portalComments: state.portalComments,
        portalFiles: state.portalFiles,
      }),
    }
  )
);