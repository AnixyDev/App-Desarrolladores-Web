
import { StateCreator } from 'zustand';
import { Job, JobApplication } from '../../types.ts';
import { AppState } from '../useAppStore.tsx';
import { supabase } from '../../lib/supabaseClient.ts';

export interface JobSlice {
  jobs: Job[];
  applications: JobApplication[];
  savedJobIds: string[];
  notifiedJobIds: string[];
  
  fetchJobs: () => Promise<void>;
  fetchApplications: () => Promise<void>;
  
  getJobById: (id: string) => Job | undefined;
  getApplicationsByUserId: (userId: string) => JobApplication[];
  getApplicationsByJobId: (jobId: string) => JobApplication[];
  getSavedJobs: () => Job[];
  
  addJob: (job: Omit<Job, 'id'>) => Promise<void>;
  applyForJob: (jobId: string, userId: string, proposalText: string) => Promise<void>;
  viewApplication: (applicationId: string) => Promise<void>;
  
  saveJob: (jobId: string) => void; // Local user preference
  markJobAsNotified: (jobId: string) => void;
}

export const createJobSlice: StateCreator<AppState, [], [], JobSlice> = (set, get) => ({
    jobs: [],
    applications: [],
    savedJobIds: [],
    notifiedJobIds: [],

    fetchJobs: async () => {
        const { data, error } = await supabase.from('jobs').select('*').order('created_at', { ascending: false });
        if (!error && data) set({ jobs: data as Job[] });
    },

    fetchApplications: async () => {
        const { data, error } = await supabase.from('job_applications').select('*');
        if (!error && data) set({ applications: data as JobApplication[] });
    },

    getJobById: (id) => get().jobs.find(j => j.id === id),
    getApplicationsByUserId: (userId) => get().applications.filter(app => app.userId === userId),
    getApplicationsByJobId: (jobId) => get().applications.filter(app => app.jobId === jobId),
    getSavedJobs: () => {
        const { jobs, savedJobIds } = get();
        return jobs.filter(job => savedJobIds.includes(job.id));
    },

    addJob: async (job) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase.from('jobs').insert({ ...job, user_id: user.id }).select().single();
        if (!error && data) {
            set(state => ({ jobs: [data as Job, ...state.jobs] }));
        }
    },

    applyForJob: async (jobId, userId, proposalText) => {
        const job = get().getJobById(jobId);
        const profile = get().profile;

        if (!job || !profile) return;

        const { data, error } = await supabase.from('job_applications').insert({
            job_id: jobId,
            applicant_id: userId,
            proposal_text: proposalText,
            status: 'sent'
        }).select().single();

        if (!error && data) {
            // Need to map DB response to Frontend Type if names differ, but here we can just reload or append
            // Assuming simplified mapping for this slice
            const newApp: JobApplication = {
                id: data.id,
                jobId: data.job_id,
                userId: data.applicant_id,
                applicantName: profile.full_name, // Optimistic
                jobTitle: job.title,
                proposalText: data.proposal_text,
                status: data.status,
                appliedAt: data.created_at
            };
            set(state => ({ applications: [newApp, ...state.applications] }));
        }
    },

    viewApplication: async (applicationId) => {
        const { error } = await supabase.from('job_applications')
            .update({ status: 'viewed' })
            .eq('id', applicationId)
            .eq('status', 'sent'); // Only update if currently sent

        if (!error) {
            set(state => ({
                applications: state.applications.map(app => 
                    app.id === applicationId && app.status === 'sent' 
                    ? { ...app, status: 'viewed' } 
                    : app
                )
            }));
        }
    },

    saveJob: (jobId) => {
        // Local persistence handling via zustand persist middleware
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
