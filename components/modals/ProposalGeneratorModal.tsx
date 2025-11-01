/// <reference types="react" />

import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal.tsx';
import Button from '../ui/Button.tsx';
import { SparklesIcon, RefreshCwIcon } from '../icons/Icon.tsx';
import { generateProposalText, AI_CREDIT_COSTS } from '../../services/geminiService.ts';
import { useAppStore } from '../../hooks/useAppStore.tsx';
import { useToast } from '../../hooks/useToast.ts';
import BuyCreditsModal from './BuyCreditsModal.tsx';


interface ProposalGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobTitle: string;
  jobDescription: string;
}

const ProposalGeneratorModal: React.FC<ProposalGeneratorModalProps> = ({ isOpen, onClose, jobTitle, jobDescription }) => {
    const { profile, consumeCredits } = useAppStore();
    const { addToast } = useToast();
    const [proposalText, setProposalText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isBuyCreditsModalOpen, setIsBuyCreditsModalOpen] = useState(false);

    const userProfileSummary = `Freelancer con experiencia en desarrollo full-stack, especializado en React, Node.js y arquitecturas en la nube. Tarifa por hora: ${profile.hourly_rate_cents / 100}€/h.`;

    const handleGenerate = async () => {
        if (profile.ai_credits < AI_CREDIT_COSTS.generateProposal) {
            setIsBuyCreditsModalOpen(true);
            return;
        }

        setIsLoading(true);
        try {
            const text = await generateProposalText(jobTitle, jobDescription, userProfileSummary);
            setProposalText(text);
            consumeCredits(AI_CREDIT_COSTS.generateProposal);
            addToast('Propuesta generada con IA', 'success');
        } catch (error) {
            addToast('Error al generar la propuesta', 'error');
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        if (isOpen) {
            handleGenerate();
        } else {
            // Reset state when closing
            setProposalText('');
            setIsLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const handleCopyAndClose = () => {
        navigator.clipboard.writeText(proposalText);
        addToast('Propuesta copiada al portapapeles', 'success');
        onClose();
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title="Generador de Propuestas con IA">
                <div className="space-y-4">
                    {isLoading && (
                        <div className="text-center p-8">
                            <RefreshCwIcon className="w-10 h-10 text-primary-400 mx-auto animate-spin mb-4" />
                            <p className="text-white">Analizando la oferta y generando tu propuesta...</p>
                        </div>
                    )}
                    {!isLoading && proposalText && (
                        <div>
                            <h3 className="font-semibold text-white mb-2">Borrador de Propuesta:</h3>
                            <textarea
                                value={proposalText}
                                onChange={(e) => setProposalText(e.target.value)}
                                rows={12}
                                className="w-full p-2 bg-gray-800 text-gray-300 border border-gray-700 rounded-md"
                            />
                            <div className="flex justify-end gap-2 pt-4">
                                <Button variant="secondary" onClick={handleCopyAndClose}>Copiar y Cerrar</Button>
                                <Button onClick={handleGenerate}>Volver a Generar</Button>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
            <BuyCreditsModal isOpen={isBuyCreditsModalOpen} onClose={() => setIsBuyCreditsModalOpen(false)} />
        </>
    );
};

export default ProposalGeneratorModal;
