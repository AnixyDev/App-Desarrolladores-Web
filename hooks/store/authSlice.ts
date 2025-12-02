
import { StateCreator } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { AppState } from '../useAppStore';
import { Profile, GoogleJwtPayload, UserData } from '../../types';

// Perfil de ejemplo para el usuario inicial
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
  login: (email: string, password?: string) => boolean;
  logout: () => void;
  register: (name: string, email: string, password?: string) => boolean;
  loginWithGoogle: (decoded: GoogleJwtPayload) => void;
  updateProfile: (profileData: Partial<Profile>) => void;
  upgradePlan: (plan: 'Pro' | 'Teams') => void;
  purchaseCredits: (amount: number) => void;
  consumeCredits: (amount: number) => boolean;
  updateStripeConnection: (accountId: string, onboardingComplete: boolean) => void;
}

export const createAuthSlice: StateCreator<AppState, [], [], AuthSlice> = (set, get) => ({
    isAuthenticated: false,
    profile: initialProfile,
    login: (email, password) => {
        const userProfile = get().profile;
        // Lógica simplificada para datos de demostración
        if (userProfile && email.toLowerCase() === userProfile.email.toLowerCase()) {
            set({ isAuthenticated: true });
            return true;
        }
        return false;
    },
    logout: () => {
        set({ isAuthenticated: false });
    },
    register: (name, email, password) => {
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
        // Añade al usuario principal a la lista de usuarios del equipo
        set(state => ({ users: [mainUser, ...state.users.filter(u => u.id !== mainUser.id)] }));
        return true;
    },
    loginWithGoogle: (decoded) => {
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
        // Actualiza el usuario principal en la lista de usuarios del equipo
        set(state => ({ users: [mainUser, ...state.users.filter(u => u.id !== mainUser.id)] }));
    },
    updateProfile: (profileData) => {
        set(state => ({ profile: { ...state.profile, ...profileData } as Profile }));
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
            set(state => ({ profile: { ...state.profile, ai_credits: currentCredits - amount } as Profile }));
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
