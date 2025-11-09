import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { useAppStore } from '../hooks/useAppStore';
import { Logo } from './icons/Logo';
import { SparklesIcon, Users, BriefcaseIcon, CheckCircleIcon } from './icons/Icon';

const OnboardingGuide: React.FC = () => {
    const { completeOnboarding } = useAppStore();
    const navigate = useNavigate();
    const [step, setStep] = useState(0);

    const handleNext = (path?: string) => {
        if (path) {
            navigate(path);
        }
        setStep(prev => prev + 1);
    };

    const handleFinish = () => {
        completeOnboarding();
    };

    const steps = [
        {
            icon: SparklesIcon,
            title: '¡Bienvenido a DevFreelancer!',
            content: 'Estamos encantados de tenerte. Vamos a configurar tu espacio de trabajo en unos sencillos pasos.',
            buttonText: 'Empezar',
            action: () => handleNext()
        },
        {
            icon: Users,
            title: 'Paso 1: Crea tu primer cliente',
            content: 'Todo empieza con un cliente. Añade los datos de la persona o empresa para la que vas a trabajar.',
            buttonText: 'Ir a Clientes',
            action: () => handleNext('/clients')
        },
        {
            icon: BriefcaseIcon,
            title: 'Paso 2: Ahora, tu primer proyecto',
            content: 'Asocia un proyecto a tu cliente. Aquí es donde organizarás tareas, registrarás horas y gestionarás todo.',
            buttonText: 'Ir a Proyectos',
            action: () => handleNext('/projects')
        },
        {
            icon: CheckCircleIcon,
            title: '¡Todo listo para empezar!',
            content: 'Has completado la configuración inicial. Ya puedes explorar todas las herramientas que hemos preparado para ti.',
            buttonText: 'Explorar la App',
            action: handleFinish
        }
    ];

    const currentStep = steps[step];

    return (
        <Modal isOpen={true} onClose={handleFinish} title="Guía de Inicio Rápido" size="lg">
            <div className="text-center p-4">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4 border-2 border-primary-500/50">
                    <currentStep.icon className="w-8 h-8 text-primary-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">{currentStep.title}</h2>
                <p className="text-slate-400 mb-6">{currentStep.content}</p>

                <div className="flex justify-center">
                    <Button onClick={currentStep.action}>
                        {currentStep.buttonText}
                    </Button>
                </div>
                
                <div className="flex justify-center gap-2 mt-6">
                    {steps.map((_, index) => (
                        <div key={index} className={`w-2 h-2 rounded-full transition-colors ${index === step ? 'bg-primary-500' : 'bg-slate-600'}`}></div>
                    ))}
                </div>
            </div>
        </Modal>
    );
};

export default OnboardingGuide;