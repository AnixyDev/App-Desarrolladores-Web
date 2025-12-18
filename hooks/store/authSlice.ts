import { StateCreator } from 'zustand';
import { AppState } from '../useAppStore';
import { Profile, GoogleJwtPayload } from '../../types';
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
  updateProfile: (profileData: Partial<Profile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  upgradePlan: (plan: 'Pro' | 'Teams') => void;
  purchaseCredits: (amount: number) => void;
  consumeCredits: (amount: number) => boolean;
  initializeAuth: () => Promise<void>;
}

export const createAuthSlice: StateCreator<AppState, [], [], AuthSlice> = (set, get) => ({
    isAuthenticated: false,
    profile: initialProfile,
    
    refreshProfile: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
            
            if (profileData) {
                set({ profile: profileData as Profile });
                console.log("Perfil sincronizado con Supabase.");
            }
        }
    },

    initializeAuth: async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                set({ isAuthenticated: true });
                await get().refreshProfile();
                
                // Carga paralela para máxima performance
                await Promise.all([
                    get().fetchClients(),
                    get().fetchProjects(),
                    get().fetchTasks(),
                    get().fetchTimeEntries()
                ]);
            }
        } catch (error) {
            console.error("Error initializing auth:", error);
        }
    },

    login: async (email, password) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password: password || '' });
            if (!error && data.user) {
                await get().initializeAuth();
                return true;
            }
        } catch (error) {
            console.error("Supabase login failed", error);
        }
        return false;
    },

    logout: async () => {
        await supabase.auth.signOut();
        set({ isAuthenticated: false, profile: initialProfile });
    },

    register: async (name, email, password) => {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password: password || '',
                options: { data: { full_name: name } }
            });
            return !error && !!data.user;
        } catch (error) {
            return false;
        }
    },

    updateProfile: async (profileData) => {
        const { profile } = get();
        if (profile.id) {
            const { error } = await supabase.from('profiles').update(profileData).eq('id', profile.id);
            if (!error) {
                set(state => ({ profile: { ...state.profile, ...profileData } as Profile }));
            }
        }
    },

    upgradePlan: (plan) => get().updateProfile({ plan }),
    purchaseCredits: (amount) => get().updateProfile({ ai_credits: (get().profile.ai_credits || 0) + amount }),
    consumeCredits: (amount) => {
        if (get().profile.ai_credits >= amount) {
            get().updateProfile({ ai_credits: get().profile.ai_credits - amount });
            return true;
        }
        return false;
    },
});