import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../hooks/useAppStore';
import { SendIcon, UserIcon } from '../icons/Icon';
import Button from '../ui/Button';

interface CommentThreadProps {
  entityId: string;
  currentUser: {
    name: string;
    avatar: string;
  };
}

const CommentThread: React.FC<CommentThreadProps> = ({ entityId, currentUser }) => {
    const { portalComments, addPortalComment } = useAppStore();
    const [newComment, setNewComment] = useState('');

    const comments = useMemo(() => {
        return portalComments.filter(c => c.entityId === entityId)
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }, [portalComments, entityId]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newComment.trim()) {
            addPortalComment({
                entityId,
                userName: currentUser.name,
                userAvatar: currentUser.avatar,
                text: newComment,
            });
            setNewComment('');
        }
    };

    return (
        <div className="flex flex-col h-full">
            <h4 className="font-semibold text-slate-300 mb-3">Discusión</h4>
            <div className="flex-1 space-y-4 overflow-y-auto max-h-64 bg-slate-900/50 p-3 rounded-lg">
                {comments.length > 0 ? comments.map(comment => (
                    <div key={comment.id} className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                            <UserIcon className="w-5 h-5 text-slate-300" />
                        </div>
                        <div className="bg-slate-700 p-2 rounded-lg">
                            <p className="text-sm font-semibold text-white">{comment.userName}</p>
                            <p className="text-sm text-slate-300">{comment.text}</p>
                            <p className="text-xs text-slate-500 text-right mt-1">{new Date(comment.timestamp).toLocaleString()}</p>
                        </div>
                    </div>
                )) : (
                    <p className="text-sm text-slate-500 text-center py-4">No hay comentarios aún. Sé el primero en iniciar la conversación.</p>
                )}
            </div>
            <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
                <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Escribe un comentario..."
                    className="flex-1 block w-full px-3 py-2 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-slate-800 text-white"
                />
                <Button type="submit" size="sm">
                    <SendIcon className="w-4 h-4" />
                </Button>
            </form>
        </div>
    );
};

export default CommentThread;
