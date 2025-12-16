
import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { getStripe, createPaymentSheet } from '../../services/stripeService';
import Button from '../ui/Button';
import { formatCurrency } from '../../lib/utils';
import { RefreshCwIcon, CheckCircleIcon, AlertTriangleIcon } from '../icons/Icon';

interface StripePaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    amountCents: number;
    description: string;
    onPaymentSuccess: () => void;
}

const CheckoutForm: React.FC<{ amount: number; onSuccess: () => void }> = ({ amount, onSuccess }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [message, setMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsLoading(true);

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                // Return URL es obligatoria, pero con redirect: 'if_required' a veces no se usa si el pago es inmediato.
                // Apuntamos a la home con un query param para manejar el estado si redirige.
                return_url: `${window.location.origin}/?payment=success`,
            },
            redirect: 'if_required'
        });

        if (error) {
            setMessage(error.message || "Ocurrió un error inesperado.");
        } else {
            // El pago se confirmó exitosamente sin redirección (o ya se manejó)
            onSuccess();
        }

        setIsLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            <PaymentElement />
            {message && (
                <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded text-sm flex items-center">
                    <AlertTriangleIcon className="w-4 h-4 mr-2"/> {message}
                </div>
            )}
            <Button type="submit" disabled={isLoading || !stripe || !elements} className="w-full">
                {isLoading ? <RefreshCwIcon className="w-4 h-4 animate-spin"/> : `Pagar ${formatCurrency(amount)}`}
            </Button>
        </form>
    );
};

const StripePaymentModal: React.FC<StripePaymentModalProps> = ({ isOpen, onClose, amountCents, description, onPaymentSuccess }) => {
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [initError, setInitError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && amountCents > 0) {
            const initializePayment = async () => {
                try {
                    const secret = await createPaymentSheet(amountCents);
                    setClientSecret(secret);
                } catch (error) {
                    setInitError("No se pudo iniciar la sesión de pago segura.");
                }
            };
            initializePayment();
        }
    }, [isOpen, amountCents]);

    const handleSuccess = () => {
        onPaymentSuccess();
        onClose();
    };

    const stripePromise = getStripe();

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Pago Seguro">
            <div className="space-y-4">
                <div className="bg-gray-800 p-4 rounded-lg flex justify-between items-center">
                    <span className="text-gray-300">{description}</span>
                    <span className="text-xl font-bold text-white">{formatCurrency(amountCents)}</span>
                </div>

                {initError && (
                    <div className="text-red-400 text-center text-sm">{initError}</div>
                )}

                {clientSecret && (
                    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'night', variables: { colorPrimary: '#d946ef' } } }}>
                        <CheckoutForm amount={amountCents} onSuccess={handleSuccess} />
                    </Elements>
                )}

                {!clientSecret && !initError && (
                    <div className="flex justify-center py-8">
                        <RefreshCwIcon className="w-8 h-8 text-primary-500 animate-spin" />
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default StripePaymentModal;
