
import { StateCreator } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { AppState } from '../useAppStore';
import { Profile, GoogleJwtPayload, UserData } from '../../types';
import { supabase } from '../../lib/supabaseClient';

// Perfil de ejemplo para el usuario inicial (Mock/Fallback)
const initialProfile: Profile = {
    id: 'u-1',
    full_name: 'Carlos Santana',
    email: 'carlos@santana.com',
    business_name: 'Santana Development',
    tax_id: 'B12345678',
    avatar_url: 'https://i.pravatar.cc/150?u=carlossantana',
    plan: 'Pro',
    ai_credits: 150,
    hourly_rate_cents: 6500,
    pdf_color: '#d9009f',
    bio: 'Desarrollador Full-Stack con 8 años de experiencia especializado en React, Node.js y arquitecturas serverless. Apasionado por crear productos escalables y de alta calidad.',
    skills: ['React', 'TypeScript', 'Node.js', 'Next.js', 'AWS', 'Serverless'],
    portfolio_url: 'https://github.com/carlossantana-dev',
    payment_reminders_enabled: true,
    reminder_template_upcoming: 'Hola [ClientName],\n\nEste es un recordatorio amigable de que la factura #[InvoiceNumber] por un importe de [Amount] vence el [DueDate].\n\nSaludos,\n[YourName]',
    reminder_template_overdue: 'Hola [ClientName],\n\nEste es un recordatorio de que la factura #[InvoiceNumber] por un importe de [Amount] venció el [DueDate] y sigue pendiente de pago.\n\nPor favor, realiza el pago lo antes posible.\n\nSaludos,\n[YourName]',
    affiliate_code: 'SANTANA20',
    // Campos para Stripe Connect
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
                // Fetch user profile from DB
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();
                
                const mergedProfile = { 
                    ...initialProfile, 
                    ...profileData, 
                    id: session.user.id, 
                    email: session.user.email || '' 
                };
                
                set({ isAuthenticated: true, profile: mergedProfile as Profile });
            }
        } catch (error) {
            console.error("Error initializing auth:", error);
        }
    },

    login: async (email, password) => {
        try {
            // 1. Try Supabase Auth
            if (password) {
                const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                if (!error && data.user) {
                    const { data: profileData } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', data.user.id)
                        .single();

                    const mergedProfile = { 
                        ...initialProfile, 
                        ...profileData, 
                        id: data.user.id, 
                        email: data.user.email || email 
                    };
                    
                    set({ isAuthenticated: true, profile: mergedProfile as Profile });
                    return true;
                }
            }
        } catch (error) {
            console.warn("Supabase login failed, trying mock fallback...", error);
        }

        // 2. Fallback to Mock Data (Demo Mode)
        const userProfile = get().profile;
        if (userProfile && email.toLowerCase() === userProfile.email.toLowerCase()) {
            set({ isAuthenticated: true });
            return true;
        }
        return false;
    },

    logout: async () => {
        try {
            await supabase.auth.signOut();
        } catch (e) {
            console.error("Error signing out from Supabase", e);
        }
        set({ isAuthenticated: false });
    },

    register: async (name, email, password) => {
        try {
            // 1. Try Supabase Registration
            if (password) {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { full_name: name }
                    }
                });

                if (!error && data.user) {
                    // Profile creation is usually handled by a Supabase Trigger, 
                    // but we can set local state optimistically.
                    const newProfile: Profile = {
                        ...initialProfile,
                        id: data.user.id,
                        full_name: name,
                        email: email,
                    };
                    set({ profile: newProfile, isAuthenticated: true });
                    return true;
                }
            }
        } catch (error) {
            console.warn("Supabase registration failed, trying mock fallback...", error);
        }

        // 2. Fallback Mock Registration
        const newProfile: Profile = {
            ...initialProfile,
            id: `u-${Date.now()}`,
            full_name: name,
            email: email,
        };
        set({ profile: newProfile, isAuthenticated: true });
        
        const mainUser: UserData = {
            id: newProfile.id,
            name: newProfile.full_name,
            email: newProfile.email,
            role: 'Admin',
            status: 'Activo',
            hourly_rate_cents: newProfile.hourly_rate_cents,
        };
        set(state => ({ users: [mainUser, ...state.users.filter(u => u.id !== mainUser.id)] }));
        return true;
    },

    loginWithGoogle: (decoded) => {
        // NOTE: For real Google Auth with Supabase, you would use supabase.auth.signInWithOAuth()
        // This method handles the client-side Google Button response (Mock/Hybrid).
        const existingProfile = get().profile;
        const newProfileData = {
            full_name: decoded.name,
            email: decoded.email,
            avatar_url: decoded.picture,
        };
        const updatedProfile = { ...existingProfile, ...newProfileData } as Profile;
        set({ profile: updatedProfile, isAuthenticated: true });
        
         const mainUser: UserData = {
            id: updatedProfile.id,
            name: decoded.name,
            email: decoded.email,
            role: 'Admin',
            status: 'Activo',
            hourly_rate_cents: updatedProfile.hourly_rate_cents,
        };
        set(state => ({ users: [mainUser, ...state.users.filter(u => u.id !== mainUser.id)] }));
    },

    updateProfile: (profileData) => {
        set(state => ({ profile: { ...state.profile, ...profileData } as Profile }));
        // Sync with Supabase if authenticated
        const { isAuthenticated, profile } = get();
        if (isAuthenticated && profile.id && !profile.id.startsWith('u-')) { // Check if it's a real ID
             supabase.from('profiles').update(profileData).eq('id', profile.id).then(({ error }) => {
                 if (error) console.error("Error syncing profile update to Supabase:", error);
             });
        }
    },
    upgradePlan: (plan) => {
        set(state => ({ profile: { ...state.profile, plan } as Profile }));
    },
    purchaseCredits: (amount) => {
        set(state => ({ profile: { ...state.profile, ai_credits: state.profile.ai_credits + amount } as Profile }));
    },
    consumeCredits: (amount) => {
        const currentCredits = get().profile.ai_credits;
        if (currentCredits >= amount) {
            const newCredits = currentCredits - amount;
            set(state => ({ profile: { ...state.profile, ai_credits: newCredits } as Profile }));
            
            // Sync with Supabase
            const { isAuthenticated, profile } = get();
            if (isAuthenticated && profile.id && !profile.id.startsWith('u-')) {
                supabase.rpc('increment_credits', { user_id: profile.id, amount: -amount });
            }
            return true;
        }
        return false;
    },
    updateStripeConnection: (accountId, onboardingComplete) => {
        set(state => ({
            profile: {
                ...state.profile,
                stripe_account_id: accountId,
                stripe_onboarding_complete: onboardingComplete,
            } as Profile
        }));
    },
});
