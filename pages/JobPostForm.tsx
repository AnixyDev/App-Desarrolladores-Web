

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useAppStore } from '../hooks/useAppStore';
import { useToast } from '../hooks/useToast';
import { Briefcase, DollarSign, Clock, Zap, RefreshCwIcon } from 'lucide-react';
import { Job } from '../types';
import { redirectToCheckout } from '../services/stripeService';

const UpgradePromptModal = lazy(() => import('../components/modals/UpgradePromptModal'));

const JobPostForm: React.FC = () => {
    const { addJob, profile } = useAppStore();
    const { addToast } = useToast();
    const navigate = useNavigate();

    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    const [formData, setFormData] = useState<Omit<Job, 'id' | 'cliente' | 'fechaPublicacion' | 'isFeatured' | 'compatibilidadIA' | 'postedByUserId'>>({
        titulo: '',
        descripcionCorta: '',
        descripcionLarga: '',
        presupuesto: 0,
        duracionSemanas: 0,
        habilidades: [],
    });

    const [skillsInput, setSkillsInput] = useState('');
    const [isFeatured, setIsFeatured] = useState(false);

    useEffect(() => {
        if (profile?.plan === 'Free') {
            setIsUpgradeModalOpen(true);
        }
    }, [profile?.plan]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
    };

    const handleSkillsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const skillsString = e.target.value;
        setSkillsInput(skillsString);
        setFormData(prev => ({ ...prev, habilidades: skillsString.split(',').map(s => s.trim()).filter(Boolean) }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        
        if (isFeatured) {
            try {
                await redirectToCheckout('featuredJob');
                // The webhook will handle marking the job as featured after payment.
                // For now, we proceed to create the job, assuming payment will succeed.
                await publishJob(true);
            } catch (error) {
                addToast((error as Error).message, 'error');
                setIsLoading(false);
            }
        } else {
            await publishJob(false);
            setIsLoading(false);
        }
    };

    const publishJob = async (featured: boolean) => {
        if (!profile) return;
        
        const jobData = {
            ...formData,
            isFeatured: featured,
            cliente: profile.business_name,
            fechaPublicacion: new Date().toISOString().split('T')[0],
            compatibilidadIA: Math.floor(Math.random() * 40) + 60,
        };
        
        try {
            await addJob(jobData);
            addToast(`Oferta "${formData.titulo}" publicada con éxito.`, 'success');
            navigate('/my-job-posts');
        } catch (error) {
             addToast(`Error al publicar la oferta: ${(error as Error).message}`, 'error');
        }
    };
    
    if (isUpgradeModalOpen) {
        return (
            <Suspense fallback={null}>
                <UpgradePromptModal 
                    isOpen={isUpgradeModalOpen} 
                    onClose={() => navigate('/')}
                    featureName="publicar ofertas de trabajo"
                />
            </Suspense>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
                <Briefcase className="w-6 h-6"/> Publicar Nueva Oferta
            </h1>
            <Card>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-6">
                        <Input
                            label="Título del Proyecto"
                            name="titulo"
                            value={formData.titulo}
                            onChange={handleInputChange}
                            placeholder="Ej: Desarrollador React para E-commerce"
                            required
                        />
                        <Input
                            label="Descripción Corta (Subtítulo)"
                            name="descripcionCorta"
                            value={formData.descripcionCorta}
                            onChange={handleInputChange}
                            placeholder="Ej: Buscamos un desarrollador con experiencia en Next.js y Shopify."
                            required
                        />
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Descripción Completa (Soporta Markdown)</label>
                            <textarea
                                name="descripcionLarga"
                                value={formData.descripcionLarga}
                                onChange={handleInputChange}
                                rows={8}
                                className="block w-full px-3 py-2 border rounded-md shadow-sm placeholder-slate-500 focus:outline-none sm:text-sm bg-slate-800 text-white border-slate-600 focus:ring-primary-500 focus:border-primary-500"
                                placeholder="Detalla los requisitos, responsabilidades, y qué esperas del freelancer..."
                                required
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <Input
                                label="Presupuesto Fijo (€)"
                                name="presupuesto"
                                type="number"
                                value={formData.presupuesto || ''}
                                onChange={handleInputChange}
                                icon={<DollarSign className="w-4 h-4 text-gray-400" />}
                                required
                            />
                             <Input
                                label="Duración Estimada (Semanas)"
                                name="duracionSemanas"
                                type="number"
                                value={formData.duracionSemanas || ''}
                                onChange={handleInputChange}
                                icon={<Clock className="w-4 h-4 text-gray-400" />}
                                required
                            />
                        </div>
                        <Input
                            label="Habilidades Requeridas (separadas por comas)"
                            name="habilidades"
                            value={skillsInput}
                            onChange={handleSkillsChange}
                            placeholder="Ej: React, TypeScript, Node.js, GraphQL"
                            icon={<Zap className="w-4 h-4 text-gray-400" />}
                            required
                        />
                         <div className="p-4 bg-fuchsia-900/30 border border-fuchsia-700 rounded-lg">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="isFeatured"
                                    checked={isFeatured}
                                    onChange={(e) => setIsFeatured(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-fuchsia-600 focus:ring-fuchsia-500"
                                />
                                <label htmlFor="isFeatured" className="ml-3">
                                    <span className="font-semibold text-fuchsia-400">Destacar esta oferta (Pago único de 5,95€)</span>
                                    <p className="text-xs text-fuchsia-200/80">Tu oferta aparecerá en la parte superior y atraerá a más candidatos.</p>
                                </label>
                            </div>
                        </div>
                    </CardContent>
                    <div className="p-4 border-t border-slate-800 bg-slate-800/20 rounded-b-lg flex justify-end">
                        <Button type="submit" disabled={isLoading}>
                           {isLoading && <RefreshCwIcon className="w-4 h-4 mr-2 animate-spin" />}
                           {isLoading ? 'Procesando...' : (isFeatured ? 'Continuar al Pago' : 'Publicar Oferta')}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default JobPostForm;