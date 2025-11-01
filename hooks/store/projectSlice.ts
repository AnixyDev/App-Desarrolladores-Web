import { StateCreator } from 'zustand';
import { Project, NewProject, Task, TimeEntry, NewTimeEntry } from '../../types.ts';
import { AppState } from '../useAppStore.tsx';

export interface ProjectSlice {
  projects: Project[];
  tasks: Task[];
  timeEntries: TimeEntry[];
  getProjectById: (id: string) => Project | undefined;
  addProject: (project: NewProject) => void;
  updateProjectStatus: (id: string, status: Project['status']) => void;
  getTasksByProjectId: (projectId: string) => Task[];
  addTask: (task: Omit<Task, 'id'|'user_id'|'created_at'|'completed'|'invoice_id'>) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  addTimeEntry: (entry: Omit<NewTimeEntry, 'user_id'>) => void;
}

export const createProjectSlice: StateCreator<AppState, [], [], ProjectSlice> = (set, get) => ({
    projects: [],
    tasks: [],
    timeEntries: [],
    getProjectById: (id) => get().projects.find(p => p.id === id),
    addProject: (project) => set(state => ({ projects: [...state.projects, { ...project, id: `p-${Date.now()}`, user_id: 'u-1', created_at: new Date().toISOString() }]})),
    updateProjectStatus: (id, status) => set(state => ({ projects: state.projects.map(p => p.id === id ? { ...p, status } : p) })),
    getTasksByProjectId: (projectId) => get().tasks.filter(t => t.project_id === projectId),
    addTask: (task) => set(state => ({ tasks: [...state.tasks, { ...task, id: `t-${Date.now()}`, user_id: 'u-1', created_at: new Date().toISOString(), completed: false, invoice_id: null }]})),
    toggleTask: (id) => set(state => ({ tasks: state.tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t) })),
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
