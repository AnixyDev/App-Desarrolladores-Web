import { supabase } from '../../lib/supabaseClient';
import type { StateCreator } from 'zustand';
import type { AppStore } from '../useAppStore';
import type { UserData, Referral, KnowledgeArticle } from '../../types';

export interface TeamSlice {
    users: UserData[];
    referrals: Referral[];
    articles: KnowledgeArticle[];
    
    // Team
    fetchUsers: () => Promise<void>;
    inviteUser: (name: string, email: string, role: UserData['role']) => Promise<void>;
    deleteUser: (id: string) => Promise<void>;
    updateUserRole: (id: string, role: UserData['role']) => Promise<void>;
    updateUserStatus: (id: string, status: UserData['status']) => Promise<void>;
    updateUserHourlyRate: (id: string, rateCents: number) => Promise<void>;

    // Knowledge Base
    fetchArticles: () => Promise<void>;
    addArticle: (newArticle: Partial<KnowledgeArticle>) => Promise<void>;
    updateArticle: (updatedArticle: Partial<KnowledgeArticle>) => Promise<void>;
    deleteArticle: (id: string) => Promise<void>;
}

export const createTeamSlice: StateCreator<AppStore, [], [], TeamSlice> = (set, get) => ({
    users: [],
    referrals: [],
    articles: [],
    
    fetchUsers: async () => {
        // This assumes you have a `team_users` table that team members are inserted into
        // For simplicity, we'll assume it's public or has RLS policies.
        // In a real app, this would be scoped to the current user's team.
        const { data, error } = await supabase.from('team_users').select('*');
        if (error) throw error;
        set({ users: data || [] });
    },

    inviteUser: async (name, email, role) => {
        // In a real app, this would likely add to a team_invites table.
        // Here, we'll simulate by adding directly to a team_users table.
        const userId = get().profile?.id;
        if (!userId) throw new Error("User not authenticated");
        
        const newUser: Omit<UserData, 'id' | 'invitedOn'> = { name, email, role, status: 'Pendiente', hourly_rate_cents: 0 };
        
        const { data, error } = await supabase.from('team_users').insert({ ...newUser, invited_by: userId }).select().single();
        if (error) throw error;

        set(state => ({ users: [...state.users, data] }));
    },
    deleteUser: async (id) => {
        const { error } = await supabase.from('team_users').delete().eq('id', id);
        if (error) throw error;
        set(state => ({ users: state.users.filter(u => u.id !== id) }));
    },
    updateUserRole: async (id, role) => {
        const { data, error } = await supabase.from('team_users').update({ role }).eq('id', id).select().single();
        if (error) throw error;
        set(state => ({ users: state.users.map(u => u.id === id ? data : u) }));
    },
    updateUserStatus: async (id, status) => {
        const { data, error } = await supabase.from('team_users').update({ status }).eq('id', id).select().single();
        if (error) throw error;
        set(state => ({ users: state.users.map(u => u.id === id ? data : u) }));
    },
    updateUserHourlyRate: async (id, hourly_rate_cents) => {
        const { data, error } = await supabase.from('team_users').update({ hourly_rate_cents }).eq('id', id).select().single();
        if (error) throw error;
        set(state => ({ users: state.users.map(u => u.id === id ? data : u) }));
    },

    // Knowledge Base
    fetchArticles: async () => {
        const { data, error } = await supabase.from('knowledge_articles').select('*');
        if (error) throw error;
        set({ articles: data || [] });
    },
    addArticle: async (newArticle) => {
        const userId = get().profile?.id;
        if (!userId) throw new Error("User not authenticated");

        const { data, error } = await supabase.from('knowledge_articles').insert({ ...newArticle, user_id: userId }).select().single();
        if (error) throw error;
        set(state => ({ articles: [...state.articles, data] }));
    },
    updateArticle: async (updatedArticle) => {
        const { data, error } = await supabase.from('knowledge_articles').update(updatedArticle).eq('id', updatedArticle.id).select().single();
        if (error) throw error;
        set(state => ({ articles: state.articles.map(a => a.id === updatedArticle.id ? data : a) }));
    },
    deleteArticle: async (id) => {
        const { error } = await supabase.from('knowledge_articles').delete().eq('id', id);
        if (error) throw error;
        set(state => ({ articles: state.articles.filter(a => a.id !== id) }));
    },
});