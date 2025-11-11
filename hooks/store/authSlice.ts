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
            },
        });
        if (error) throw error;
    },

    loginWithGithub: async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'github',
            options: { redirectTo: window.location.origin },
        });
        if (error) throw error;
    },

    register: async (name, email, password) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: name } }
        });
        if (error) throw error;
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
            // It's possible for the profile to not exist yet for a new user
            if (error.code === 'PGRST116') {
                console.warn("Profile not found for new user, this is expected.");
                set({ profile: null });
                return;
            }
            throw error;
        }
        set({ profile: data });
    },

    updateProfile: async (updatedProfile) => {
        const userId = get().session?.user?.id;
        if (!userId) throw new Error("User not found");

        const { data, error } = await supabase
            .from('profiles')
            .update(updatedProfile)
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;
        set({ profile: data });
    },

    completeOnboarding: () => {
        get().updateProfile({ isNewUser: false });
    },

    consumeCredits: async (amount) => {
        const { profile } = get();
        if (profile) {
            const newCredits = Math.max(0, profile.ai_credits - amount);
            await get().updateProfile({ ai_credits: newCredits });
        }
    },

    updateStripeConnection: async (accountId, isComplete) => {
        await get().updateProfile({ 
            stripe_account_id: accountId,
            stripe_onboarding_complete: isComplete 
        });
    },
});