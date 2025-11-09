import React, { useRef } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { useAppStore } from '../hooks/useAppStore';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { Link } from 'react-router-dom';
import { UserIcon, DownloadIcon, RefreshCwIcon } from '../components/icons/Icon';
import { useToast } from '../hooks/useToast';
import { Profile } from '../types';
import { logoSvgDataUri } from '../components/icons/Logo';

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


const SettingsPage: React.FC = () => {
    const { profile, updateProfile } = useAppStore();
    const { addToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
        register,
        handleSubmit,
        control,
        formState: { errors, isSubmitting },
        watch,
        setValue
    } = useForm<Profile>({
        defaultValues: profile || undefined,
    });
    
    const avatarUrl = watch('avatar_url');

    if (!profile) return <div>Cargando perfil...</div>;

    const onSubmit: SubmitHandler<Profile> = async (data) => {
        try {
            await updateProfile(data);
            addToast('Perfil actualizado con éxito.', 'success');
        } catch(error) {
            addToast(`Error al actualizar el perfil: ${(error as Error).message}`, 'error');
        }
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
                setValue('avatar_url', reader.result as string, { shouldDirty: true });
                addToast('Imagen de perfil actualizada temporalmente. Guarda los cambios para confirmarla.', 'info');
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleDownloadLogo = () => {
        const link = document.createElement('a');
        link.href = logoSvgDataUri;
        link.download = 'logo.svg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        addToast('Logo descargado como logo.svg', 'success');
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-white">Ajustes</h1>
                 <Button as={Link} to="/public-profile" variant="secondary">Ver Perfil Público</Button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                 <Card>
                    <CardHeader>
                        <h2 className="text-lg font-semibold text-white">Información General</h2>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                             {avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar" className="w-20 h-20 rounded-full object-cover" />
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
                        <Input label="Nombre Completo" {...register("full_name")} />
                        <Input 
                            label="Email" 
                            type="email" 
                            {...register("email", { 
                                required: "El email es obligatorio.",
                                pattern: {
                                    value: /^\S+@\S+$/i,
                                    message: "Formato de email no válido."
                                }
                            })} 
                            error={errors.email?.message} 
                        />
                        <Input label="Nombre del Negocio" {...register("business_name")} />
                        <Input label="NIF/CIF" {...register("tax_id")} />
                        <Input 
                            label="Tarifa por Hora (€)" 
                            type="number" 
                            step="0.01"
                            defaultValue={profile.hourly_rate_cents / 100}
                            {...register("hourly_rate_cents", {
                                setValueAs: v => Math.round(Number(v) * 100)
                            })}
                        />
                        <Input label="Color principal para PDFs" type="color" wrapperClassName="flex items-center gap-4" {...register("pdf_color")} />
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader>
                        <h2 className="text-lg font-semibold text-white">Recursos de Marca</h2>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                            <div className="flex items-center gap-4">
                                <img src={logoSvgDataUri} alt="Logo Preview" className="h-12 w-12 rounded-md bg-gray-900 p-1" />
                                <div>
                                    <h3 className="font-semibold text-white">Logo de la Empresa</h3>
                                    <p className="text-sm text-gray-400">Usa tu logo en facturas, Stripe y otros materiales.</p>
                                </div>
                            </div>
                            <Button type="button" onClick={handleDownloadLogo} variant="secondary">
                                <DownloadIcon className="w-4 h-4 mr-2"/>
                                Descargar
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <h2 className="text-lg font-semibold text-white">Perfil Público de Freelancer</h2>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div>
                            <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-1">Biografía Corta</label>
                            <textarea id="bio" rows={4} {...register("bio")} className="block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-gray-800 text-white" placeholder="Describe brevemente tu especialidad y experiencia."/>
                         </div>
                        <Input label="Especialidad (ej. Frontend con React)" {...register("specialty")} placeholder="Tu principal área de expertise." />
                        <Input 
                            label="Habilidades Principales (separadas por comas)" 
                            defaultValue={profile.skills?.join(', ')}
                            {...register("skills", {
                                setValueAs: (v: string) => v.split(',').map(s => s.trim()).filter(Boolean)
                            })} 
                            placeholder="React, Node.js, Python, AWS..."
                        />
                        <Input label="URL del Portafolio" type="url" {...register("portfolio_url")} placeholder="https://github.com/tu-usuario" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input 
                                label="Disponibilidad (horas/semana)" 
                                type="number" 
                                {...register("availability_hours", { setValueAs: v => Number(v) || 0 })} 
                            />
                            <Input 
                                label="Tarifa Pública Preferida (€/hora)" 
                                type="number" 
                                step="0.01"
                                defaultValue={(profile.preferred_hourly_rate_cents || 0) / 100}
                                {...register("preferred_hourly_rate_cents", {
                                    setValueAs: v => Math.round(Number(v) * 100)
                                })}
                            />
                        </div>
                    </CardContent>
                </Card>
                
                 <Card>
                    <CardHeader>
                        <h2 className="text-lg font-semibold text-white">Notificaciones por Email</h2>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Controller
                            name="email_notifications.on_invoice_overdue"
                            control={control}
                            render={({ field }) => (
                                <ToggleSwitch id="on_invoice_overdue" label="Cuando una factura vence" enabled={field.value} onChange={field.onChange} />
                            )}
                        />
                         <Controller
                            name="email_notifications.on_proposal_status_change"
                            control={control}
                            render={({ field }) => (
                                <ToggleSwitch id="on_proposal_status_change" label="Cuando un cliente acepta/rechaza una propuesta" enabled={field.value} onChange={field.onChange} />
                            )}
                        />
                         <Controller
                            name="email_notifications.on_contract_signed"
                            control={control}
                            render={({ field }) => (
                                <ToggleSwitch id="on_contract_signed" label="Cuando un cliente firma un contrato" enabled={field.value} onChange={field.onChange} />
                            )}
                        />
                         <Controller
                            name="email_notifications.on_new_project_message"
                            control={control}
                            render={({ field }) => (
                                <ToggleSwitch id="on_new_project_message" label="Cuando recibes un nuevo mensaje en un proyecto" enabled={field.value} onChange={field.onChange} />
                            )}
                        />
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <h2 className="text-lg font-semibold text-white">Automatización de Pagos</h2>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Controller
                            name="payment_reminders_enabled"
                            control={control}
                            render={({ field }) => (
                                <ToggleSwitch id="payment_reminders_enabled" label="Activar recordatorios automáticos" enabled={field.value} onChange={field.onChange} />
                            )}
                        />
                        <p className="text-xs text-gray-500 px-1">La aplicación simulará el envío de emails cuando una factura esté a punto de vencer o haya vencido.</p>
                         <div>
                            <label htmlFor="reminder_template_upcoming" className="block text-sm font-medium text-gray-300 mb-1">Plantilla de recordatorio (Próximo Vencimiento)</label>
                            <textarea id="reminder_template_upcoming" rows={5} {...register("reminder_template_upcoming")} className="block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-gray-800 text-white font-mono text-xs" />
                         </div>
                         <div>
                            <label htmlFor="reminder_template_overdue" className="block text-sm font-medium text-gray-300 mb-1">Plantilla de recordatorio (Vencida)</label>
                            <textarea id="reminder_template_overdue" rows={5} {...register("reminder_template_overdue")} className="block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-gray-800 text-white font-mono text-xs" />
                         </div>
                         <p className="text-xs text-gray-500 px-1">Puedes usar las variables: [ClientName], [InvoiceNumber], [Amount], [DueDate], [YourName].</p>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <RefreshCwIcon className="animate-spin w-5 h-5" /> : 'Guardar Cambios'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default SettingsPage;