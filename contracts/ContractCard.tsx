// contracts/ContractCard.tsx
import React from 'react';
import { Contract } from '../types';
import StatusChip from '../components/ui/StatusChip';
import Button from '../components/ui/Button';
import { SendIcon } from '../components/icons/Icon';

interface ContractCardProps {
    contract: Contract;
    projectName?: string;
    clientName?: string;
    onSend: (contract: Contract) => void;
    onSetExpiration: (id: string, date: string) => void;
}

export const ContractCard: React.FC<ContractCardProps> = ({ contract, projectName, clientName, onSend, onSetExpiration }) => (
    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
        <div className="flex justify-between items-start mb-2">
            <div>
                <p className="font-semibold text-white pr-2">{projectName}</p>
                <p className="text-sm text-slate-300">{clientName}</p>
            </div>
            <StatusChip type="contract" status={contract.status} />
        </div>
        <div className="text-sm space-y-2 text-slate-400 border-t border-slate-700 pt-3 mt-3">
            <p className='flex justify-between'><span>Fecha:</span> <span className="text-slate-200">{new Date(contract.created_at).toLocaleDateString()}</span></p>
        </div>
        {contract.status === 'draft' && (
            <div className="mt-3 pt-3 border-t border-slate-700">
                <label className="block text-xs font-medium text-slate-400 mb-1">Fecha de Vencimiento</label>
                <input
                    type="date"
                    value={contract.expires_at || ''}
                    onChange={(e) => onSetExpiration(contract.id, e.target.value)}
                    className="w-full px-2 py-1 border border-slate-600 rounded-md bg-slate-700 text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
            </div>
        )}
        <div className="flex justify-end mt-4">
            {contract.status === 'draft' && (
                <Button size="sm" variant="secondary" onClick={() => onSend(contract)} title="Enviar por Email">
                    <SendIcon className="w-4 h-4 mr-2" /> Enviar
                </Button>
            )}
        </div>
    </div>
);