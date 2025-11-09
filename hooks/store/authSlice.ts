import { StateCreator } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { AppState } from '../useAppStore';
import { Profile, GoogleJwtPayload, UserData, Referral } from '../../types';

// Perfil de ejemplo para el usuario inicial de demostración
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
    isNewUser: false,
    bio: 'Desarrollador Full-Stack con 8 años de experiencia especializado en React, Node.js y arquitecturas serverless. Apasionado por crear productos escalables y de alta calidad.',
    skills: ['React', 'TypeScript', 'Node.js', 'Next.js', 'AWS', 'Serverless'],
    portfolio_url: 'https://github.com/carlossantana-dev',
    specialty: 'Desarrollo Full-Stack con React y Node.js',
    availability_hours: 40,
    preferred_hourly_rate_cents: 7000,
    payment_reminders_enabled: true,
    reminder_template_upcoming: 'Hola [ClientName],\n\nEste es un recordatorio amigable de que la factura #[InvoiceNumber] por un importe de [Amount] vence el [DueDate].\n\nSaludos,\n[YourName]',
    reminder_template_overdue: 'Hola [ClientName],\n\nEste es un recordatorio de que la factura #[InvoiceNumber] por un importe de [Amount] venció el [DueDate] y sigue pendiente de pago.\n\nPor favor, realiza el pago lo antes posible.\n\nSaludos,\n[YourName]',
    email_notifications: {
        on_invoice_overdue: true,
        on_proposal_status_change: true,
        on_contract_signed: true,
        on_new_project_message: false,
    },
    affiliate_code: 'SANTANA20',
    stripe_account_id: '',
    stripe_onboarding_complete: false,
};

// Helper to create a clean profile for a new user
const createNewProfile = (name: string, email: string, avatar?: string): Profile => ({
    id: `u-${uuidv4()}`,
    full_name: name,
    email: email,
    business_name: name,
    tax_id: '',
    avatar_url: avatar || '',
    plan: 'Free',
    ai_credits: 10,
    hourly_rate_cents: 5000,
    pdf_color: '#d9009f',
    isNewUser: true,
    bio: '',
    skills: [],
    portfolio_url: '',
    specialty: '',
    availability_hours: 0,
    preferred_hourly_rate_cents: 0,
    payment_reminders_enabled: false,
    reminder_template_upcoming: 'Hola [ClientName],\n\nEste es un recordatorio amigable de que la factura #[InvoiceNumber] por un importe de [Amount] vence el [DueDate].\n\nSaludos,\n[YourName]',
    reminder_template_overdue: 'Hola [ClientName],\n\nEste es un recordatorio de que la factura #[InvoiceNumber] por un importe de [Amount] venció el [DueDate] y sigue pendiente de pago.\n\nPor favor, realiza el pago lo antes posible.\n\nSaludos,\n[YourName]',
    email_notifications: {
        on_invoice_overdue: true,
        on_proposal_status_change: true,
        on_contract_signed: true,
        on_new_project_message: false,
    },
    affiliate_code: uuidv4().substring(0, 8).toUpperCase(),
    stripe_account_id: '',
    stripe_onboarding_complete: false,
});


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
  completeOnboarding: () => void;
}

const handleReferralRegistration = (get: () => AppState, set: (partial: Partial<AppState>) => void, newProfile: Profile) => {
    const refCode = sessionStorage.getItem('affiliate_ref_code');
    if (refCode) {
        // En una app real, buscaríamos en la base de datos. Aquí, buscamos en el estado.
        // Como solo hay un usuario, simulamos que el referidor es el usuario inicial de la demo.
        const referrer = get().users.find(u => u.id === 'u-1' && get().profile.affiliate_code === refCode);
        if (referrer && referrer.id !== newProfile.id) {
            const newReferral: Referral = {
                id: `ref-${uuidv4()}`,
                referrer_id: referrer.id,
                referred_user_id: newProfile.id,
                referred_user_name: newProfile.full_name,
                join_date: new Date().toISOString().slice(0, 10),
                status: 'Registered',
                commission_cents: 0,
            };
            set({ referrals: [...get().referrals, newReferral] });
            sessionStorage.removeItem('affiliate_ref_code');
        }
    }
};

export const createAuthSlice: StateCreator<AppState, [], [], AuthSlice> = (set, get) => ({
    isAuthenticated: false,
    profile: initialProfile,
    login: (email, password) => {
        // In a real app, you'd check against a list of users.
        // For this mock, we assume login is only possible for the registered/current user.
        const userProfile = get().profile;
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
        const newProfile = createNewProfile(name, email);
        const mainUser: UserData = {
            id: newProfile.id,
            name: newProfile.full_name,
            email: newProfile.email,
            role: 'Admin',
            status: 'Activo',
            hourly_rate_cents: newProfile.hourly_rate_cents,
        };
        // Set the new profile as the current one and log in
        set({ profile: newProfile, isAuthenticated: true, users: [mainUser] });
        handleReferralRegistration(get, set, newProfile);
        return true;
    },
    loginWithGoogle: (decoded) => {
        // This logic simulates finding an existing user or creating a new one.
        // For this mock, we'll just create a new profile.
        const newProfile = createNewProfile(decoded.name, decoded.email, decoded.picture);
        const mainUser: UserData = {
            id: newProfile.id,
            name: newProfile.full_name,
            email: newProfile.email,
            role: 'Admin',
            status: 'Activo',
            hourly_rate_cents: newProfile.hourly_rate_cents,
        };
        set({ profile: newProfile, isAuthenticated: true, users: [mainUser] });
        handleReferralRegistration(get, set, newProfile);
    },
    updateProfile: (profileData) => {
        set(state => ({ profile: { ...state.profile, ...profileData } as Profile }));
    },
    upgradePlan: (plan) => {
        const currentProfile = get().profile;
        set(state => ({ profile: { ...state.profile, plan } as Profile }));

        // Affiliate logic
        const referralRecord = get().referrals.find(r => r.referred_user_id === currentProfile.id && r.status === 'Registered');
        if (referralRecord) {
            const planPrices = { Pro: 395, Teams: 3595 }; // Prices in cents
            const price = plan === 'Pro' ? planPrices.Pro : planPrices.Teams;
            const commission = Math.round(price * 0.20); // 20% commission

            set(state => ({
                referrals: state.referrals.map(r => 
                    r.id === referralRecord.id 
                    ? { ...r, status: 'Subscribed', commission_cents: r.commission_cents + commission } 
                    : r
                )
            }));
        }
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
    completeOnboarding: () => {
        set(state => ({
            profile: { ...state.profile, isNewUser: false } as Profile
        }));
    }
});