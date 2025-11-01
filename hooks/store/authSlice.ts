
import { StateCreator } from 'zustand';
import { Profile, GoogleJwtPayload } from '../../types.ts';
import { AppState } from '../useAppStore.tsx';

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

export const createAuthSlice: StateCreator<AppState, [], [], AuthSlice> = (set) => ({
    isAuthenticated: false,
    profile: null,
    login: (email, pass) => {
        // TODO: Implementar lógica de autenticación real contra un backend.
        // El inicio de sesión con datos de prueba ha sido eliminado.
        console.error("El inicio de sesión con email/contraseña no está implementado en este prototipo.");
        return false;
    },
    loginWithGoogle: (payload) => {
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
        set({ isAuthenticated: true, profile: newProfile });
    },
    logout: () => set({ isAuthenticated: false, profile: null }),
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
        set({ 
            isAuthenticated: true,
            profile: newProfile
        });
        return true;
    },
    upgradePlan: (plan) => set(state => ({ profile: state.profile ? { ...state.profile, plan } : null })),
    purchaseCredits: (amount) => set(state => ({ profile: state.profile ? { ...state.profile, ai_credits: state.profile.ai_credits + amount } : null })),
    consumeCredits: (amount) => set(state => ({ profile: state.profile ? { ...state.profile, ai_credits: Math.max(0, state.profile.ai_credits - amount) } : null })),
});