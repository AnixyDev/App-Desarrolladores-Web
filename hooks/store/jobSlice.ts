// hooks/store/jobSlice.ts
import { StateCreator } from 'zustand';
import { Job, JobApplication } from '../../types';
import { AppState } from '../useAppStore';

export interface JobSlice {
  jobs: Job[];
  applications: JobApplication[];
  savedJobIds: string[];
  notifiedJobIds: string[];
  getJobById: (id: string) => Job | undefined;
  getApplicationsByUserId: (userId: string) => JobApplication[];
  getApplicationsByJobId: (jobId: string) => JobApplication[];
  getSavedJobs: () => Job[];
  addJob: (job: Omit<Job, 'id'>) => void;
  applyForJob: (jobId: string, userId: string, proposalText: string) => void;
  viewApplication: (applicationId: string) => void;
  saveJob: (jobId: string) => void;
  markJobAsNotified: (jobId: string) => void;
}

export const createJobSlice: StateCreator<AppState, [], [], JobSlice> = (set, get) => ({
    jobs: [],
    applications: [],
    savedJobIds: [],
    notifiedJobIds: [],
    getJobById: (id) => get().jobs.find(j => j.id === id),
    getApplicationsByUserId: (userId) => get().applications.filter(app => app.userId === userId),
    getApplicationsByJobId: (jobId) => get().applications.filter(app => app.jobId === jobId),
    getSavedJobs: () => {
        const { jobs, savedJobIds } = get();
        return jobs.filter(job => savedJobIds.includes(job.id));
    },
    addJob: (job) => {
        const newJob: Job = {
            ...job,
            id: `job-${Date.now()}`,
        };
        set(state => ({ jobs: [newJob, ...state.jobs] }));
    },
    applyForJob: (jobId, userId, proposalText) => {
        const job = get().getJobById(jobId);
        const profile = get().profile;

        if (!job || !profile) return;

        const newApplication: JobApplication = {
            id: `app-${Date.now()}`,
            jobId,
            userId,
            applicantName: profile.full_name,
            jobTitle: job.titulo,
            proposalText,
            status: 'sent',
            appliedAt: new Date().toISOString(),
        };
        set(state => ({ applications: [newApplication, ...state.applications] }));
        
        const { addNotification } = get();
        // Simulación: Notificamos al usuario actual como si fuera el publicador de la oferta.
        // En una app multi-usuario, esta notificación se enviaría al `job.postedByUserId`.
        const message = `¡Nuevo candidato para tu oferta "${job.titulo}"!`;
        const link = `/my-job-posts/${job.id}/applicants`;
        addNotification(message, link);
    },
    viewApplication: (applicationId: string) => {
        set(state => ({
            applications: state.applications.map(app => 
                app.id === applicationId && app.status === 'sent' 
                ? { ...app, status: 'viewed' } 
                : app
            )
        }));
    },
    saveJob: (jobId) => {
        const { savedJobIds } = get();
        if (savedJobIds.includes(jobId)) {
            set({ savedJobIds: savedJobIds.filter(id => id !== jobId) });
        } else {
            set({ savedJobIds: [...savedJobIds, jobId] });
        }
    },
    markJobAsNotified: (jobId) => {
        set(state => ({
            notifiedJobIds: [...new Set([...state.notifiedJobIds, jobId])]
        }));
    }
});