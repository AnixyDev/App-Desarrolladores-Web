import { supabase } from '../../lib/supabaseClient';
import type { Session, User } from '@supabase/supabase-js';
import type { StateCreator } from 'zustand';
import type { AppStore } from '../useAppStore';
import type { Profile } from '../../types';

export interface AuthSlice {
    session: Session | null;
    profile: Profile | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    setSession: (session: Session | null) => void;
    login: (email: string, pass: string) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    loginWithGithub: () => Promise<void>;
    register: (name: string, email: string, pass: string) => Promise<void>;
    logout: () => Promise<void>;
    fetchProfile: (userId: string) => Promise<void>;
    fetchInitialData: (user: User) => Promise<void>; // This will be composed in the main store
    updateProfile: (updatedProfile: Partial<Profile>) => Promise<void>;
    completeOnboarding: () => void;
    consumeCredits: (amount: number) => Promise<void>;
    updateStripeConnection: (accountId: string, isComplete: boolean) => Promise<void>;
}

// FIX: Implement missing functions in createAuthSlice
export const createAuthSlice: StateCreator<AppStore, [], [], AuthSlice> = (set, get) => ({
    session: null,
    profile: null,
    isAuthenticated: false,
    isLoading: true, // Will be set to false after initial check in App.tsx

    setSession: (session) => {
        set({ session, isAuthenticated: !!session, isLoading: false });
    },

    login: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
    },

    loginWithGoogle: async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin,
            }
        });
        if (error) throw error;
    },

    loginWithGithub: async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'github',
            options: {
                redirectTo: window.location.origin,
            }
        });
        if (error) throw error;
    },

    register: async (name, email, password) => {
        const { data: { user }, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { 
                    full_name: name,
                    avatar_url: `https://api.dicebear.com/6.x/initials/svg?seed=${name}`
                }
            }
        });

        if (error) throw error;
        if (!user) throw new Error("Registration failed, user not returned.");

        // Create a profile entry for the new user
        const { error: profileError } = await supabase.from('profiles').insert({
            id: user.id,
            email: user.email,
            full_name: name,
            // Set default values for a new profile
            isNewUser: true,
            plan: 'Free',
            ai_credits: 10,
            hourly_rate_cents: 5000,
            pdf_color: '#F000B8',
            payment_reminders_enabled: false,
            reminder_template_upcoming: 'Recordatorio: La factura [InvoiceNumber] de [Amount] vence el [DueDate].',
            reminder_template_overdue: 'AVISO: La factura [InvoiceNumber] de [Amount] ha vencido. Por favor, realiza el pago lo antes posible.',
            email_notifications: {
                on_invoice_overdue: true,
                on_proposal_status_change: true,
                on_contract_signed: true,
                on_new_project_message: true,
            },
            affiliate_code: `ref_${user.id.substring(0, 8)}`,
            stripe_onboarding_complete: false,
        });

        if (profileError) {
            console.error("Failed to create profile for new user:", profileError);
            // Optional: You might want to delete the user if profile creation fails
            // to avoid orphaned auth users.
            throw profileError;
        }
    },

    logout: async () => {
        // The onAuthStateChange listener in App.tsx will handle clearing the state.
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },
    
    // To be composed/overridden in the main store
    fetchInitialData: async (user: User) => {
        // This is a placeholder. The main store will implement the full data fetching logic.
        await get().fetchProfile(user.id);
    },

    fetchProfile: async (userId) => {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
        if (error) {
            if (error.code === 'PGRST116') {
                console.warn("Profile not found for user. This can happen with social logins for the first time or if profile creation failed.");
                return;
            }
            throw error;
        }
        set({ profile: data });
    },

    updateProfile: async (updatedProfile) => {
        const userId = get().session?.user?.id;
        if (!userId) throw new Error("User not authenticated");
        const { data, error } = await supabase.from('profiles').update(updatedProfile).eq('id', userId).select().single();
        if (error) throw error;
        set({ profile: data });
    },

    completeOnboarding: () => {
        const userId = get().profile?.id;
        if (!userId) return;
        
        set(state => ({
            profile: state.profile ? { ...state.profile, isNewUser: false } : null
        }));
        
        supabase.from('profiles').update({ isNewUser: false }).eq('id', userId).then(({ error }) => {
            if (error) console.error("Failed to update onboarding status in DB:", error);
        });
    },

    consumeCredits: async (amount) => {
        const currentProfile = get().profile;
        if (!currentProfile) throw new Error("Profile not loaded");
        if (currentProfile.ai_credits < amount) throw new Error("Insufficient AI credits.");

        const newCredits = currentProfile.ai_credits - amount;
        set({ profile: { ...currentProfile, ai_credits: newCredits } });

        const { error } = await supabase.from('profiles').update({ ai_credits: newCredits }).eq('id', currentProfile.id);
        if (error) {
            // Revert state on DB error
            set({ profile: currentProfile });
            throw error;
        }
    },

    updateStripeConnection: async (accountId, isComplete) => {
        const currentProfile = get().profile;
        if (!currentProfile) throw new Error("Profile not loaded");

        const updatedProfile = { 
            ...currentProfile, 
            stripe_account_id: accountId, 
            stripe_onboarding_complete: isComplete 
        };
        set({ profile: updatedProfile });

        const { error } = await supabase
            .from('profiles')
            .update({ stripe_account_id: accountId, stripe_onboarding_complete: isComplete })
            .eq('id', currentProfile.id);
        
        if (error) {
            // Revert state on DB error
            set({ profile: currentProfile });
            throw error;
        }
    },
});