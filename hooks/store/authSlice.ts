import { StateCreator } from 'zustand';
import { Profile, GoogleJwtPayload } from '../../types.ts';
import { AppState } from '../useAppStore.tsx';
import { MOCK_DATA } from '../../lib/mock-data.ts';

const FRESH_STATE = {
    clients: [],
    projects: [],
    tasks: [],
    timeEntries: [],
    invoices: [],
    expenses: [],
    recurringExpenses: [],
    budgets: [],
    proposals: [],
    contracts: [],
    users: [],
    referrals: [],
    monthlyGoalCents: 0,
};


export interface AuthSlice {
  isAuthenticated: boolean;
  profile: Profile | null;
  login: (email: string, pass: string) => boolean;
  loginWithGoogle: (payload: GoogleJwtPayload) => void;
  logout: () => void;
  register: (name: string, email: string, pass: string) => boolean;
  upgradePlan: (plan: 'Pro' | 'Teams') => void;
  purchaseCredits: (amount: number) => void;
  consumeCredits: (amount: number) => void;
}

export const createAuthSlice: StateCreator<AppState, [], [], AuthSlice> = (set, get) => ({
    isAuthenticated: false,
    profile: null,
    login: (email, pass) => {
        // El inicio de sesión con email/contraseña no está implementado en este prototipo.
        // Los usuarios deben usar el inicio de sesión de Google o registrar una nueva cuenta.
        console.error("El inicio de sesión con email/contraseña no está implementado en este prototipo.");
        return false;
    },
    loginWithGoogle: (payload) => {
        const existingProfile = get().profile;

        // If a user is already in state and their email matches, just log them in.
        // This handles re-authentication for an existing user session.
        if (existingProfile && existingProfile.email === payload.email) {
            set({ isAuthenticated: true });
        } else {
            // Otherwise, it's a new user or a different user. 
            // Create a new profile and reset the rest of the app state.
            const newProfile: Profile = {
              id: payload.sub,
              full_name: payload.name,
              email: payload.email,
              business_name: `${payload.name}'s Business`,
              tax_id: '',
              hourly_rate_cents: 0,
              pdf_color: '#d9009f',
              plan: 'Free',
              ai_credits: 10,
              affiliate_code: payload.name.toUpperCase().replace(/\s/g, '') + Date.now().toString().slice(-3),
            };
            set({ 
                isAuthenticated: true, 
                profile: newProfile,
                ...FRESH_STATE
            });
        }
    },
    logout: () => set({
        // Only set isAuthenticated to false. This preserves the user's data in localStorage
        // so they can log back in with Google and find their data again.
        isAuthenticated: false,
    }),
    register: (name, email, pass) => {
        const newProfile: Profile = {
          id: `u-${Date.now()}`,
          full_name: name,
          email: email,
          business_name: `${name}'s Business`,
          tax_id: '',
          hourly_rate_cents: 0,
          pdf_color: '#d9009f',
          plan: 'Free',
          ai_credits: 10,
          affiliate_code: name.toUpperCase().replace(/\s/g, '') + Date.now().toString().slice(-3),
        };
         // For a new registration, always start with a completely fresh state.
        set({ 
            isAuthenticated: true,
            profile: newProfile,
            ...FRESH_STATE
        });
        return true;
    },
    upgradePlan: (plan) => set(state => ({ profile: state.profile ? { ...state.profile, plan } : null })),
    purchaseCredits: (amount) => set(state => ({ profile: state.profile ? { ...state.profile, ai_credits: state.profile.ai_credits + amount } : null })),
    consumeCredits: (amount) => set(state => ({ profile: state.profile ? { ...state.profile, ai_credits: Math.max(0, state.profile.ai_credits - amount) } : null })),
});