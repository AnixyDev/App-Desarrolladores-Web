import React, { useState, useRef } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import Card, { CardContent, CardHeader, CardFooter } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { Link } from 'react-router-dom';
import { UserIcon } from '../components/icons/Icon';
import { useToast } from '../hooks/useToast';
import { Profile } from '../types';


const SettingsPage: React.FC = () => {
    const { profile, updateProfile } = useAppStore();
    const { addToast } = useToast();
    const [formData, setFormData] = useState(profile);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
             const { checked } = e.target as HTMLInputElement;
             setFormData(prev => prev ? ({ ...prev, [name]: checked }) : null);
        } else {
             setFormData(prev => prev ? ({ ...prev, [name]: value }) : null);
        }
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

    const handleNotificationChange = (key: keyof Profile['email_notifications'], value: boolean) => {
        setFormData(prev => prev ? ({
            ...prev,
            email_notifications: {
                ...prev.email_notifications,
                [key]: value,
            }
        }) : null);
    };

    if (!formData) return <div>Cargando perfil...</div>;

    const ToggleSwitch: React.FC<{
        id: string;
        label: string;
        enabled: boolean;
        onChange: (enabled: boolean) => void;
    }> = ({ id, label, enabled, onChange }) => (
        <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
            <label htmlFor={id} className="font-medium text-gray-200">{label}</label>
            <button
                type="button"
                id={id}
                onClick={() => onChange(!enabled)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${enabled ? 'bg-primary-600' : 'bg-gray-600'}`}
            >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
        </div>
    );

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
                        <Input label="Especialidad (ej. Frontend con React)" name="specialty" value={formData.specialty || ''} onChange={handleInputChange} placeholder="Tu principal área de expertise." />
                        <Input label="Habilidades Principales (separadas por comas)" name="skills" value={formData.skills?.join(', ') || ''} onChange={handleSkillsChange} placeholder="React, Node.js, Python, AWS..." />
                        <Input label="URL del Portafolio" name="portfolio_url" type="url" value={formData.portfolio_url || ''} onChange={handleInputChange} placeholder="https://github.com/tu-usuario" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Disponibilidad (horas/semana)" name="availability_hours" type="number" value={formData.availability_hours || ''} onChange={(e) => setFormData(p => p ? {...p, availability_hours: Number(e.target.value)} : null)} />
                            <Input label="Tarifa Pública Preferida (€/hora)" name="preferred_hourly_rate_cents" type="number" value={(formData.preferred_hourly_rate_cents || 0) / 100} onChange={(e) => setFormData(p => p ? {...p, preferred_hourly_rate_cents: Number(e.target.value) * 100} : null)} />
                        </div>
                    </CardContent>
                </Card>
                
                 <Card>
                    <CardHeader>
                        <h2 className="text-lg font-semibold text-white">Notificaciones por Email</h2>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <ToggleSwitch
                            id="on_invoice_overdue"
                            label="Cuando una factura vence"
                            enabled={formData.email_notifications.on_invoice_overdue}
                            onChange={(value) => handleNotificationChange('on_invoice_overdue', value)}
                        />
                        <ToggleSwitch
                            id="on_proposal_status_change"
                            label="Cuando un cliente acepta/rechaza una propuesta"
                            enabled={formData.email_notifications.on_proposal_status_change}
                            onChange={(value) => handleNotificationChange('on_proposal_status_change', value)}
                        />
                        <ToggleSwitch
                            id="on_contract_signed"
                            label="Cuando un cliente firma un contrato"
                            enabled={formData.email_notifications.on_contract_signed}
                            onChange={(value) => handleNotificationChange('on_contract_signed', value)}
                        />
                        <ToggleSwitch
                            id="on_new_project_message"
                            label="Cuando recibes un nuevo mensaje en un proyecto"
                            enabled={formData.email_notifications.on_new_project_message}
                            onChange={(value) => handleNotificationChange('on_new_project_message', value)}
                        />
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <h2 className="text-lg font-semibold text-white">Automatización de Pagos</h2>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                            <label htmlFor="payment_reminders_enabled" className="font-medium text-gray-200">Activar recordatorios automáticos</label>
                            <button type="button" onClick={() => setFormData(p => p ? {...p, payment_reminders_enabled: !p.payment_reminders_enabled} : null)} className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${formData.payment_reminders_enabled ? 'bg-primary-600' : 'bg-gray-600'}`}>
                                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${formData.payment_reminders_enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 px-1">La aplicación simulará el envío de emails cuando una factura esté a punto de vencer o haya vencido.</p>
                         <div>
                            <label htmlFor="reminder_template_upcoming" className="block text-sm font-medium text-gray-300 mb-1">Plantilla de recordatorio (Próximo Vencimiento)</label>
                            <textarea id="reminder_template_upcoming" name="reminder_template_upcoming" rows={5} value={formData.reminder_template_upcoming} onChange={handleInputChange} className="block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-gray-800 text-white font-mono text-xs" />
                         </div>
                         <div>
                            <label htmlFor="reminder_template_overdue" className="block text-sm font-medium text-gray-300 mb-1">Plantilla de recordatorio (Vencida)</label>
                            <textarea id="reminder_template_overdue" name="reminder_template_overdue" rows={5} value={formData.reminder_template_overdue} onChange={handleInputChange} className="block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-gray-800 text-white font-mono text-xs" />
                         </div>
                         <p className="text-xs text-gray-500 px-1">Puedes usar las variables: [ClientName], [InvoiceNumber], [Amount], [DueDate], [YourName].</p>
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