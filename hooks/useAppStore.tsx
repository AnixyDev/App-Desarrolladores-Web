
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { createAuthSlice, AuthSlice } from './store/authSlice.ts';
import { createClientSlice, ClientSlice } from './store/clientSlice.ts';
import { createProjectSlice, ProjectSlice } from './store/projectSlice.ts';
import { createFinanceSlice, FinanceSlice } from './store/financeSlice.ts';
import { createTeamSlice, TeamSlice } from './store/teamSlice.ts';

export type AppState = AuthSlice & ClientSlice & ProjectSlice & FinanceSlice & TeamSlice;

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...createAuthSlice(set, get),
      ...createClientSlice(set, get),
      ...createProjectSlice(set, get),
      ...createFinanceSlice(set, get),
      ...createTeamSlice(set, get),
    }),
    {
      name: 'devfreelancer-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
    }
  )
);