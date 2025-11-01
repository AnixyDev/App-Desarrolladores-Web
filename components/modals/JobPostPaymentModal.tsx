import React, { useEffect, useState } from 'react';
import Modal from '../ui/Modal.tsx';
import { CheckCircleIcon, XCircleIcon, RefreshCwIcon } from '../icons/Icon.tsx';
import Button from '../ui/Button.tsx';

type Status = 'processing' | 'success' | 'error';

interface JobPostPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const JobPostPaymentModal: React.FC<JobPostPaymentModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [status, setStatus] = useState<Status>('processing');

    useEffect(() => {
        if (isOpen) {
            setStatus('processing');
            const timer = setTimeout(() => {
                // Simulate API call result
                const isSuccess = Math.random() > 0.2; // 80% success rate
                if (isSuccess) {
                    setStatus('success');
                    setTimeout(() => {
                        onSuccess();
                        onClose();
                    }, 1500);
                } else {
                    setStatus('error');
                }
            }, 2500);

            return () => clearTimeout(timer);
        }
    }, [isOpen, onSuccess, onClose]);

    const content = {
        processing: {
            icon: RefreshCwIcon,
            title: 'Procesando pago de la oferta',
            message: 'Estás siendo redirigido a nuestra pasarela de pago segura. Esto puede tardar unos segundos.',
            iconClass: 'text-blue-400 animate-spin',
        },
        success: {
            icon: CheckCircleIcon,
            title: '¡Pago completado!',
            message: 'Tu oferta ha sido publicada y destacada. ¡Prepárate para recibir propuestas!',
            iconClass: 'text-green-400',
        },
        error: {
            icon: XCircleIcon,
            title: 'Error en el pago',
            message: 'No se pudo procesar tu pago. Por favor, verifica tus datos e inténtalo de nuevo.',
            iconClass: 'text-red-400',
        }
    };

    const currentContent = content[status];
    const Icon = currentContent.icon;

    return (
        <Modal isOpen={isOpen} onClose={status !== 'processing' ? onClose : () => {}} title={currentContent.title}>
            <div className="text-center p-6">
                <Icon className={`w-16 h-16 mx-auto mb-4 ${currentContent.iconClass}`} />
                <p className="text-gray-400">{currentContent.message}</p>
                {status === 'error' && (
                    <Button variant="secondary" onClick={onClose} className="mt-6">
                        Cerrar
                    </Button>
                )}
            </div>
        </Modal>
    );
};

export default JobPostPaymentModal;