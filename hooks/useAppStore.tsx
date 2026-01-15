
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
import { InboxSlice, createInboxSlice } from './store/inboxSlice';

// Combine all slices into one AppState
export type AppState = AuthSlice & ClientSlice & ProjectSlice & FinanceSlice & TeamSlice & NotificationSlice & JobSlice & PortalSlice & InboxSlice;

export const useAppStore = create<AppState>()(
  persist(
    (...a) => {
      const store = {
        ...MOCK_DATA,
        ...createAuthSlice(...a),
        ...createClientSlice(...a),
        ...createProjectSlice(...a),
        ...createFinanceSlice(...a),
        ...createTeamSlice(...a),
        ...createNotificationSlice(...a),
        ...createJobSlice(...a),
        ...createPortalSlice(...a),
        ...createInboxSlice(...a),
      };
      
      // Override initializeAuth to include new fetches
      const originalInitialize = store.initializeAuth;
      store.initializeAuth = async () => {
          await originalInitialize();
          // After auth is ready (or if session exists), fetch all data
          // We can check isAuthenticated from the state, but inside this async flow it might be stale 
          // relying on what originalInitialize sets.
          // Better approach: just call fetches, they will fail silently or return empty if no user.
          await Promise.all([
              store.fetchFinanceData(),
              store.fetchJobs(),
              store.fetchApplications() // If needed for freelancer view
          ]);
      };

      return store;
    },
    {
      name: 'devfreelancer-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist parts of the state that are purely local preferences or cache
      partialize: (state) => ({
        savedJobIds: state.savedJobIds,
        notifiedJobIds: state.notifiedJobIds,
        notifiedEvents: state.notifiedEvents,
        monthlyGoalCents: state.monthlyGoalCents,
        // We might want to persist 'profile' for offline support before network loads
        profile: state.profile,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
