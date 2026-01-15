
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
  loginWithGoogle: (payload: GoogleJwtPayload) => Promise<void>;
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
        try {
            const { data: { session } } = await supabase.auth.getSession();
            
            if (!session?.user) {
                set({ isAuthenticated: false, profile: initialProfile, isProfileLoading: false });
                return;
            }

            const { data: profileData, error: fetchError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle();
            
            if (fetchError || !profileData) {
                const fallbackProfile = {
                    id: session.user.id,
                    email: session.user.email || '',
                    full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Usuario',
                    plan: 'Free',
                    role: 'Developer',
                    ai_credits: 10,
                    avatar_url: session.user.user_metadata?.avatar_url || ''
                };

                const { data: newProfile } = await supabase
                    .from('profiles')
                    .upsert(fallbackProfile, { onConflict: 'id' })
                    .select()
                    .single();

                set({ profile: (newProfile || fallbackProfile) as Profile, isAuthenticated: true });
            } else {
                set({ profile: profileData as Profile, isAuthenticated: true });
            }
        } catch (error) {
            console.error("RefreshProfile Error:", error);
        } finally {
            set({ isProfileLoading: false });
        }
    },

    initializeAuth: async () => {
        // Evitar múltiples inicializaciones simultáneas
        if (!get().isProfileLoading && get().isAuthenticated) return;

        set({ isProfileLoading: true });

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            await get().refreshProfile();
            // Carga diferida de datos para no bloquear el hilo principal
            get().fetchClients().catch(console.error);
            get().fetchProjects().catch(console.error);
            get().fetchTasks().catch(console.error);
            get().fetchTimeEntries().catch(console.error);
            get().fetchFinanceData().catch(console.error);
        } else {
            set({ isProfileLoading: false, isAuthenticated: false });
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
            console.error("Login Error:", error.message);
        } finally {
            set({ isProfileLoading: false });
        }
        return false;
    },

    loginWithGoogle: async () => {
        await get().refreshProfile();
    },

    logout: async () => {
        try {
            await supabase.auth.signOut();
            set({ isAuthenticated: false, profile: initialProfile, isProfileLoading: false });
            localStorage.removeItem('devfreelancer-storage');
        } catch (e) {
            console.error(e);
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
        if (!profile.id) return;
        
        try {
            const { error } = await supabase
                .from('profiles')
                .update(profileData)
                .eq('id', profile.id);

            if (error) throw error;
            
            set(state => ({ 
                profile: { ...state.profile, ...profileData } as Profile 
            }));
        } catch (err) {
            console.error("Error updating profile:", err);
            throw err;
        }
    },

    upgradePlan: (plan) => get().updateProfile({ plan }),
    purchaseCredits: (amount) => get().updateProfile({ ai_credits: (get().profile.ai_credits || 0) + amount }),
    
    consumeCredits: async (amount) => {
        const { profile } = get();
        if (!profile.id || (profile.ai_credits || 0) < amount) return false;

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
