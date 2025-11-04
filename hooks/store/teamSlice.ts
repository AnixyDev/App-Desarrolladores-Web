import { StateCreator } from 'zustand';
import { UserData, Referral } from '../../types.ts';
import { AppState } from '../useAppStore.tsx';

export interface TeamSlice {
  users: UserData[];
  referrals: Referral[];
  inviteUser: (name: string, email: string, role: UserData['role']) => void;
  updateUserRole: (id: string, role: UserData['role']) => void;
  updateUserStatus: (id: string, status: UserData['status']) => void;
  deleteUser: (id: string) => void;
}

export const createTeamSlice: StateCreator<AppState, [], [], TeamSlice> = (set) => ({
    users: [],
    referrals: [],
    inviteUser: (name, email, role) => {
        const newUser: UserData = {
            id: `u-${Date.now()}`,
            name,
            email,
            role,
            status: 'Pendiente',
            invitedOn: new Date().toISOString().slice(0, 10),
        };
        set(state => ({ users: [...state.users, newUser] }));
    },
    updateUserRole: (id, role) => set(state => ({ users: state.users.map(u => u.id === id ? { ...u, role } : u) })),
    updateUserStatus: (id, status) => set(state => ({ users: state.users.map(u => u.id === id ? { ...u, status } : u) })),
    deleteUser: (id) => set(state => ({ users: state.users.filter(u => u.id !== id) })),
});