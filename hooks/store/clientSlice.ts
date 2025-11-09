import { supabase } from '../../lib/supabaseClient';
import type { StateCreator } from 'zustand';
import type { AppStore } from '../useAppStore';
import type { Client, NewClient } from '../../types';

export interface ClientSlice {
    clients: Client[];
    fetchClients: () => Promise<void>;
    addClient: (newClient: NewClient) => Promise<Client>;
    updateClient: (updatedClient: Client) => Promise<void>;
    deleteClient: (id: string) => Promise<void>;
    setClientPaymentMethodStatus: (clientId: string, status: boolean) => Promise<void>;
}

export const createClientSlice: StateCreator<AppStore, [], [], ClientSlice> = (set, get) => ({
    clients: [],

    fetchClients: async () => {
        const { data, error } = await supabase.from('clients').select('*');
        if (error) throw error;
        set({ clients: data || [] });
    },

    addClient: async (newClient) => {
        const userId = get().profile?.id;
        if (!userId) throw new Error("User not authenticated");

        const { data, error } = await supabase
            .from('clients')
            .insert({ ...newClient, user_id: userId })
            .select()
            .single();

        if (error) throw error;
        set(state => ({ clients: [...state.clients, data] }));
        return data;
    },

    updateClient: async (updatedClient) => {
        const { data, error } = await supabase
            .from('clients')
            .update(updatedClient)
            .eq('id', updatedClient.id)
            .select()
            .single();
        
        if (error) throw error;
        set(state => ({
            clients: state.clients.map(c => c.id === data.id ? data : c)
        }));
    },

    deleteClient: async (id) => {
        const { error } = await supabase.from('clients').delete().eq('id', id);
        if (error) throw error;
        set(state => ({
            clients: state.clients.filter(c => c.id !== id)
        }));
    },
    
    setClientPaymentMethodStatus: async (clientId, status) => {
        // This is a UI-driven status, might not need a DB update unless you store it.
        // Assuming it's just for the local state for now. If it needs persistence, add a Supabase call.
        set(state => ({
            clients: state.clients.map(c => c.id === clientId ? { ...c, payment_method_on_file: status } : c)
        }));
    },
});
