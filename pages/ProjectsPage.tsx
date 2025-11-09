import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../hooks/useAppStore';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { Project, NewProject, NewClient } from '../types';
import { formatCurrency } from '../lib/utils';
import StatusChip from '../components/ui/StatusChip';
import EmptyState from '../components/ui/EmptyState';
import { BriefcaseIcon, PlusIcon } from '../components/icons/Icon';
import { useToast } from '../hooks/useToast';
import { validateEmail } from '../lib/utils';

const ProjectsPage: React.FC = () => {
    const { projects, clients, addProject, getClientById, addClient } = useAppStore();
    const { addToast } = useToast();
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [filterStatus, setFilterStatus] = useState<'all' | Project['status']>('all');
    const [clientEmailError, setClientEmailError] = useState('');

    const initialProjectState: NewProject = {
        name: '',
        client_id: clients[0]?.id || '',
        description: '',
        status: 'planning',
        start_date: new Date().toISOString().split('T')[0],
        due_date: '',
        budget_cents: 0,
    };
    const [newProject, setNewProject] = useState<NewProject>(initialProjectState);
    
    const initialClientState: NewClient = { name: '', company: '', email: '', phone: '' };
    const [newClient, setNewClient] = useState<NewClient>(initialClientState);

    const filteredProjects = useMemo(() => {
        if (filterStatus === 'all') return projects;
        return projects.filter(p => p.status === filterStatus);
    }, [projects, filterStatus]);

    const handleProjectInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setNewProject(prev => ({ ...prev, [name]: value }));
    };
    
    const handleClientInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewClient(prev => ({ ...prev, [name]: value }));
        if (name === 'email') {
            setClientEmailError('');
        }
    };

    const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewProject(prev => ({ ...prev, budget_cents: Math.round(Number(e.target.value) * 100) }));
    };

    const handleProjectSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProject.client_id) {
            addToast('Por favor, selecciona o crea un cliente.', 'error');
            return;
        }
        await addProject(newProject);
        setIsProjectModalOpen(false);
        setNewProject(initialProjectState);
        addToast('Proyecto añadido con éxito.', 'success');
    };

    const handleClientSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newClient.name && newClient.email) {
            if (!validateEmail(newClient.email)) {
                setClientEmailError('Por favor, introduce un correo electrónico válido.');
                return;
            }
            const createdClient = await addClient(newClient);
            setNewProject(prev => ({ ...prev, client_id: createdClient.id }));
            setIsClientModalOpen(false);
            setNewClient(initialClientState);
            addToast('Cliente añadido. Ahora puedes seleccionarlo.', 'success');
        }
    };
    
    const openProjectModal = () => {
        setNewProject({
            ...initialProjectState,
            client_id: clients[0]?.id || ''
        });
        setIsProjectModalOpen(true);
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h1 className="text-2xl font-semibold text-white">Proyectos</h1>
                <div className="flex gap-2">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="block px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-gray-800 text-white"
                    >
                        <option value="all">Todos</option>
                        <option value="planning">Planificación</option>
                        <option value="in-progress">En Progreso</option>
                        <option value="completed">Completado</option>
                        <option value="on-hold">En Pausa</option>
                    </select>
                    <Button onClick={openProjectModal}>Añadir Proyecto</Button>
                </div>
            </div>
            
            {filteredProjects.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredProjects.map(project => (
                        <Card key={project.id} className="flex flex-col hover:border-primary-500/50 transition-colors">
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
                            <div className="p-4 border-t border-gray-800 flex items-center justify-between text-sm">
                                <div>
                                    <p className="text-gray-400">Vencimiento</p>
                                    <p className="text-white font-medium">{project.due_date}</p>
                                </div>
                                {project.budget_cents > 0 && (
                                     <div>
                                        <p className="text-gray-400">Presupuesto</p>
                                        <p className="text-white font-semibold">{formatCurrency(project.budget_cents)}</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))}
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
                <form onSubmit={handleProjectSubmit} className="space-y-4">
                    <Input name="name" label="Nombre del Proyecto" value={newProject.name} onChange={handleProjectInputChange} required />
                    <div>
                         <label className="block text-sm font-medium text-gray-300 mb-1">Cliente</label>
                         <div className="flex gap-2">
                            <select name="client_id" value={newProject.client_id} onChange={handleProjectInputChange} className="flex-1 block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-gray-800 text-white">
                                {clients.length === 0 && <option disabled value="">Crea un cliente primero</option>}
                                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <Button type="button" variant="secondary" onClick={() => setIsClientModalOpen(true)}><PlusIcon className="w-4 h-4 mr-1" /> Nuevo</Button>
                         </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Descripción</label>
                         <textarea name="description" rows={4} value={newProject.description} onChange={handleProjectInputChange} className="block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-gray-800 text-white" />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <Input name="start_date" label="Fecha de Inicio" type="date" value={newProject.start_date} onChange={handleProjectInputChange} required />
                        <Input name="due_date" label="Fecha de Entrega" type="date" value={newProject.due_date} onChange={handleProjectInputChange} required />
                    </div>
                    <Input label="Presupuesto (€, opcional)" type="number" step="0.01" onChange={handleBudgetChange} />
                    <div className="flex justify-end pt-4">
                        <Button type="submit">Guardar Proyecto</Button>
                    </div>
                </form>
            </Modal>
            
            <Modal isOpen={isClientModalOpen} onClose={() => { setIsClientModalOpen(false); setClientEmailError(''); }} title="Añadir Nuevo Cliente">
                <form onSubmit={handleClientSubmit} className="space-y-4">
                    <Input name="name" label="Nombre Completo" value={newClient.name} onChange={handleClientInputChange} required />
                    <Input name="email" label="Email" type="email" value={newClient.email} onChange={handleClientInputChange} required error={clientEmailError} />
                    <div className="flex justify-end pt-4">
                        <Button type="submit">Guardar Cliente</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default ProjectsPage;