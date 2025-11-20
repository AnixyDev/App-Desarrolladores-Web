
import React from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { CreditCard } from 'lucide-react';

interface JobPostPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
}

const JobPostPaymentModal: React.FC<JobPostPaymentModalProps> = ({ isOpen, onClose, onPaymentSuccess }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Destacar Oferta">
      <div className="space-y-4 text-center">
        <CreditCard className="w-12 h-12 text-primary-400 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-white">Pago de 5,95€</h3>
        <p className="text-gray-400">
          Estás a punto de realizar un pago único para destacar tu oferta de trabajo.
          Esto aumentará su visibilidad en el marketplace.
        </p>
        <div className="pt-4 flex justify-center gap-4">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={onPaymentSuccess}>
            Pagar 5,95€
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default JobPostPaymentModal;