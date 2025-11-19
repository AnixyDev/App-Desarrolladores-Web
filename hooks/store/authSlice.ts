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
    fetchInitialData: (user: User) => Promise<void>;
    updateProfile: (updatedProfile: Partial<Profile>) => Promise<void>;
    completeOnboarding: () => void;
    consumeCredits: (amount: number) => Promise<void>;
    updateStripeConnection: (accountId: string, isComplete: boolean) => Promise<void>;
}

export const createAuthSlice: StateCreator<AppStore, [], [], AuthSlice> = (set, get) => ({
    session: null,
    profile: null,
    isAuthenticated: false,
    isLoading: true, // Start loading by default

    setSession: (session) => {
        set((state) => {
            // If we are setting a session, we are authenticated.
            // If session is null, we are not.
            // isLoading should NOT be set to false here immediately if there is a session,
            // because we likely want to fetch data next.
            // However, if session is null, we are done loading (we are just logged out).
            return { 
                session, 
                isAuthenticated: !!session,
                isLoading: session ? state.isLoading : false 
            };
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
        set({ session: null, isAuthenticated: false, profile: null, isLoading: false });
    },
    
    fetchInitialData: async (user: User) => {
        // Use get() to access the store's fetchProfile method
        await get().fetchProfile(user.id);
    },

    fetchProfile: async (userId) => {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
        if (error) {
            if (error.code === 'PGRST116') {
                console.warn("Profile not found. Creating partial profile state.");
                // Optional: Create profile here if missing
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
