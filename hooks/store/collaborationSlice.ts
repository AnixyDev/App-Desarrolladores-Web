import { StateCreator } from 'zustand';
import { AppState } from '../useAppStore';
import { ProjectMessage, ProjectFile } from '../../types';

export interface CollaborationSlice {
  projectComments: ProjectMessage[];
  projectFiles: ProjectFile[];
  addProjectComment: (comment: Omit<ProjectMessage, 'id' | 'timestamp'>) => void;
  addProjectFile: (file: Omit<ProjectFile, 'id' | 'uploadedAt'>) => void;
  deleteProjectFile: (fileId: string) => void;
}

export const createCollaborationSlice: StateCreator<AppState, [], [], CollaborationSlice> = (set, get) => ({
  projectComments: [],
  projectFiles: [],
  addProjectComment: (comment) => {
    const newComment: ProjectMessage = {
      ...comment,
      id: `p-comment-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    set(state => ({ projectComments: [...state.projectComments, newComment]}));
  },
  addProjectFile: (file) => {
    const newFile: ProjectFile = {
        ...file,
        id: `file-${Date.now()}`,
        uploadedAt: new Date().toISOString(),
    };
    set(state => ({ projectFiles: [...state.projectFiles, newFile] }));
  },
  deleteProjectFile: (fileId) => {
    set(state => ({ projectFiles: state.projectFiles.filter(f => f.id !== fileId) }));
  }
});