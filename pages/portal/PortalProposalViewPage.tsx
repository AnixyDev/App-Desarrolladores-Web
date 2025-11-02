
import React from 'react';
import { useParams } from 'react-router-dom';
import { useAppStore } from '../../hooks/useAppStore.tsx';
import Card, { CardHeader, CardContent, CardFooter } from '../../components/ui/Card.tsx';
import { formatCurrency } from '../../lib/utils.ts';
import Button from '../../components/ui/Button.tsx';
import { SignatureIcon } from '../../components/icons/Icon.tsx';

const PortalProposalViewPage: React.FC = () => {
    const { proposalId } = useParams<{ proposalId: string }>();
    const { proposals, getClientById } = useAppStore();

    const proposal = proposals.find(p => p.id === proposalId);

    if (!proposal) {
        return <div className="text-center text-red-500">Propuesta no encontrada.</div>;
    }

    const client = getClientById(proposal.client_id);
    
    return (
        <Card className="max-w-4xl mx-auto">
            <CardHeader>
                <h2 className="text-2xl font-bold text-white">{proposal.title}</h2>
                <p className="text-gray-400">Para: {client?.name}</p>
            </CardHeader>
            <CardContent className="prose prose-invert prose-p:text-gray-300">
                <p>{proposal.content}</p>
                <div className="mt-8 pt-4 border-t border-gray-700 text-right">
                    <p className="text-gray-400">Importe Total:</p>
                    <p className="text-3xl font-bold text-white">{formatCurrency(proposal.amount_cents)}</p>
                </div>
            </CardContent>
            <CardFooter className='flex justify-between items-center'>
                 <span className={`px-3 py-1 rounded-full text-sm capitalize ${
                    proposal.status === 'sent' ? 'bg-blue-500/20 text-blue-400' :
                    proposal.status === 'accepted' ? 'bg-green-500/20 text-green-400' :
                    'bg-red-500/20 text-red-400'
                }`}>
                    Estado: {proposal.status}
                </span>
                {proposal.status === 'sent' && (
                     <div className='flex gap-2'>
                        <Button variant='danger' size='sm' onClick={() => alert("Propuesta rechazada (simulación).")}>Rechazar</Button>
                        <Button size='sm' onClick={() => alert("Propuesta aceptada y firmada (simulación).")}>
                            <SignatureIcon className='w-4 h-4 mr-2'/>
                            Aceptar y Firmar
                        </Button>
                    </div>
                )}
                {proposal.status === 'accepted' && (
                    <p className='text-sm text-green-400'>Aceptada por {proposal.signed_by} el {proposal.signed_at}</p>
                )}
            </CardFooter>
        </Card>
    );
};

export default PortalProposalViewPage;