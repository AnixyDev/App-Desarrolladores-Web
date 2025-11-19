// pages/ProjectsPage.tsx
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useAppStore } from '../hooks/useAppStore';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { Project, NewProject, NewClient } from '../types';
import { formatCurrency } from '../lib/utils';
import StatusChip from '../components/ui/StatusChip';
import EmptyState from '../components/ui/EmptyState';
import { BriefcaseIcon, PlusIcon } from '../components/icons/Icon';
import { useToast } from '../hooks/useToast';

const ProjectsPage: React.FC = () => {
    const { projects, clients, addProject, getClientById, addClient, timeEntries, expenses, profile } = useAppStore();
    const { addToast } = useToast();
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [filterStatus, setFilterStatus] = useState<'all' | Project['status']>('all');

    const { 
        register: registerProject, 
        handleSubmit: handleProjectSubmit, 
        formState: { errors: projectErrors, isSubmitting: isProjectSubmitting },
        reset: resetProjectForm,
        watch: watchProject,
        setValue: setProjectValue,
    } = useForm<NewProject>({
        defaultValues: {
            name: '',
            client_id: clients[0]?.id || '',
            description: '',
            status: 'planning',
            start_date: new Date().toISOString().split('T')[0],
            due_date: '',
            budget_cents: 0,
        }
    });

    const {
        register: registerClient,
        handleSubmit: handleClientSubmit,
        formState: { errors: clientErrors, isSubmitting: isClientSubmitting },
        reset: resetClientForm,
    } = useForm<NewClient>({
        defaultValues: { name: '', company: '', email: '', phone: '' }
    });

    const selectedClientId = watchProject('client_id');
    
    const filteredProjects = useMemo(() => {
        if (filterStatus === 'all') return projects;
        return projects.filter(p => p.status === filterStatus);
    }, [projects, filterStatus]);

    const onProjectSubmit: SubmitHandler<NewProject> = async (data) => {
        if (!data.client_id) {
            addToast('Por favor, selecciona o crea un cliente.', 'error');
            return;
        }
        
        const projectData = {
            ...data,
            budget_cents: Math.round(Number(data.budget_cents) * 100),
        };
        
        await addProject(projectData);
        setIsProjectModalOpen(false);
        resetProjectForm();
        addToast('Proyecto añadido con éxito.', 'success');
    };

    const onClientSubmit: SubmitHandler<NewClient> = async (data) => {
        const createdClient = await addClient(data);
        setProjectValue('client_id', createdClient.id, { shouldValidate: true });
        setIsClientModalOpen(false);
        resetClientForm();
        addToast('Cliente añadido. Ahora puedes seleccionarlo.', 'success');
    };
    
    const openProjectModal = () => {
        resetProjectForm({
            name: '',
            client_id: clients[0]?.id || '',
            description: '',
            status: 'planning',
            start_date: new Date().toISOString().split('T')[0],
            due_date: '',
            budget_cents: 0,
        });
        setIsProjectModalOpen(true);
    };
    
    const calculateProjectCosts = (projectId: string) => {
        const projectTimeEntries = timeEntries.filter(entry => entry.project_id === projectId);
        const totalSeconds = projectTimeEntries.reduce((sum, entry) => sum + entry.duration_seconds, 0);
        const timeCosts = (totalSeconds / 3600) * profile.hourly_rate_cents;

        const projectExpenses = expenses.filter(e => e.project_id === projectId);
        const expenseCosts = projectExpenses.reduce((sum, e) => sum + e.amount_cents, 0);
        
        return timeCosts + expenseCosts;
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h1 className="text-2xl font-semibold text-white">Proyectos</h1>
                <div className="flex gap-2 items-center">
                    <div className="w-40">
                        <Select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as any)}
                            options={[
                                { value: 'all', label: 'Todos' },
                                { value: 'planning', label: 'Planificación' },
                                { value: 'in-progress', label: 'En Progreso' },
                                { value: 'completed', label: 'Completado' },
                                { value: 'on-hold', label: 'En Pausa' }
                            ]}
                        />
                    </div>
                    <Button onClick={openProjectModal}>Añadir Proyecto</Button>
                </div>
            </div>
            
            {filteredProjects.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredProjects.map(project => {
                        const totalCosts = project.budget_cents > 0 ? calculateProjectCosts(project.id) : 0;
                        const consumedPercentage = project.budget_cents > 0 ? (totalCosts / project.budget_cents) * 100 : 0;
                        
                        let progressBarColor = 'bg-green-600';
                        if (consumedPercentage > 90) {
                            progressBarColor = 'bg-red-600';
                        } else if (consumedPercentage > 75) {
                            progressBarColor = 'bg-yellow-500';
                        }

                        return (
                            <Card key={project.id} className="flex flex-col hover:border-primary-500/50 transition-colors" hoverable>
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <Link to={`/projects/${project.id}`} className="text-primary-400 text-lg font-semibold hover:underline pr-2">
                                            {project.name}
                                        </Link>
                                        <StatusChip type="project" status={project.status} />
                                    </div>
                                    <Link to={`/clients/${project.client_id}`} className="text-sm text-gray-400 hover:underline">{getClientById(project.client_id)?.name}</Link>
                                </CardHeader>
                                <CardContent className="flex-grow space-y-2 text-sm text-gray-300">
                                    <p>{project.description?.substring(0, 100) || 'Sin descripción.'}...</p>
                                </CardContent>
                                {project.budget_cents > 0 && (
                                    <div className="px-5 pb-4 text-sm">
                                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                                            <span>{formatCurrency(totalCosts)} / {formatCurrency(project.budget_cents)}</span>
                                            <span>{consumedPercentage.toFixed(0)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-700 rounded-full h-2">
                                            <div 
                                                className={`${progressBarColor} h-2 rounded-full`}
                                                style={{ width: `${Math.min(consumedPercentage, 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )}
                                <div className="p-4 border-t border-white/[0.06] flex items-center justify-between text-sm bg-white/[0.02]">
                                    <div>
                                        <p className="text-gray-400">Vencimiento</p>
                                        <p className="text-white font-medium">{project.due_date}</p>
                                    </div>
                                </div>
                            </Card>
                        )
                    })}
                </div>
            ) : (
                 <EmptyState
                    icon={BriefcaseIcon}
                    title="No hay proyectos"
                    message={filterStatus === 'all' ? "Aún no has creado ningún proyecto." : `No hay proyectos con el estado seleccionado.`}
                    action={filterStatus === 'all' ? { text: 'Crear Proyecto', onClick: openProjectModal } : undefined}
                />
            )}

            <Modal isOpen={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)} title="Añadir Nuevo Proyecto">
                <form onSubmit={handleProjectSubmit(onProjectSubmit)} className="space-y-4">
                    <Input label="Nombre del Proyecto" {...registerProject("name", { required: true })} error={projectErrors.name && "El nombre es obligatorio."}/>
                    <div>
                         <label className="block text-sm font-medium text-gray-300 mb-1">Cliente</label>
                         <div className="flex gap-2">
                            <div className="flex-1">
                                <Select 
                                    {...registerProject("client_id")}
                                    className="w-full"
                                >
                                    {clients.length === 0 && <option disabled value="">Crea un cliente primero</option>}
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </Select>
                            </div>
                            <Button type="button" variant="secondary" onClick={() => setIsClientModalOpen(true)}><PlusIcon className="w-4 h-4 mr-1" /> Nuevo</Button>
                         </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Descripción</label>
                         <textarea {...registerProject("description")} rows={4} className="block w-full px-3 py-2 rounded-lg border border-slate-800 text-sm bg-slate-950/40 text-slate-200 focus:border-primary/50 focus:ring-primary/20 hover:border-slate-700 focus:outline-none focus:ring-2 transition-all duration-200" />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <Input label="Fecha de Inicio" type="date" {...registerProject("start_date", { required: true })} error={projectErrors.start_date && "Campo requerido."} />
                        <Input label="Fecha de Entrega" type="date" {...registerProject("due_date", { required: true })} error={projectErrors.due_date && "Campo requerido."} />
                    </div>
                    <Input label="Presupuesto (€, opcional)" type="number" step="0.01" {...registerProject("budget_cents")} />
                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={isProjectSubmitting}>{isProjectSubmitting ? "Guardando..." : "Guardar Proyecto"}</Button>
                    </div>
                </form>
            </Modal>
            
            <Modal isOpen={isClientModalOpen} onClose={() => setIsClientModalOpen(false)} title="Añadir Nuevo Cliente">
                <form onSubmit={handleClientSubmit(onClientSubmit)} className="space-y-4">
                    <Input label="Nombre Completo" {...registerClient("name", { required: true })} error={clientErrors.name && "Campo requerido."} />
                    <Input label="Email" type="email" {...registerClient("email", { required: true, pattern: /^\S+@\S+$/i })} error={clientErrors.email && "Email no válido."} />
                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={isClientSubmitting}>{isClientSubmitting ? "Guardando..." : "Guardar Cliente"}</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default ProjectsPage;