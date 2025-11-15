import { supabase } from '../../lib/supabaseClient';
import type { StateCreator } from 'zustand';
import type { AppStore } from '../useAppStore';
import type { Project, NewProject, Task } from '../../types';

export interface ProjectSlice {
    projects: Project[];
    tasks: Task[];
    fetchProjects: () => Promise<void>;
    fetchTasks: () => Promise<void>;
    addProject: (newProject: NewProject) => Promise<void>;
    updateProject: (updatedProject: Partial<Project> & { id: string }) => Promise<void>;
    updateProjectStatus: (id: string, status: Project['status']) => Promise<void>;
    updateProjectBudget: (id: string, budgetCents: number) => Promise<void>;
    addTask: (newTask: { project_id: string; description: string }) => Promise<void>;
    updateTaskStatus: (id: string, status: Task['status']) => Promise<void>;
    deleteTask: (id: string) => Promise<void>;
}

export const createProjectSlice: StateCreator<AppStore, [], [], ProjectSlice> = (set, get) => ({
    projects: [],
    tasks: [],

    fetchProjects: async () => {
        const { data, error } = await supabase.from('projects').select('*');
        if (error) throw error;
        set({ projects: data || [] });
    },

    fetchTasks: async () => {
        const { data, error } = await supabase.from('tasks').select('*');
        if (error) throw error;
        set({ tasks: data || [] });
    },

    addProject: async (newProject) => {
        const userId = get().profile?.id;
        if (!userId) throw new Error("User not authenticated");

        const { data, error } = await supabase
            .from('projects')
            .insert({ ...newProject, user_id: userId })
            .select()
            .single();
        
        if (error) throw error;
        set(state => ({ projects: [...state.projects, data] }));
    },

    updateProject: async (updatedProject) => {
        const { data, error } = await supabase
            .from('projects')
            .update(updatedProject)
            .eq('id', updatedProject.id)
            .select()
            .single();
        
        if (error) throw error;
        set(state => ({
            projects: state.projects.map(p => p.id === data.id ? data : p)
        }));
    },

    updateProjectStatus: async (id, status) => {
        const { data, error } = await supabase
            .from('projects')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        set(state => ({
            projects: state.projects.map(p => p.id === id ? data : p)
        }));
    },

    updateProjectBudget: async (id, budget_cents) => {
        const { data, error } = await supabase
            .from('projects')
            .update({ budget_cents })
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        set(state => ({
            projects: state.projects.map(p => p.id === id ? data : p)
        }));
    },

    addTask: async (newTask) => {
        const userId = get().profile?.id;
        if (!userId) throw new Error("User not authenticated");
        
        const { data, error } = await supabase
            .from('tasks')
            .insert({ ...newTask, user_id: userId, status: 'todo' })
            .select()
            .single();

        if (error) throw error;
        set(state => ({ tasks: [...state.tasks, data] }));
    },

    updateTaskStatus: async (id, status) => {
        const { data, error } = await supabase
            .from('tasks')
            .update({ status })
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        set(state => ({
            tasks: state.tasks.map(t => t.id === id ? data : t)
        }));
    },
    
    deleteTask: async (id) => {
        const { error } = await supabase.from('tasks').delete().eq('id', id);
        if (error) throw error;
        set(state => ({
            tasks: state.tasks.filter(t => t.id !== id)
        }));
    },
});