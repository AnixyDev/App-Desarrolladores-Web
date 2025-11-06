import { StateCreator } from 'zustand';
import { Project, NewProject, Task, TimeEntry, NewTimeEntry } from '../../types';
import { AppState } from '../useAppStore';

export interface ProjectSlice {
  projects: Project[];
  tasks: Task[];
  timeEntries: TimeEntry[];
  getProjectById: (id: string) => Project | undefined;
  getProjectByName: (name: string) => Project | undefined;
  addProject: (project: NewProject) => void;
  updateProjectStatus: (id: string, status: Project['status']) => void;
  updateProjectBudget: (id: string, budgetCents: number) => void;
  getTasksByProjectId: (projectId: string) => Task[];
  addTask: (task: Omit<Task, 'id'|'user_id'|'created_at'|'status'|'invoice_id'>) => void;
  updateTaskStatus: (id: string, status: Task['status']) => void;
  deleteTask: (id: string) => void;
  addTimeEntry: (entry: Omit<NewTimeEntry, 'user_id'>) => void;
}

export const createProjectSlice: StateCreator<AppState, [], [], ProjectSlice> = (set, get) => ({
    projects: [],
    tasks: [],
    timeEntries: [],
    getProjectById: (id) => get().projects.find(p => p.id === id),
    getProjectByName: (name) => get().projects.find(p => p.name.toLowerCase() === name.toLowerCase()),
    addProject: (project) => set(state => ({ projects: [...state.projects, { ...project, id: `p-${Date.now()}`, user_id: 'u-1', created_at: new Date().toISOString() }]})),
    updateProjectStatus: (id, status) => {
        const project = get().projects.find(p => p.id === id);
        if(project) {
            const statusMap = {
                'planning': 'Planificación',
                'in-progress': 'En Progreso',
                'completed': 'Completado',
                'on-hold': 'En Pausa'
            };
            get().addNotification(
                `El estado del proyecto "${project.name}" ha cambiado a "${statusMap[status]}".`,
                `/projects/${id}`
            );
        }
        set(state => ({ projects: state.projects.map(p => p.id === id ? { ...p, status } : p) }));
    },
    updateProjectBudget: (id, budgetCents) => {
        set(state => ({
            projects: state.projects.map(p =>
                p.id === id ? { ...p, budget_cents: budgetCents } : p
            )
        }));
    },
    getTasksByProjectId: (projectId) => get().tasks.filter(t => t.project_id === projectId),
    addTask: (task) => set(state => ({ tasks: [...state.tasks, { ...task, id: `t-${Date.now()}`, user_id: 'u-1', created_at: new Date().toISOString(), status: 'todo', invoice_id: null }]})),
    updateTaskStatus: (id, status) => set(state => ({ tasks: state.tasks.map(t => t.id === id ? { ...t, status } : t) })),
    deleteTask: (id) => set(state => ({ tasks: state.tasks.filter(t => t.id !== id) })),
    addTimeEntry: (entry) => {
        const newEntry: TimeEntry = {
            ...entry,
            id: `te-${Date.now()}`,
            user_id: 'u-1',
            created_at: new Date().toISOString(),
        };
        set(state => ({ timeEntries: [newEntry, ...state.timeEntries].sort((a,b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()) }));
    },
});