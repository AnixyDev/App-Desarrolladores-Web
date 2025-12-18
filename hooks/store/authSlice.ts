
import { StateCreator } from 'zustand';
import { AppState } from '../useAppStore';
import { Profile } from '../../types';
import { supabase } from '../../lib/supabaseClient';

const initialProfile: Profile = {
    id: '',
    full_name: '',
    email: '',
    business_name: '',
    tax_id: '',
    avatar_url: '',
    plan: 'Free',
    role: '',
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
  isProfileLoading: boolean; 
  profile: Profile;
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (name: string, email: string, password?: string) => Promise<boolean>;
  updateProfile: (profileData: Partial<Profile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  upgradePlan: (plan: 'Pro' | 'Teams') => void;
  purchaseCredits: (amount: number) => void;
  consumeCredits: (amount: number) => Promise<boolean>;
  initializeAuth: () => Promise<void>;
}

export const createAuthSlice: StateCreator<AppState, [], [], AuthSlice> = (set, get) => ({
    isAuthenticated: false,
    isProfileLoading: true, 
    profile: initialProfile,
    
    refreshProfile: async () => {
        set({ isProfileLoading: true });
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const { data: profileData, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();
                
                if (!error && profileData) {
                    set({ profile: profileData as Profile, isAuthenticated: true });
                }
            } else {
                set({ isAuthenticated: false, profile: initialProfile });
            }
        } catch (error) {
            console.error("Error refreshing profile:", error);
        } finally {
            set({ isProfileLoading: false });
        }
    },

    initializeAuth: async () => {
        set({ isProfileLoading: true });
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();
                
                if (profileData) {
                    set({ profile: profileData as Profile, isAuthenticated: true });
                }

                await Promise.all([
                    get().fetchClients(),
                    get().fetchProjects(),
                    get().fetchTasks(),
                    get().fetchTimeEntries()
                ]);
            } else {
                set({ isAuthenticated: false });
            }
        } catch (error) {
            console.error("Error initializing auth:", error);
        } finally {
            set({ isProfileLoading: false });
        }
    },

    login: async (email, password) => {
        set({ isProfileLoading: true });
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ 
                email, 
                password: password || '' 
            });
            
            if (!error && data.user) {
                await get().initializeAuth();
                return true;
            }
        } catch (error) {
            console.error("Supabase login failed", error);
        } finally {
            // Solo quitamos el loading si falló el login, 
            // si tuvo éxito, initializeAuth ya lo habrá puesto en false
            if (!get().isAuthenticated) {
                set({ isProfileLoading: false });
            }
        }
        return false;
    },

    logout: async () => {
        await supabase.auth.signOut();
        set({ isAuthenticated: false, profile: initialProfile, isProfileLoading: false });
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
    
    consumeCredits: async (amount) => {
        const { profile } = get();
        if (!profile.id) return false;

        const { data: success, error } = await supabase.rpc('consume_credits_atomic', { 
            user_id: profile.id, 
            amount_to_consume: amount 
        });

        if (!error && success) {
            set(state => ({ 
                profile: { 
                    ...state.profile, 
                    ai_credits: (state.profile.ai_credits || 0) - amount 
                } as Profile 
            }));
            return true;
        }
        return false;
    },
});
