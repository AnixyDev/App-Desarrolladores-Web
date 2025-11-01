// FIX: Add a triple-slash directive to explicitly include React types, resolving issues with JSX elements not being recognized by TypeScript.
/// <reference types="react" />

import React from 'react';
import { Link } from 'react-router-dom';
import Modal from '../ui/Modal.tsx';
import Button from '../ui/Button.tsx';
import { SparklesIcon } from '../icons/Icon.tsx';

interface BuyCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BuyCreditsModal: React.FC<BuyCreditsModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Créditos de IA Insuficientes">
      <div className="text-center p-4">
        <SparklesIcon className="w-12 h-12 text-purple-400 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-white mb-2">
          Necesitas más créditos para usar esta función.
        </h3>
        <p className="text-gray-400 mb-6">
          Las funciones avanzadas de IA consumen créditos. Compra un paquete para continuar.
        </p>
        <Button as={Link} to="/billing" onClick={onClose} className="w-full">
          Comprar Créditos
        </Button>
      </div>
    </Modal>
  );
};

export default BuyCreditsModal;