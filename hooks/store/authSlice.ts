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
    reauthenticate: () => Promise<void>;
    fetchProfile: (userId: string) => Promise<void>;
    fetchInitialData: (user: User) => Promise<void>; // This will be composed in the main store
    updateProfile: (updatedProfile: Partial<Profile>) => Promise<void>;
    completeOnboarding: () => void;
    consumeCredits: (amount: number) => Promise<void>;
}

export const createAuthSlice: StateCreator<AppStore, [], [], AuthSlice> = (set, get) => ({
    session: null,
    profile: null,
    isAuthenticated: false,
    isLoading: true,

    setSession: (session) => set({ session, isAuthenticated: !!session }),

    login: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
    },

    loginWithGoogle: async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { 
                redirectTo: window.location.origin,
                queryParams: {
                    client_id: '1234567890-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com'
                }
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
        await supabase.auth.signOut();
        // Resetting the entire store state might be too aggressive if you want to keep some settings.
        // For now, just resetting auth state. The main store initial state will handle the rest.
        set({ session: null, profile: null, isAuthenticated: false, isLoading: false, clients: [], projects: [] /* etc */ });
    },
    
    reauthenticate: async () => {
        set({ isLoading: true });
        const { data: { session } } = await supabase.auth.getSession();
        set({ session, isAuthenticated: !!session });
        if (session?.user) {
            await get().fetchInitialData(session.user);
        }
        set({ isLoading: false });
    },
    
    // To be composed/overridden in the main store
    fetchInitialData: async (user: User) => {
        // This is a placeholder. The main store will implement the full data fetching logic.
        await get().fetchProfile(user.id);
    },

    fetchProfile: async (userId) => {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
        if (error) throw error;
        set({ profile: data });
    },

    updateProfile: async (updatedProfile) => {
        const userId = get().profile?.id;
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
});