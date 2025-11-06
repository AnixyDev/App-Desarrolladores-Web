// pages/PublicProfilePage.tsx
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import { MailIcon, UserIcon as User, LinkIcon, ClockIcon, DollarSignIcon } from '../components/icons/Icon';
import Button from '../components/ui/Button';
import { Link, useNavigate } from 'react-router-dom';
import { formatCurrency } from '../lib/utils';

const UpgradePromptModal = lazy(() => import('../components/modals/UpgradePromptModal'));

const PublicProfilePage: React.FC = () => {
    const { profile: currentUserProfile } = useAppStore();
    const navigate = useNavigate();
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

    useEffect(() => {
        // This feature is only for Pro/Teams plans
        if (currentUserProfile?.plan === 'Free') {
            setIsUpgradeModalOpen(true);
        }
    }, [currentUserProfile?.plan]);
    
    if (isUpgradeModalOpen) {
        return (
            <Suspense fallback={null}>
                <UpgradePromptModal
                    isOpen={isUpgradeModalOpen}
                    onClose={() => navigate('/')}
                    featureName="crear un perfil público"
                />
            </Suspense>
        );
    }
    
    if (!currentUserProfile) {
        return <div>Cargando perfil...</div>
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
             <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold text-white">Mi Perfil Público</h1>
                 <Button as={Link} to="/settings" variant="secondary">Editar Perfil</Button>
            </div>
            <Card>
                <CardHeader className="text-center p-8 bg-gray-800/50">
                    {currentUserProfile.avatar_url ? (
                        <img src={currentUserProfile.avatar_url} alt="Perfil" className="w-24 h-24 rounded-full object-cover mx-auto mb-4 border-4 border-gray-600" />
                    ) : (
                        <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center mx-auto mb-4 border-4 border-gray-600">
                            <User className="w-12 h-12 text-gray-300" />
                        </div>
                    )}
                    <h1 className="text-3xl font-bold text-white">{currentUserProfile.full_name}</h1>
                    {currentUserProfile.specialty && <p className="text-xl text-primary-400 mt-1">{currentUserProfile.specialty}</p>}
                    <p className="text-lg text-gray-400 mt-1">{currentUserProfile.business_name}</p>
                </CardHeader>
                <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-4">
                        <div>
                            <h3 className="font-semibold text-white mb-2">Sobre mí</h3>
                            <p className="text-gray-300">{currentUserProfile.bio || 'Aún no has añadido una biografía.'}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-white mb-2">Habilidades Principales</h3>
                            <div className="flex flex-wrap gap-2">
                                {currentUserProfile.skills && currentUserProfile.skills.length > 0 ? (
                                    currentUserProfile.skills.map(skill => (
                                        <span key={skill} className="px-3 py-1 text-sm font-medium rounded-full bg-gray-800 text-fuchsia-400 border border-fuchsia-900/50">
                                            {skill}
                                        </span>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500">Añade tus habilidades en Ajustes.</p>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4 pt-4 border-t md:border-t-0 md:border-l border-gray-700 md:pl-6">
                         <h3 className="font-semibold text-white text-center md:text-left">Contacto y Detalles</h3>
                         <div className="flex items-center space-x-3">
                            <MailIcon className="w-5 h-5 text-gray-400" />
                            <a href={`mailto:${currentUserProfile.email}`} className="text-gray-300 hover:text-white truncate">{currentUserProfile.email}</a>
                        </div>
                        {currentUserProfile.portfolio_url && (
                             <div className="flex items-center space-x-3">
                                <LinkIcon className="w-5 h-5 text-gray-400" />
                                <a href={currentUserProfile.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white truncate">{currentUserProfile.portfolio_url}</a>
                            </div>
                        )}
                         {currentUserProfile.preferred_hourly_rate_cents && (
                            <div className="flex items-center space-x-3">
                                <DollarSignIcon className="w-5 h-5 text-gray-400" />
                                <span className="text-gray-300">Tarifa preferida: {formatCurrency(currentUserProfile.preferred_hourly_rate_cents)}/hora</span>
                            </div>
                         )}
                         {currentUserProfile.availability_hours && (
                            <div className="flex items-center space-x-3">
                                <ClockIcon className="w-5 h-5 text-gray-400" />
                                <span className="text-gray-300">Disponible: {currentUserProfile.availability_hours} h/semana</span>
                            </div>
                         )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default PublicProfilePage;
