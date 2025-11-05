import { StateCreator } from 'zustand';
import { Profile, GoogleJwtPayload, UserData } from '../../types.ts';
import { AppState } from '../useAppStore.tsx';

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

const createCleanState = (newProfile: Profile) => {
    const newUserData: UserData = {
        id: newProfile.id,
        name: `${newProfile.full_name} (Tú)`,
        email: newProfile.email,
        role: 'Admin',
        status: 'Activo',
        hourly_rate_cents: newProfile.hourly_rate_cents
    };
    return {
        isAuthenticated: true,
        profile: newProfile,
        clients: [],
        projects: [],
        tasks: [],
        invoices: [],
        expenses: [],
        recurringExpenses: [],
        timeEntries: [],
        budgets: [],
        proposals: [],
        contracts: [],
        users: [newUserData],
        referrals: [],
        articles: [],
        jobs: [],
        applications: [],
        savedJobIds: [],
        monthlyGoalCents: 500000,
    };
};

export const createAuthSlice: StateCreator<AppState, [], [], AuthSlice> = (set, get) => ({
    isAuthenticated: false,
    profile: null,
    login: (email, pass) => {
        // Simulación de login para prototipo:
        // Comprueba si el email coincide con el perfil guardado en localStorage.
        // No comprueba la contraseña.
        const storedProfile = get().profile;
        if (storedProfile && storedProfile.email.toLowerCase() === email.toLowerCase()) {
            set({ isAuthenticated: true });
            return true;
        }
        return false;
    },
    loginWithGoogle: (payload) => {
        const existingProfile = get().profile;

        if (existingProfile && existingProfile.email === payload.email) {
            set({ isAuthenticated: true });
        } else {
            const newProfile: Profile = {
              id: payload.sub,
              full_name: payload.name,
              email: payload.email,
              avatar_url: payload.picture,
              business_name: `${payload.name}'s Business`,
              tax_id: '',
              hourly_rate_cents: 7500,
              pdf_color: '#d9009f',
              plan: 'Pro',
              ai_credits: 500,
              affiliate_code: payload.name.toUpperCase().replace(/\s/g, '') + Date.now().toString().slice(-3),
              bio: 'Desarrollador Full-Stack apasionado por crear aplicaciones web modernas y eficientes.',
              skills: ['React', 'Node.js', 'TypeScript', 'Next.js'],
              portfolio_url: '',
              payment_reminders_enabled: true,
              reminder_template_upcoming: 'Hola [ClientName],\n\nEste es un recordatorio amistoso de que la factura #[InvoiceNumber] por un total de [Amount] vence pronto, el [DueDate].\n\nGracias,\n[YourName]',
              reminder_template_overdue: 'Hola [ClientName],\n\nNuestros registros indican que la factura #[InvoiceNumber] por [Amount] ha vencido. Agradeceríamos tu pago lo antes posible.\n\nGracias,\n[YourName]',
            };
            set(createCleanState(newProfile));
        }
    },
    logout: () => set({
        isAuthenticated: false,
    }),
    register: (name, email, pass) => {
        const newProfile: Profile = {
          id: `u-${Date.now()}`,
          full_name: name,
          email: email,
          avatar_url: undefined,
          business_name: `${name}'s Business`,
          tax_id: '',
          hourly_rate_cents: 7500,
          pdf_color: '#d9009f',
          plan: 'Pro',
          ai_credits: 500,
          affiliate_code: name.toUpperCase().replace(/\s/g, '') + Date.now().toString().slice(-3),
          bio: 'Desarrollador Full-Stack apasionado por crear aplicaciones web modernas y eficientes.',
          skills: ['React', 'Node.js', 'TypeScript', 'Next.js'],
          portfolio_url: '',
          payment_reminders_enabled: true,
          reminder_template_upcoming: 'Hola [ClientName],\n\nEste es un recordatorio amistoso de que la factura #[InvoiceNumber] por un total de [Amount] vence pronto, el [DueDate].\n\nGracias,\n[YourName]',
          reminder_template_overdue: 'Hola [ClientName],\n\nNuestros registros indican que la factura #[InvoiceNumber] por [Amount] ha vencido. Agradeceríamos tu pago lo antes posible.\n\nGracias,\n[YourName]',
        };
        set(createCleanState(newProfile));
        return true;
    },
    updateProfile: (newProfileData: Profile) => set({ profile: newProfileData }),
    upgradePlan: (plan) => set(state => ({ profile: state.profile ? { ...state.profile, plan } : null })),
    purchaseCredits: (amount) => set(state => ({ profile: state.profile ? { ...state.profile, ai_credits: state.profile.ai_credits + amount } : null })),
    consumeCredits: (amount) => set(state => ({ profile: state.profile ? { ...state.profile, ai_credits: Math.max(0, state.profile.ai_credits - amount) } : null })),
});