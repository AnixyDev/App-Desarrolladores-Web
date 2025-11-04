import React, { useState, useRef } from 'react';
import { useAppStore } from '../hooks/useAppStore.tsx';
import Card, { CardContent, CardHeader, CardFooter } from '../components/ui/Card.tsx';
import Input from '../components/ui/Input.tsx';
import Button from '../components/ui/Button.tsx';
import { Link } from 'react-router-dom';
import { UserIcon } from '../components/icons/Icon.tsx';
import { useToast } from '../hooks/useToast.ts';


const SettingsPage: React.FC = () => {
    const { profile, updateProfile } = useAppStore();
    const { addToast } = useToast();
    const [formData, setFormData] = useState(profile);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => prev ? ({ ...prev, [name]: value }) : null);
    };
    
    const handleSkillsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const skillsArray = e.target.value.split(',').map(s => s.trim());
        setFormData(prev => prev ? ({ ...prev, skills: skillsArray }) : null);
    };
    
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // Límite de 2MB
                addToast('La imagen es demasiado grande. Elige una de menos de 2MB.', 'error');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => prev ? { ...prev, avatar_url: reader.result as string } : null);
                addToast('Imagen de perfil actualizada temporalmente. Guarda los cambios para confirmarla.', 'info');
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData) {
            updateProfile(formData);
            addToast('Perfil actualizado con éxito.', 'success');
        }
    }

    if (!formData) return <div>Cargando perfil...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-white">Ajustes</h1>
                 <Button as={Link} to="/public-profile" variant="secondary">Ver Perfil Público</Button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
                 <Card>
                    <CardHeader>
                        <h2 className="text-lg font-semibold text-white">Información General</h2>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                             {formData.avatar_url ? (
                                <img src={formData.avatar_url} alt="Avatar" className="w-20 h-20 rounded-full object-cover" />
                            ) : (
                                <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center">
                                    <UserIcon className="w-10 h-10 text-gray-400" />
                                </div>
                            )}
                            <div>
                                <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}>Cambiar Imagen</Button>
                                <p className="text-xs text-gray-500 mt-2">JPG, PNG o GIF. Máx 2MB.</p>
                                <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                            </div>
                        </div>
                        <Input label="Nombre Completo" name="full_name" value={formData.full_name} onChange={handleInputChange} />
                        <Input label="Email" name="email" type="email" value={formData.email} onChange={handleInputChange} />
                        <Input label="Nombre del Negocio" name="business_name" value={formData.business_name} onChange={handleInputChange} />
                        <Input label="NIF/CIF" name="tax_id" value={formData.tax_id} onChange={handleInputChange} />
                        <Input label="Tarifa por Hora (€)" name="hourly_rate_cents" type="number" value={formData.hourly_rate_cents / 100} onChange={(e) => setFormData(p => p ? {...p, hourly_rate_cents: Number(e.target.value) * 100} : null)} />
                        <Input label="Color principal para PDFs" name="pdf_color" type="color" value={formData.pdf_color} onChange={handleInputChange} wrapperClassName="flex items-center gap-4" />
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader>
                        <h2 className="text-lg font-semibold text-white">Perfil Público de Freelancer</h2>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div>
                            <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-1">Biografía Corta</label>
                            <textarea id="bio" name="bio" rows={4} value={formData.bio || ''} onChange={handleInputChange} className="block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-gray-800 text-white" placeholder="Describe brevemente tu especialidad y experiencia."/>
                         </div>
                        <Input label="Habilidades Principales (separadas por comas)" name="skills" value={formData.skills?.join(', ') || ''} onChange={handleSkillsChange} placeholder="React, Node.js, Python, AWS..." />
                        <Input label="URL del Portafolio" name="portfolio_url" type="url" value={formData.portfolio_url || ''} onChange={handleInputChange} placeholder="https://github.com/tu-usuario" />
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button type="submit">Guardar Cambios</Button>
                </div>
            </form>
        </div>
    );
};

export default SettingsPage;