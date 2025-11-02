
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
    // FIX: Use rest parameters to pass all arguments (set, get, api) to slice creators, resolving errors about incorrect argument counts.
    (...a) => ({
      ...createAuthSlice(...a),
      ...createClientSlice(...a),
      ...createProjectSlice(...a),
      ...createFinanceSlice(...a),
      ...createTeamSlice(...a),
    }),
    {
      name: 'devfreelancer-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
    }
  )
);
