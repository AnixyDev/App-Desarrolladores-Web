// hooks/useAppStore.tsx
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AuthSlice, createAuthSlice } from './store/authSlice.ts';
import { ClientSlice, createClientSlice } from './store/clientSlice.ts';
import { ProjectSlice, createProjectSlice } from './store/projectSlice.ts';
import { FinanceSlice, createFinanceSlice } from './store/financeSlice.ts';
import { NotificationSlice, createNotificationSlice } from './store/notificationSlice.ts';
import { TeamSlice, createTeamSlice } from './store/teamSlice.ts';
import { JobSlice, createJobSlice } from './store/jobSlice.ts';
import { MOCK_DATA } from '../lib/mock-data.ts';

export type AppState = AuthSlice & ClientSlice & ProjectSlice & FinanceSlice & NotificationSlice & TeamSlice & JobSlice;

export const useAppStore = create<AppState>()(
  persist(
    (...a) => ({
      ...createAuthSlice(...a),
      ...createClientSlice(...a),
      ...createProjectSlice(...a),
      ...createFinanceSlice(...a),
      ...createNotificationSlice(...a),
      ...createTeamSlice(...a),
      ...createJobSlice(...a),
      // Initialize with mock data
      ...MOCK_DATA,
    }),
    {
      name: 'devfreelancer-storage', // unique name
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
    }
  )
);