import React from 'react';
import Modal from '../ui/Modal';
import { RefreshCwIcon } from '../icons/Icon';

interface PaymentProcessingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PaymentProcessingModal: React.FC<PaymentProcessingModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Procesando Pago">
      <div className="text-center p-8">
        <RefreshCwIcon className="w-12 h-12 text-primary-400 mx-auto animate-spin mb-4" />
        <p className="text-white text-lg">Estamos procesando tu pago de forma segura...</p>
        <p className="text-slate-400 mt-2">Por favor, no cierres esta ventana.</p>
      </div>
    </Modal>
  );
};

export default PaymentProcessingModal;
