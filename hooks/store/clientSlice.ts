import { StateCreator } from 'zustand';
import { Client, NewClient } from '../../types';
import { AppState } from '../useAppStore';

export interface ClientSlice {
  clients: Client[];
  getClientById: (id: string) => Client | undefined;
  getClientByName: (name: string) => Client | undefined;
  addClient: (client: NewClient) => Client;
  updateClient: (client: Client) => void;
  deleteClient: (id: string) => void;
  setClientPaymentMethodStatus: (clientId: string, hasMethod: boolean) => void;
}

export const createClientSlice: StateCreator<AppState, [], [], ClientSlice> = (set, get) => ({
    clients: [], // Will be initialized by spreading MOCK_DATA
    getClientById: (id) => get().clients.find(c => c.id === id),
    getClientByName: (name) => get().clients.find(c => c.name.toLowerCase() === name.toLowerCase()),
    addClient: (client) => {
        const newClient: Client = { ...client, id: `c-${Date.now()}`, user_id: 'u-1', created_at: new Date().toISOString() };
        set(state => ({ clients: [...state.clients, newClient]}));
        return newClient;
    },
    updateClient: (client) => set(state => ({ clients: state.clients.map(c => c.id === client.id ? client : c) })),
    deleteClient: (id) => set(state => ({
        clients: state.clients.filter(c => c.id !== id),
        projects: state.projects.filter(p => p.client_id !== id),
        invoices: state.invoices.filter(i => i.client_id !== id),
    })),
    setClientPaymentMethodStatus: (clientId, hasMethod) => {
        set(state => ({
            clients: state.clients.map(c => c.id === clientId ? { ...c, payment_method_on_file: hasMethod } : c)
        }));
    }
});