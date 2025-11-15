import React from 'react';
import { useParams } from 'react-router-dom';
import { useAppStore } from '../../hooks/useAppStore';
import Card, { CardHeader, CardContent, CardFooter } from '../../components/ui/Card';
import { formatCurrency } from '../../lib/utils';
import Button from '../../components/ui/Button';
import { useToast } from '../../hooks/useToast';
import { Proposal } from '../../types';
import CommentThread from '../../components/portal/CommentThread';
import FileList from '../../components/portal/FileList';

const PortalProposalViewPage: React.FC = () => {
    const { proposalId } = useParams<{ proposalId: string }>();
    const { proposals, getClientById, updateProposalStatus } = useAppStore();
    const { addToast } = useToast();

    const proposal = proposals.find(p => p.id === proposalId);

    if (!proposal) {
        return <div className="text-center text-red-500">Propuesta no encontrada.</div>;
    }

    const client = getClientById(proposal.client_id);

    // FIX: Make function async and await the promise
    const handleStatusChange = async (status: 'accepted' | 'rejected') => {
        if (proposal) {
            const message = await updateProposalStatus(proposal.id, status);
            if (message) {
                addToast(message, 'info');
            }
        }
    };

    return (
         <div className="max-w-4xl mx-auto space-y-6">
            <Card>
                <CardHeader>
                    <h2 className="text-2xl font-bold text-white">{proposal.title}</h2>
                    <p className="text-gray-400">Enviada el: {proposal.created_at}</p>
                </CardHeader>
                <CardContent className="prose prose-invert prose-p:text-gray-300 max-w-none">
                    <p className="whitespace-pre-wrap">{proposal.content}</p>
                </CardContent>
                <CardFooter className='flex flex-col sm:flex-row justify-between items-center gap-4'>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <span className="text-gray-400">Importe Propuesto: </span>
                        <span className="font-bold text-white text-lg">{formatCurrency(proposal.amount_cents)}</span>
                    </div>
                    {proposal.status === 'sent' ? (
                        <div className="flex gap-4">
                            <Button variant="danger" onClick={() => handleStatusChange('rejected')}>Rechazar</Button>
                            <Button variant="primary" onClick={() => handleStatusChange('accepted')}>Aceptar Propuesta</Button>
                        </div>
                    ) : (
                        <span className={`px-3 py-1 rounded-full text-sm capitalize ${
                            proposal.status === 'accepted' ? 'bg-green-500/20 text-green-400' :
                            proposal.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                            'bg-gray-500/20 text-gray-400'
                        }`}>
                            Estado: {proposal.status}
                        </span>
                    )}
                </CardFooter>
            </Card>
             <Card>
                <CardHeader>
                    <h3 className="text-lg font-semibold text-white">Comentarios y Archivos</h3>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {client && <CommentThread entityId={proposal.id} currentUser={{ name: client.name, avatar: '' }} />}
                    {client && <FileList entityId={proposal.id} currentUser={{ name: client.name }} />}
                </CardContent>
            </Card>
        </div>
    );
};

export default PortalProposalViewPage;