import { supabase } from '../../lib/supabaseClient';
import type { StateCreator } from 'zustand';
import type { AppStore } from '../useAppStore';
import { Job, JobApplication } from '../../types';

export interface JobSlice {
    jobs: Job[];
    applications: JobApplication[];
    savedJobIds: string[];

    // Marketplace
    fetchJobs: () => Promise<void>;
    fetchApplications: () => Promise<void>;
    addJob: (newJob: Partial<Job>) => Promise<void>;
    saveJob: (jobId: string) => void;
    applyForJob: (jobId: string, userId: string, proposalText: string) => Promise<void>;
    viewApplication: (appId: string) => Promise<void>;
}

export const createJobSlice: StateCreator<AppStore, [], [], JobSlice> = (set, get) => ({
    jobs: [],
    applications: [],
    savedJobIds: [],

    fetchJobs: async () => {
        const { data, error } = await supabase.from('jobs').select('*');
        if (error) throw error;
        set({ jobs: data || [] });
    },

    fetchApplications: async () => {
        const { data, error } = await supabase.from('job_applications').select('*');
        if (error) throw error;
        set({ applications: data || [] });
    },

    addJob: async (newJob) => {
        const userId = get().profile?.id;
        if (!userId) throw new Error("User not authenticated");

        const jobToInsert = { ...newJob, postedByUserId: userId };

        const { data, error } = await supabase.from('jobs').insert(jobToInsert).select().single();
        if (error) throw error;
        set(state => ({ jobs: [...state.jobs, data] }));
    },

    saveJob: (jobId) => {
        // This remains a client-side preference, persisted via zustand/persist middleware
        set(state => ({
            savedJobIds: state.savedJobIds.includes(jobId)
                ? state.savedJobIds.filter(id => id !== jobId)
                : [...state.savedJobIds, jobId],
        }));
    },
    
    applyForJob: async (jobId, userId, proposalText) => {
        const job = get().jobs.find(j => j.id === jobId);
        if (job) {
            const newApplication: Omit<JobApplication, 'id' | 'appliedAt'> = {
                jobId,
                userId,
                applicantName: get().profile!.full_name,
                jobTitle: job.titulo,
                proposalText,
                status: 'sent',
            };
            const { data, error } = await supabase.from('job_applications').insert(newApplication).select().single();
            if (error) throw error;
            set(state => ({ applications: [...state.applications, data] }));
        }
    },

    viewApplication: async (appId) => {
        const application = get().applications.find(a => a.id === appId);
        if (application && application.status === 'sent') {
            const { data, error } = await supabase.from('job_applications').update({ status: 'viewed' }).eq('id', appId).select().single();
            if (error) throw error;
            set(state => ({
                applications: state.applications.map(app => app.id === appId ? data : app)
            }));
        }
    },
});