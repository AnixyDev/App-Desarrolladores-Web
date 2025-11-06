import { StateCreator } from 'zustand';
import { AppState } from '../useAppStore';
// FIX: Import KnowledgeArticle type to manage knowledge base state.
import { ProjectMessage, ProjectFile, KnowledgeArticle } from '../../types';

export interface CollaborationSlice {
  projectComments: ProjectMessage[];
  projectFiles: ProjectFile[];
  addProjectComment: (comment: Omit<ProjectMessage, 'id' | 'timestamp'>) => string | null;
  addProjectFile: (file: Omit<ProjectFile, 'id' | 'uploadedAt'>) => void;
  deleteProjectFile: (fileId: string) => void;
  // FIX: Add state and actions for Knowledge Base articles.
  articles: KnowledgeArticle[];
  addArticle: (article: Partial<KnowledgeArticle>) => void;
  updateArticle: (article: Partial<KnowledgeArticle>) => void;
  deleteArticle: (id: string) => void;
}

export const createCollaborationSlice: StateCreator<AppState, [], [], CollaborationSlice> = (set, get) => ({
  projectComments: [],
  projectFiles: [],
  articles: [],
  addProjectComment: (comment) => {
    const newComment: ProjectMessage = {
      ...comment,
      id: `p-comment-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    set(state => ({ projectComments: [...state.projectComments, newComment]}));
    
    const { profile } = get();
    // Only send notification if someone else posts a message
    if (profile && profile.id !== comment.user_id && profile.email_notifications.on_new_project_message) {
        const projectName = get().getProjectById(comment.project_id)?.name;
        return `Simulación: Email enviado a ${profile.email} sobre un nuevo mensaje en el proyecto "${projectName}".`;
    }
    return null;
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
  },
  // FIX: Implement actions for managing Knowledge Base articles.
  addArticle: (article) => {
    const newArticle: KnowledgeArticle = {
        ...article,
        id: `kb-${Date.now()}`,
        created_at: new Date().toISOString().slice(0, 10),
        updated_at: new Date().toISOString().slice(0, 10),
    } as KnowledgeArticle;
    set(state => ({ articles: [...state.articles, newArticle] }));
  },
  updateArticle: (article) => {
      set(state => ({
          articles: state.articles.map(a => a.id === article.id ? { ...a, ...article, updated_at: new Date().toISOString().slice(0, 10) } as KnowledgeArticle : a)
      }));
  },
  deleteArticle: (id) => {
      set(state => ({ articles: state.articles.filter(a => a.id !== id) }));
  },
});
