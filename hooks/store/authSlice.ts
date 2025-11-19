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
    isLoading: true, // Default to true to prevent flicker on refresh

    setSession: (session) => {
        // When setting a session, we only stop loading if the session is null (not logged in).
        // If logged in, loading stops after fetchInitialData completes in App.tsx
        set({ 
            session, 
            isAuthenticated: !!session,
            // If no session, we are done loading (user needs to login).
            // If session exists, we keep loading until data is fetched (handled in App.tsx).
            isLoading: session ? true : false 
        });
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
        const { error } = await supabase.auth.signUp({
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
    },

    logout: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        set({ session: null, isAuthenticated: false, profile: null });
    },
    
    fetchInitialData: async (user: User) => {
        await get().fetchProfile(user.id);
    },

    fetchProfile: async (userId) => {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
        if (error) {
            if (error.code === 'PGRST116') {
                console.warn("Profile not found. Creating partial profile state.");
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
            set({ profile: currentProfile });
            throw error;
        }
    },
});