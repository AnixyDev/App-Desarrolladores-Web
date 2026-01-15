
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MOCK_DATA } from '../lib/mock-data';

// Slices - Eliminadas extensiones .ts/.tsx para evitar errores de Rollup/Vercel
import { createAuthSlice, type AuthSlice } from './store/authSlice';
import { createClientSlice, type ClientSlice } from './store/clientSlice';
import { createProjectSlice, type ProjectSlice } from './store/projectSlice';
import { createFinanceSlice, type FinanceSlice } from './store/financeSlice';
import { createTeamSlice, type TeamSlice } from './store/teamSlice';
import { createNotificationSlice, type NotificationSlice } from './store/notificationSlice';
import { createJobSlice, type JobSlice } from './store/jobSlice';
import { createPortalSlice, type PortalSlice } from './store/portalSlice';
import { createInboxSlice, type InboxSlice } from './store/inboxSlice';

// Combine all slices into one AppState
export type AppState = AuthSlice & ClientSlice & ProjectSlice & FinanceSlice & TeamSlice & NotificationSlice & JobSlice & PortalSlice & InboxSlice;

export const useAppStore = create<AppState>()(
  persist(
    (...a) => {
      // Creamos el store base uniendo los MOCK_DATA con los slices
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
      
      // Sobrescribimos initializeAuth de forma segura
      const originalInitialize = store.initializeAuth;
      
      store.initializeAuth = async () => {
          if (originalInitialize) {
              await originalInitialize();
          }
          
          // Solo intentamos descargar datos adicionales si el store tiene esas funciones disponibles
          try {
              await Promise.all([
                  store.fetchFinanceData?.(),
                  store.fetchJobs?.(),
                  store.fetchApplications?.()
              ].filter(Boolean)); // Filtramos funciones que no existan para evitar errores
          } catch (error) {
              console.error("Error al inicializar datos del store:", error);
          }
      };

      return store;
    },
    {
      name: 'devfreelancer-storage',
      storage: createJSONStorage(() => localStorage),
      // Persistencia selectiva para evitar estados corruptos tras actualizar
      partialize: (state) => ({
        savedJobIds: state.savedJobIds,
        notifiedJobIds: state.notifiedJobIds,
        notifiedEvents: state.notifiedEvents,
        monthlyGoalCents: state.monthlyGoalCents,
        profile: state.profile,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);