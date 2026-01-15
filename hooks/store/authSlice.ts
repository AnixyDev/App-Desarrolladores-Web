
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
    role: 'Developer',
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
            
            if (!session?.user) {
                set({ isAuthenticated: false, profile: initialProfile });
                return;
            }

            const { data: profileData, error: fetchError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
            
            if (fetchError || !profileData) {
                const fallbackProfile = {
                    id: session.user.id,
                    email: session.user.email || '',
                    full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Usuario',
                    plan: 'Free',
                    role: 'Developer',
                    ai_credits: 10
                };

                // Intento de Upsert silencioso
                const { data: newProfile, error: upsertError } = await supabase
                    .from('profiles')
                    .upsert(fallbackProfile)
                    .select()
                    .single();

                if (!upsertError && newProfile) {
                    set({ profile: newProfile as Profile, isAuthenticated: true });
                } else {
                    // Fallback local absoluto para garantizar operatividad
                    set({ profile: { ...initialProfile, ...fallbackProfile } as Profile, isAuthenticated: true });
                }
            } else {
                set({ profile: profileData as Profile, isAuthenticated: true });
            }
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error("Auth context refresh error:", error);
            }
        } finally {
            set({ isProfileLoading: false });
        }
    },

    initializeAuth: async () => {
        set({ isProfileLoading: true });

        const safetyTimeout = setTimeout(() => {
            if (get().isProfileLoading) {
                set({ isProfileLoading: false });
            }
        }, 5000);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                await get().refreshProfile();
                
                // Prefetch de datos en paralelo
                get().fetchClients().catch(() => null);
                get().fetchProjects().catch(() => null);
                get().fetchTasks().catch(() => null);
                get().fetchTimeEntries().catch(() => null);
                get().fetchFinanceData().catch(() => null);
            } else {
                set({ isAuthenticated: false });
            }
        } catch (error) {
            // Silencioso en producción
        } finally {
            clearTimeout(safetyTimeout);
            set({ isProfileLoading: false });
        }
    },

    login: async (email, password) => {
        set({ isProfileLoading: true });
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password: password || '' });
            if (error) throw error;
            if (data.user) {
                await get().refreshProfile();
                return true;
            }
        } catch (error: any) {
            console.error("Auth: sign_in_error", error.message);
        } finally {
            set({ isProfileLoading: false });
        }
        return false;
    },

    logout: async () => {
        try {
            await supabase.auth.signOut();
        } finally {
            set({ isAuthenticated: false, profile: initialProfile, isProfileLoading: false });
        }
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
                profile: { ...state.profile, ai_credits: (state.profile.ai_credits || 0) - amount } as Profile 
            }));
            return true;
        }
        return false;
    },
});
