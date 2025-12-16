
import { StateCreator } from 'zustand';
import { AppState } from '../useAppStore';
import { Profile, GoogleJwtPayload, UserData } from '../../types';
import { supabase } from '../../lib/supabaseClient';

const initialProfile: Profile = {
    id: '',
    full_name: '',
    email: '',
    business_name: '',
    tax_id: '',
    avatar_url: '',
    plan: 'Free',
    ai_credits: 10,
    hourly_rate_cents: 0,
    pdf_color: '#d9009f',
    bio: '',
    skills: [],
    portfolio_url: '',
    payment_reminders_enabled: false,
    reminder_template_upcoming: '',
    reminder_template_overdue: '',
    affiliate_code: '',
    stripe_account_id: '',
    stripe_onboarding_complete: false,
};

export interface AuthSlice {
  isAuthenticated: boolean;
  profile: Profile;
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (name: string, email: string, password?: string) => Promise<boolean>;
  loginWithGoogle: (decoded: GoogleJwtPayload) => void;
  updateProfile: (profileData: Partial<Profile>) => void;
  upgradePlan: (plan: 'Pro' | 'Teams') => void;
  purchaseCredits: (amount: number) => void;
  consumeCredits: (amount: number) => boolean;
  updateStripeConnection: (accountId: string, onboardingComplete: boolean) => void;
  initializeAuth: () => Promise<void>;
}

export const createAuthSlice: StateCreator<AppState, [], [], AuthSlice> = (set, get) => ({
    isAuthenticated: false,
    profile: initialProfile,
    
    initializeAuth: async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();
                
                if (profileData) {
                    set({ isAuthenticated: true, profile: profileData as Profile });
                    
                    // Cargar datos iniciales desde Supabase
                    Promise.all([
                        get().fetchClients(),
                        get().fetchProjects(),
                        get().fetchTasks(),
                        get().fetchTimeEntries()
                    ]);
                }
            }
        } catch (error) {
            console.error("Error initializing auth:", error);
        }
    },

    login: async (email, password) => {
        try {
            if (password) {
                const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                if (!error && data.user) {
                    await get().initializeAuth(); // Esto cargará el perfil y los datos
                    return true;
                }
            }
        } catch (error) {
            console.error("Supabase login failed", error);
        }
        return false;
    },

    logout: async () => {
        try {
            await supabase.auth.signOut();
        } catch (e) {
            console.error("Error signing out from Supabase", e);
        }
        // Limpiar estado
        set({ 
            isAuthenticated: false, 
            profile: initialProfile,
            clients: [],
            projects: [],
            tasks: [],
            invoices: [],
            expenses: [],
            timeEntries: []
        });
    },

    register: async (name, email, password) => {
        try {
            if (password) {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { full_name: name }
                    }
                });

                if (!error && data.user) {
                    // El trigger en la base de datos crea el perfil, pero esperamos un poco o hacemos polling
                    // Para UX instantánea, seteamos auth true, pero initializeAuth traerá el perfil real
                    return true;
                }
            }
        } catch (error) {
            console.error("Supabase registration failed", error);
        }
        return false;
    },

    loginWithGoogle: (decoded) => {
        console.log("Google Login Client-side triggered (Deprecated flow for Supabase)");
        // En una implementación real con Supabase, usamos supabase.auth.signInWithOAuth
        // Aquí solo simulamos para mantener compatibilidad con el botón existente si no se cambia
    },

    updateProfile: (profileData) => {
        set(state => ({ profile: { ...state.profile, ...profileData } as Profile }));
        const { isAuthenticated, profile } = get();
        if (isAuthenticated && profile.id) {
             supabase.from('profiles').update(profileData).eq('id', profile.id).then(({ error }) => {
                 if (error) console.error("Error syncing profile update to Supabase:", error);
             });
        }
    },
    upgradePlan: (plan) => {
        get().updateProfile({ plan });
    },
    purchaseCredits: (amount) => {
        const newTotal = (get().profile.ai_credits || 0) + amount;
        get().updateProfile({ ai_credits: newTotal });
    },
    consumeCredits: (amount) => {
        const currentCredits = get().profile.ai_credits;
        if (currentCredits >= amount) {
            const newCredits = currentCredits - amount;
            set(state => ({ profile: { ...state.profile, ai_credits: newCredits } as Profile }));
            
            const { isAuthenticated, profile } = get();
            if (isAuthenticated && profile.id) {
                supabase.rpc('increment_credits', { user_id: profile.id, amount: -amount });
            }
            return true;
        }
        return false;
    },
    updateStripeConnection: (accountId, onboardingComplete) => {
        get().updateProfile({
            stripe_account_id: accountId,
            stripe_onboarding_complete: onboardingComplete,
        });
    },
});
