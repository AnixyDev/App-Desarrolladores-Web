import { supabase } from '../../lib/supabaseClient';
import type { StateCreator } from 'zustand';
import type { AppStore } from '../useAppStore';
import { Notification, ProjectMessage, ProjectFile, PortalComment, PortalFile } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export interface CollaborationSlice {
    notifications: Notification[];
    projectComments: ProjectMessage[];
    projectFiles: ProjectFile[];
    portalComments: PortalComment[];
    portalFiles: PortalFile[];
    notifiedJobIds: string[];

    // Notifications
    addNotification: (message: string, link: string) => void;
    markAllAsRead: () => void;
    markJobAsNotified: (jobId: string) => void;
    
    // Project Collaboration
    fetchProjectComments: () => Promise<void>;
    fetchProjectFiles: () => Promise<void>;
    addProjectComment: (comment: Omit<ProjectMessage, 'id' | 'timestamp'>) => Promise<string | undefined>;
    addProjectFile: (file: Omit<ProjectFile, 'id' | 'uploadedAt'>) => Promise<void>;
    deleteProjectFile: (id: string) => Promise<void>;

    // Portal Collaboration
    fetchPortalComments: () => Promise<void>;
    fetchPortalFiles: () => Promise<void>;
    addPortalComment: (comment: Omit<PortalComment, 'id' | 'timestamp'>) => Promise<void>;
    addPortalFile: (file: Omit<PortalFile, 'id' | 'uploadedAt'>) => Promise<void>;
    deletePortalFile: (id: string) => Promise<void>;
}

export const createCollaborationSlice: StateCreator<AppStore, [], [], CollaborationSlice> = (set, get) => ({
    notifications: [],
    projectComments: [],
    projectFiles: [],
    portalComments: [],
    portalFiles: [],
    notifiedJobIds: [],

    addNotification: (message, link) => {
        const newNotification: Notification = { id: uuidv4(), message, link, isRead: false, createdAt: new Date().toISOString() };
        set(state => ({ notifications: [newNotification, ...state.notifications] }));
    },
    markAllAsRead: () => {
        set(state => ({ notifications: state.notifications.map(n => ({ ...n, isRead: true })) }));
    },
     markJobAsNotified: (jobId) => {
        set(state => ({ notifiedJobIds: [...state.notifiedJobIds, jobId] }));
    },

    fetchProjectComments: async () => {
        const { data, error } = await supabase.from('project_comments').select('*');
        if (error) throw error;
        set({ projectComments: data || [] });
    },
    fetchProjectFiles: async () => {
        const { data, error } = await supabase.from('project_files').select('*');
        if (error) throw error;
        set({ projectFiles: data || [] });
    },
    addProjectComment: async (comment) => {
        const { data, error } = await supabase.from('project_comments').insert(comment).select().single();
        if (error) throw error;
        set(state => ({ projectComments: [...state.projectComments, data] }));

        if (get().profile?.email_notifications.on_new_project_message) {
            return `Simulación: Se enviaría un email notificando sobre este nuevo mensaje.`;
        }
    },
    addProjectFile: async (file) => {
        const { data, error } = await supabase.from('project_files').insert(file).select().single();
        if (error) throw error;
        set(state => ({ projectFiles: [...state.projectFiles, data] }));
    },
    deleteProjectFile: async (id) => {
        const { error } = await supabase.from('project_files').delete().eq('id', id);
        if (error) throw error;
        set(state => ({ projectFiles: state.projectFiles.filter(f => f.id !== id) }));
    },
    
    fetchPortalComments: async () => {
        const { data, error } = await supabase.from('portal_comments').select('*');
        if (error) throw error;
        set({ portalComments: data || [] });
    },
    fetchPortalFiles: async () => {
        const { data, error } = await supabase.from('portal_files').select('*');
        if (error) throw error;
        set({ portalFiles: data || [] });
    },
    addPortalComment: async (comment) => {
        const { data, error } = await supabase.from('portal_comments').insert(comment).select().single();
        if (error) throw error;
        set(state => ({ portalComments: [...state.portalComments, data] }));
    },
    addPortalFile: async (file) => {
        const { data, error } = await supabase.from('portal_files').insert(file).select().single();
        if (error) throw error;
        set(state => ({ portalFiles: [...state.portalFiles, data] }));
    },
    deletePortalFile: async (id) => {
        const { error } = await supabase.from('portal_files').delete().eq('id', id);
        if (error) throw error;
        set(state => ({ portalFiles: state.portalFiles.filter(f => f.id !== id) }));
    },
});