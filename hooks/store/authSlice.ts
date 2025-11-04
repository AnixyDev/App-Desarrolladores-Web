import { StateCreator } from 'zustand';
import { Profile, GoogleJwtPayload } from '../../types.ts';
import { AppState } from '../useAppStore.tsx';
import { MOCK_DATA } from '../../lib/mock-data.ts';

// Al registrarse un nuevo usuario, se le cargará con un estado inicial poblado
// para que pueda explorar la aplicación con datos de ejemplo.
// Se excluye 'profile' porque se genera dinámicamente.
const { ...NEW_USER_STATE } = MOCK_DATA;


export interface AuthSlice {
  isAuthenticated: boolean;
  profile: Profile | null;
  login: (email: string, pass: string) => boolean;
  loginWithGoogle: (payload: GoogleJwtPayload) => void;
  logout: () => void;
  register: (name: string, email: string, pass: string) => boolean;
  updateProfile: (newProfileData: Profile) => void;
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

        // Si un usuario ya está en el estado y su email coincide, simplemente se loguea.
        // Esto maneja la re-autenticación para una sesión de usuario existente.
        if (existingProfile && existingProfile.email === payload.email) {
            set({ isAuthenticated: true });
        } else {
            // De lo contrario, es un usuario nuevo o diferente.
            // Se crea un nuevo perfil y se resetea el resto del estado de la app con datos de ejemplo.
            const newProfile: Profile = {
              id: payload.sub,
              full_name: payload.name,
              email: payload.email,
              avatar_url: payload.picture, // Captura la imagen de Google
              business_name: `${payload.name}'s Business`,
              tax_id: '',
              hourly_rate_cents: 7500, // 75 EUR/hr
              pdf_color: '#d9009f',
              plan: 'Pro', // Inicia en Pro para mostrar más funcionalidades
              ai_credits: 500,
              affiliate_code: payload.name.toUpperCase().replace(/\s/g, '') + Date.now().toString().slice(-3),
              bio: 'Desarrollador Full-Stack apasionado por crear aplicaciones web modernas y eficientes.',
              skills: ['React', 'Node.js', 'TypeScript', 'Next.js'],
              portfolio_url: '',
            };
            set({ 
                isAuthenticated: true, 
                profile: newProfile,
                ...NEW_USER_STATE
            });
        }
    },
    logout: () => set({
        // Solo se establece isAuthenticated a false. Esto preserva los datos del usuario en localStorage
        // para que puedan volver a iniciar sesión con Google y encontrar sus datos.
        isAuthenticated: false,
    }),
    register: (name, email, pass) => {
        const newProfile: Profile = {
          id: `u-${Date.now()}`,
          full_name: name,
          email: email,
          avatar_url: undefined, // Sin avatar por defecto en registro manual
          business_name: `${name}'s Business`,
          tax_id: '',
          hourly_rate_cents: 7500, // 75 EUR/hr
          pdf_color: '#d9009f',
          plan: 'Pro', // Inicia en Pro para mostrar más funcionalidades
          ai_credits: 500,
          affiliate_code: name.toUpperCase().replace(/\s/g, '') + Date.now().toString().slice(-3),
          bio: 'Desarrollador Full-Stack apasionado por crear aplicaciones web modernas y eficientes.',
          skills: ['React', 'Node.js', 'TypeScript', 'Next.js'],
          portfolio_url: '',
        };
         // Para un nuevo registro, siempre empezar con un estado fresco y poblado.
        set({ 
            isAuthenticated: true,
            profile: newProfile,
            ...NEW_USER_STATE
        });
        return true;
    },
    updateProfile: (newProfileData: Profile) => set({ profile: newProfileData }),
    upgradePlan: (plan) => set(state => ({ profile: state.profile ? { ...state.profile, plan } : null })),
    purchaseCredits: (amount) => set(state => ({ profile: state.profile ? { ...state.profile, ai_credits: state.profile.ai_credits + amount } : null })),
    consumeCredits: (amount) => set(state => ({ profile: state.profile ? { ...state.profile, ai_credits: Math.max(0, state.profile.ai_credits - amount) } : null })),
});