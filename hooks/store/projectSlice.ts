import { supabase } from '../../lib/supabaseClient';
import type { StateCreator } from 'zustand';
import type { AppStore } from '../useAppStore';
import type { Project, NewProject, Task, ProjectChangeLog } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { formatCurrency } from '../../lib/utils';

export interface ProjectSlice {
    projects: Project[];
    tasks: Task[];
    projectLogs: ProjectChangeLog[];
    isProjectsLoading: boolean;
    isTasksLoading: boolean;
    fetchProjects: () => Promise<void>;
    fetchTasks: () => Promise<void>;
    fetchProjectLogs: (projectId: string) => Promise<void>;
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
    projectLogs: [],
    isProjectsLoading: true,
    isTasksLoading: true,

    fetchProjects: async () => {
        set({ isProjectsLoading: true });
        try {
            const { data, error } = await supabase.from('projects').select('*');
            if (error) throw error;
            set({ projects: data || [] });
        } catch (error) {
            console.error("Error fetching projects:", error);
        } finally {
            set({ isProjectsLoading: false });
        }
    },

    fetchTasks: async () => {
        set({ isTasksLoading: true });
        try {
            const { data, error } = await supabase.from('tasks').select('*');
            if (error) throw error;
            set({ tasks: data || [] });
        } catch (error) {
            console.error("Error fetching tasks:", error);
        } finally {
            set({ isTasksLoading: false });
        }
    },
    
    fetchProjectLogs: async (projectId: string) => {
        const existingLogs = get().projectLogs.filter(log => log.project_id === projectId);
        
        if (existingLogs.length === 0) {
            const mockLogs: ProjectChangeLog[] = [
                {
                    id: uuidv4(),
                    project_id: projectId,
                    field: 'created',
                    old_value: '',
                    new_value: 'Proyecto creado',
                    changed_by: 'Sistema',
                    changed_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
                }
            ];
            set(state => ({ projectLogs: [...state.projectLogs, ...mockLogs] }));
        }
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
        
        const newLog: ProjectChangeLog = {
            id: uuidv4(),
            project_id: data.id,
            field: 'created',
            old_value: '',
            new_value: 'Proyecto creado',
            changed_by: get().profile?.full_name || 'Usuario',
            changed_at: new Date().toISOString()
        };
        
        set(state => ({ 
            projects: [...state.projects, data],
            projectLogs: [newLog, ...state.projectLogs]
        }));
    },

    updateProject: async (updatedProject) => {
        const currentProject = get().projects.find(p => p.id === updatedProject.id);
        if (!currentProject) return;

        const { data, error } = await supabase
            .from('projects')
            .update(updatedProject)
            .eq('id', updatedProject.id)
            .select()
            .single();
        
        if (error) throw error;
        
        const newLogs: ProjectChangeLog[] = [];
        const userName = get().profile?.full_name || 'Usuario';
        const now = new Date().toISOString();

        if (updatedProject.status && updatedProject.status !== currentProject.status) {
            newLogs.push({ id: uuidv4(), project_id: data.id, field: 'Estado', old_value: currentProject.status, new_value: updatedProject.status, changed_by: userName, changed_at: now });
        }
        if (updatedProject.budget_cents !== undefined && updatedProject.budget_cents !== currentProject.budget_cents) {
             newLogs.push({ id: uuidv4(), project_id: data.id, field: 'Presupuesto', old_value: formatCurrency(currentProject.budget_cents), new_value: formatCurrency(updatedProject.budget_cents), changed_by: userName, changed_at: now });
        }
        if (updatedProject.start_date && updatedProject.start_date !== currentProject.start_date) {
             newLogs.push({ id: uuidv4(), project_id: data.id, field: 'Fecha Inicio', old_value: currentProject.start_date, new_value: updatedProject.start_date, changed_by: userName, changed_at: now });
        }
         if (updatedProject.due_date && updatedProject.due_date !== currentProject.due_date) {
             newLogs.push({ id: uuidv4(), project_id: data.id, field: 'Fecha Entrega', old_value: currentProject.due_date, new_value: updatedProject.due_date, changed_by: userName, changed_at: now });
        }

        set(state => ({
            projects: state.projects.map(p => p.id === data.id ? data : p),
            projectLogs: [...newLogs, ...state.projectLogs]
        }));
    },

    updateProjectStatus: async (id, status) => {
        const currentProject = get().projects.find(p => p.id === id);
        if (!currentProject) return;
        const oldStatus = currentProject.status;

        const { data, error } = await supabase
            .from('projects')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        
        const newLog: ProjectChangeLog = {
            id: uuidv4(),
            project_id: id,
            field: 'Estado',
            old_value: oldStatus,
            new_value: status,
            changed_by: get().profile?.full_name || 'Usuario',
            changed_at: new Date().toISOString()
        };

        set(state => ({
            projects: state.projects.map(p => p.id === id ? data : p),
            projectLogs: [newLog, ...state.projectLogs]
        }));
    },

    updateProjectBudget: async (id, budget_cents) => {
        const currentProject = get().projects.find(p => p.id === id);
        if (!currentProject) return;
        const oldBudget = formatCurrency(currentProject.budget_cents);

        const { data, error } = await supabase
            .from('projects')
            .update({ budget_cents })
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;

        const newLog: ProjectChangeLog = {
            id: uuidv4(),
            project_id: id,
            field: 'Presupuesto',
            old_value: oldBudget,
            new_value: formatCurrency(budget_cents),
            changed_by: get().profile?.full_name || 'Usuario',
            changed_at: new Date().toISOString()
        };

        set(state => ({
            projects: state.projects.map(p => p.id === id ? data : p),
            projectLogs: [newLog, ...state.projectLogs]
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