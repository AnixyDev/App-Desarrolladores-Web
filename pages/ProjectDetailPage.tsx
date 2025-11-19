
// pages/ProjectDetailPage.tsx
import React, { useState, useMemo, lazy, Suspense, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../hooks/useAppStore';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Textarea from '../components/ui/Textarea';
import { formatCurrency, generateICSFile } from '../lib/utils';
import { Project, Task, InvoiceItem, ProjectFile, ProjectChangeLog } from '../types';
import { PlusIcon, TrashIcon, ClockIcon, FileTextIcon, MessageSquareIcon, DollarSignIcon, Paperclip, Upload, Trash2, EditIcon, CalendarPlus, DownloadIcon, RefreshCwIcon, LinkIcon } from '../components/icons/Icon';
import EmptyState from '../components/ui/EmptyState';
import { useToast } from '../hooks/useToast';
import Modal from '../components/ui/Modal';
import { generateProjectBudgetPdf } from '../services/pdfService';

const ProjectChat = lazy(() => import('../components/ProjectChat'));
const ConfirmationModal = lazy(() => import('../components/modals/ConfirmationModal'));

const HistoryFeed: React.FC<{ logs: ProjectChangeLog[] }> = ({ logs }) => {
    if (logs.length === 0) return <p className="text-sm text-gray-500">No hay cambios registrados.</p>;

    const sortedLogs = [...logs].sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime());

    return (
        <div className="relative pl-4 border-l border-gray-700 space-y-6">
            {sortedLogs.map((log) => (
                <div key={log.id} className="relative">
                    <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-gray-900 bg-gray-500"></div>
                    <p className="text-sm text-gray-300">
                        <span className="font-semibold text-white">{log.field}</span>
                        {log.field === 'created' ? (
                            <span> {log.new_value}</span>
                        ) : (
                            <span> cambió de <span className="text-red-300 line-through">{log.old_value || '(vacío)'}</span> a <span className="text-green-400">{log.new_value}</span></span>
                        )}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        Por {log.changed_by} • {new Date(log.changed_at).toLocaleString()}
                    </p>
                </div>
            ))}
        </div>
    );
};

const ProjectDetailPage: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const { addToast } = useToast();

    const {
        getProjectById,
        getClientById,
        getTasksByProjectId,
        timeEntries,
        expenses,
        profile,
        addTask,
        updateTaskStatus,
        deleteTask,
        updateProject,
        updateProjectStatus,
        updateProjectBudget,
        projectFiles,
        addProjectFile,
        deleteProjectFile,
        projectLogs,
        fetchProjectLogs
    } = useAppStore();

    const [newTaskDescription, setNewTaskDescription] = useState('');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
    const [isDeleteFileModalOpen, setIsDeleteFileModalOpen] = useState(false);
    const [fileToDelete, setFileToDelete] = useState<ProjectFile | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [currentProjectForEdit, setCurrentProjectForEdit] = useState<Project | null>(null);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [linkInput, setLinkInput] = useState('');

    const project = projectId ? getProjectById(projectId) : undefined;
    const client = project ? getClientById(project.client_id) : undefined;
    const tasks = projectId ? getTasksByProjectId(projectId) : [];
    
    const [isEditingBudget, setIsEditingBudget] = useState(false);
    const [budgetInput, setBudgetInput] = useState(0);

    useEffect(() => {
        if (project) {
            setBudgetInput((project.budget_cents || 0) / 100);
        }
    }, [project]);

    useEffect(() => {
        if (projectId) {
            fetchProjectLogs(projectId);
        }
    }, [projectId, fetchProjectLogs]);

    const handleBudgetSave = async () => {
        if (project) {
            if (budgetInput < 0 || isNaN(budgetInput)) {
                addToast('El presupuesto debe ser un número válido y positivo.', 'error');
                return;
            }

            try {
                await updateProjectBudget(project.id, Math.round(budgetInput * 100));
                addToast('Presupuesto actualizado.', 'success');
                setIsEditingBudget(false);
            } catch (error) {
                addToast(`Error al actualizar el presupuesto: ${(error as Error).message}`, 'error');
            }
        }
    };

    const handleLinkSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (project) {
            try {
                await updateProject({ id: project.id, external_link: linkInput });
                addToast('Enlace externo añadido.', 'success');
                setIsLinkModalOpen(false);
            } catch (error) {
                addToast(`Error al añadir el enlace: ${(error as Error).message}`, 'error');
            }
        }
    };

    const projectTimeEntries = useMemo(() => {
        return timeEntries.filter(entry => entry.project_id === projectId);
    }, [timeEntries, projectId]);

    const unbilledTimeEntries = useMemo(() => {
        return projectTimeEntries.filter(entry => !entry.invoice_id);
    }, [projectTimeEntries]);

    const projectFilesForProject = useMemo(() => {
        return projectFiles.filter(file => file.project_id === projectId);
    }, [projectFiles, projectId]);

    const projectHistoryLogs = useMemo(() => {
        return projectLogs.filter(log => log.project_id === projectId);
    }, [projectLogs, projectId]);

    const projectStats = useMemo(() => {
        const completedTasks = tasks.filter(t => t.status === 'completed').length;
        const progress = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;
        const totalSeconds = projectTimeEntries.reduce((sum, entry) => sum + entry.duration_seconds, 0);
        const hoursTracked = totalSeconds / 3600;

        return {
            completedTasks,
            progress,
            hoursTracked
        };
    }, [tasks, projectTimeEntries]);
    
    const budgetStats = useMemo(() => {
        if (!project || !profile || project.budget_cents <= 0) {
            return null;
        }

        const projectExpensesCost = expenses
            .filter(e => e.project_id === project.id)
            .reduce((sum, e) => sum + e.amount_cents, 0);

        const totalSecondsTracked = projectTimeEntries.reduce((sum, entry) => sum + entry.duration_seconds, 0);
        const hourlyRate = profile.hourly_rate_cents;
        const projectTimeCost = (totalSecondsTracked / 3600) * hourlyRate;

        const totalCosts = projectExpensesCost + projectTimeCost;
        const consumedPercentage = (totalCosts / project.budget_cents) * 100;
        const remainingBudget = project.budget_cents - totalCosts;

        return {
            totalCosts,
            consumedPercentage,
            remainingBudget,
        };
    }, [project, expenses, projectTimeEntries, profile]);


    if (!project || !client) {
        return <div className="text-center text-red-500 mt-8">Proyecto o cliente no encontrado.</div>;
    }

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newTaskDescription.trim() && projectId) {
            try {
                await addTask({ project_id: projectId, description: newTaskDescription });
                addToast('Tarea añadida.', 'success');
                setNewTaskDescription('');
            } catch (error) {
                addToast(`Error al añadir la tarea: ${(error as Error).message}`, 'error');
            }
        }
    };

    const handleToggleTask = async (task: Task) => {
        const newStatus = task.status === 'completed' ? 'in-progress' : 'completed';
        try {
            await updateTaskStatus(task.id, newStatus);
            if (newStatus === 'completed') {
                addToast(`Tarea completada: "${task.description}"`, 'success');
            }
        } catch (error) {
            addToast(`Error al actualizar la tarea: ${(error as Error).message}`, 'error');
        }
    };

    const handleCreateInvoice = () => {
        navigate('/invoices/create', {
            state: {
                projectId: project.id,
                clientId: client.id
            }
        });
    };
    
    const handleCreateInvoiceFromBudget = () => {
        if (project.budget_cents > 0) {
            const budgetItem: InvoiceItem = {
                description: `Facturación basada en el presupuesto del proyecto: ${project.name}`,
                quantity: 1,
                price_cents: project.budget_cents
            };
            navigate('/invoices/create', {
                state: {
                    clientId: project.client_id,
                    projectId: project.id,
                    budgetItems: [budgetItem]
                }
            });
        }
    };

    const handleCreateInvoiceFromHours = () => {
        if (unbilledTimeEntries.length === 0) {
             addToast('No hay horas pendientes de facturar.', 'info');
             return;
        }
        navigate('/invoices/create', {
            state: {
                projectId: project.id,
                clientId: client.id,
                timeEntryIds: unbilledTimeEntries.map(e => e.id)
            }
        });
    };

    const handleDownloadBudget = async () => {
        if (project && client && profile) {
            try {
                await generateProjectBudgetPdf(project, client, profile);
                addToast('PDF del presupuesto descargado.', 'success');
            } catch (error) {
                addToast('Error al generar el PDF.', 'error');
                console.error(error);
            }
        }
    };

    const handleDeleteClick = (task: Task) => {
        setTaskToDelete(task);
        setIsConfirmModalOpen(true);
    };

    const confirmDelete = async () => {
        if (taskToDelete) {
            try {
                await deleteTask(taskToDelete.id);
                addToast('Tarea eliminada.', 'info');
            } catch (error) {
                addToast(`Error al eliminar la tarea: ${(error as Error).message}`, 'error');
            } finally {
                setIsConfirmModalOpen(false);
                setTaskToDelete(null);
            }
        }
    };
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            addProjectFile({
                project_id: project.id,
                fileName: file.name,
                fileType: file.type,
                url: '#', // En una app real, esta sería la URL de un servicio de almacenamiento
            });
            addToast(`Archivo "${file.name}" subido con éxito.`, 'success');
        }
    };

    const handleDeleteFileClick = (file: ProjectFile) => {
        setFileToDelete(file);
        setIsDeleteFileModalOpen(true);
    };

    const confirmDeleteFile = async () => {
        if (fileToDelete) {
            try {
                await deleteProjectFile(fileToDelete.id);
                addToast('Archivo eliminado.', 'info');
            } catch (error) {
                addToast(`Error al eliminar el archivo: ${(error as Error).message}`, 'error');
            } finally {
                setIsDeleteFileModalOpen(false);
                setFileToDelete(null);
            }
        }
    };
    
    const handleProjectAddToCalendar = () => {
        if (project && client) {
            const title = `Entrega Proyecto: ${project.name}`;
            const description = `Fecha de entrega final para el proyecto con el cliente ${client.name}.`;
            const eventDate = new Date(project.due_date);
            const filename = `entrega-proyecto-${project.name.replace(/\s+/g, '-')}`;
            generateICSFile(title, description, eventDate, filename);
            addToast('Evento de calendario del proyecto generado.', 'success');
        }
    };

    const openEditModal = () => {
        if (project) {
            setCurrentProjectForEdit({ ...project });
            setIsEditModalOpen(true);
        }
    };
    
    const handleUpdateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (currentProjectForEdit) {
            try {
                await updateProject(currentProjectForEdit as Project & { id: string });
                addToast('Proyecto actualizado con éxito.', 'success');
                setIsEditModalOpen(false);
            } catch (error) {
                addToast(`Error al actualizar: ${(error as Error).message}`, 'error');
            }
        }
    };

    const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setCurrentProjectForEdit(prev => prev ? { ...prev, [name]: value } : null);
    };

    const hoursTotalAmount = unbilledTimeEntries.reduce((sum, e) => sum + e.duration_seconds, 0) / 3600 * profile.hourly_rate_cents;


    return (
        <div className="space-y-6">
             <nav className="flex items-center text-sm text-gray-400">
                <Link to="/projects" className="hover:text-white transition-colors">Proyectos</Link>
                <span className="mx-2">/</span>
                <span className="text-white truncate max-w-[200px] sm:max-w-md">{project.name}</span>
            </nav>

            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">{project.name}</h1>
                    <Link to={`/clients/${client.id}`} className="text-lg text-primary-400 hover:underline">{client.name}</Link>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                     <Button onClick={() => setIsInvoiceModalOpen(true)}>
                        <FileTextIcon className="w-4 h-4 mr-2"/> Generar Factura
                    </Button>
                    {project.budget_cents > 0 && (
                         <Button variant="secondary" onClick={handleDownloadBudget} title="Descargar PDF del presupuesto">
                            <DownloadIcon className="w-4 h-4"/> PDF Presupuesto
                        </Button>
                    )}
                    {project.external_link ? (
                        <Button variant="secondary" as="a" href={project.external_link} target="_blank" rel="noopener noreferrer">
                            <LinkIcon className="w-4 h-4 mr-2"/> Ver Recurso
                        </Button>
                    ) : (
                        <Button variant="secondary" onClick={() => setIsLinkModalOpen(true)}>
                            <LinkIcon className="w-4 h-4 mr-2"/> Añadir Enlace
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader className="flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-white">Detalles del Proyecto</h2>
                             <Button variant="secondary" size="sm" onClick={openEditModal}><EditIcon className="w-4 h-4" /></Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-400 block">Estado</label>
                                <Select 
                                    value={project.status} 
                                    onChange={(e) => updateProjectStatus(project.id, e.target.value as Project['status'])}
                                    className="mt-1"
                                >
                                    <option value="planning">Planificación</option>
                                    <option value="in-progress">En Progreso</option>
                                    <option value="completed">Completado</option>
                                    <option value="on-hold">En Pausa</option>
                                </Select>
                            </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-400">Categoría</p>
                                    <p className="text-white">{project.category || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-400">Prioridad</p>
                                    <p className="text-white">{project.priority || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-400">Fecha de Inicio</p>
                                    <p className="text-white">{project.start_date || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-400">Fecha de Entrega</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-white">{project.due_date}</p>
                                        <button onClick={handleProjectAddToCalendar} title="Añadir al Calendario" className="text-gray-400 hover:text-primary-400">
                                            <CalendarPlus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-400 block">Presupuesto</label>
                                {isEditingBudget ? (
                                    <div className="flex items-center gap-2 mt-1">
                                        <Input
                                            type="number"
                                            value={budgetInput}
                                            onChange={(e) => setBudgetInput(Number(e.target.value))}
                                            className="w-32 py-1"
                                            step="0.01"
                                            min={0}
                                            autoFocus
                                        />
                                        <Button size="sm" onClick={handleBudgetSave}>Guardar</Button>
                                        <Button size="sm" variant="secondary" onClick={() => {
                                            setIsEditingBudget(false);
                                            setBudgetInput(project ? (project.budget_cents || 0) / 100 : 0);
                                        }}>Cancelar</Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 mt-1 group cursor-pointer" onClick={() => setIsEditingBudget(true)}>
                                        <p className="text-white font-semibold">{formatCurrency(project.budget_cents)}</p>
                                        <EditIcon className="w-4 h-4 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                )}
                            </div>
                             <div>
                                <p className="text-sm font-medium text-gray-400">Progreso de Tareas</p>
                                <div className="w-full bg-gray-700 rounded-full h-2.5 mt-1">
                                    <div className="bg-primary-600 h-2.5 rounded-full" style={{ width: `${projectStats.progress}%` }}></div>
                                </div>
                                 <p className="text-xs text-right text-gray-400 mt-1">{projectStats.completedTasks} de {tasks.length} completadas</p>
                            </div>
                             <div>
                                <p className="text-sm font-medium text-gray-400 flex items-center gap-2"><ClockIcon className="w-4 h-4"/> Horas Registradas</p>
                                <p className="text-2xl font-bold text-white mt-1">{projectStats.hoursTracked.toFixed(2)}h</p>
                            </div>
                        </CardContent>
                    </Card>

                    {budgetStats && project.budget_cents > 0 && (
                        <Card>
                            <CardHeader>
                                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <DollarSignIcon className="w-5 h-5"/> Control Presupuestario
                                </h2>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-300">Consumido</span>
                                        <span className="font-semibold text-white">{formatCurrency(budgetStats.totalCosts)}</span>
                                    </div>
                                    <div className="w-full bg-gray-700 rounded-full h-4">
                                        <div 
                                            className={`h-4 rounded-full text-center text-xs text-white font-bold transition-all duration-500 ${
                                                budgetStats.consumedPercentage > 90 ? 'bg-red-600' :
                                                budgetStats.consumedPercentage > 75 ? 'bg-yellow-500' :
                                                'bg-green-600'
                                            }`} 
                                            style={{ width: `${Math.min(budgetStats.consumedPercentage, 100)}%` }}
                                        >
                                            {budgetStats.consumedPercentage.toFixed(0)}%
                                        </div>
                                    </div>
                                    <div className="flex justify-between text-sm mt-1">
                                        <span className="text-gray-400">Restante: {formatCurrency(budgetStats.remainingBudget)}</span>
                                        <span className="text-gray-400">Total: {formatCurrency(project.budget_cents)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                <RefreshCwIcon className="w-5 h-5"/> Historial de Cambios
                            </h2>
                        </CardHeader>
                        <CardContent className="max-h-64 overflow-y-auto pr-2">
                            <HistoryFeed logs={projectHistoryLogs} />
                        </CardContent>
                    </Card>
                </div>

                <Card className="lg:col-span-2">
                    <CardHeader>
                        <h2 className="text-lg font-semibold text-white">Tareas del Proyecto</h2>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddTask} className="flex gap-2 mb-4">
                            <Input
                                wrapperClassName="flex-1"
                                placeholder="Añadir nueva tarea..."
                                value={newTaskDescription}
                                onChange={(e) => setNewTaskDescription(e.target.value)}
                            />
                            <Button type="submit" aria-label="Añadir nueva tarea"><PlusIcon className="w-5 h-5"/></Button>
                        </form>
                        {tasks.length > 0 ? (
                            <ul className="space-y-2 max-h-96 overflow-y-auto pr-2">
                                {tasks.map(task => (
                                    <li key={task.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => handleToggleTask(task)} aria-label={task.status === 'completed' ? `Marcar tarea '${task.description}' como incompleta` : `Marcar tarea '${task.description}' como completada`}>
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${task.status === 'completed' ? 'border-primary-500 bg-primary-500' : 'border-gray-500'}`}>
                                                    {task.status === 'completed' && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                                </div>
                                            </button>
                                            <span className={` ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-white'}`}>{task.description}</span>
                                        </div>
                                        <Button size="sm" variant="danger" onClick={() => handleDeleteClick(task)} aria-label={`Eliminar tarea '${task.description}'`}>
                                            <TrashIcon className="w-4 h-4"/>
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <EmptyState
                                icon={FileTextIcon}
                                title="No hay tareas"
                                message="Aún no has añadido ninguna tarea a este proyecto. ¡Añade la primera para empezar a organizarte!"
                            />
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Paperclip className="w-5 h-5"/> Archivos del Proyecto
                    </h2>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="w-4 h-4 mr-2" /> Subir Archivo
                    </Button>
                </CardHeader>
                <CardContent>
                    {projectFilesForProject.length > 0 ? (
                        <ul className="space-y-2">
                            {projectFilesForProject.map(file => (
                                <li key={file.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800">
                                    <div>
                                        <p className="font-medium text-white">{file.fileName}</p>
                                        <p className="text-xs text-gray-400">Subido el {new Date(file.uploadedAt).toLocaleDateString()}</p>
                                    </div>
                                    <Button size="sm" variant="danger" onClick={() => handleDeleteFileClick(file)} aria-label={`Eliminar archivo ${file.fileName}`}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <EmptyState 
                            icon={Paperclip}
                            title="Sin archivos adjuntos"
                            message="Sube documentos, maquetas o cualquier archivo relevante para el proyecto."
                        />
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <MessageSquareIcon className="w-5 h-5"/> Canal del Proyecto
                    </h2>
                </CardHeader>
                <CardContent>
                    <Suspense fallback={<div className="h-[500px] flex items-center justify-center text-gray-400">Cargando chat...</div>}>
                        <ProjectChat projectId={project.id} />
                    </Suspense>
                </CardContent>
            </Card>

            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Editar Detalles del Proyecto">
                {currentProjectForEdit && (
                    <form onSubmit={handleUpdateProject} className="space-y-4">
                        <Input 
                            label="Nombre del Proyecto"
                            name="name" 
                            value={currentProjectForEdit.name} 
                            onChange={handleEditInputChange}
                            required 
                        />
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Descripción</label>
                            <Textarea 
                                name="description"
                                rows={4} 
                                value={currentProjectForEdit.description || ''}
                                onChange={handleEditInputChange}
                            />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Fecha de Inicio"
                                name="start_date"
                                type="date"
                                value={currentProjectForEdit.start_date}
                                onChange={handleEditInputChange}
                            />
                            <Input
                                label="Fecha de Entrega"
                                name="due_date"
                                type="date"
                                value={currentProjectForEdit.due_date}
                                onChange={handleEditInputChange}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Estado</label>
                            <Select
                                name="status"
                                value={currentProjectForEdit.status}
                                onChange={handleEditInputChange}
                            >
                                <option value="planning">Planificación</option>
                                <option value="in-progress">En Progreso</option>
                                <option value="completed">Completado</option>
                                <option value="on-hold">En Pausa</option>
                            </Select>
                        </div>

                         <div className="grid grid-cols-2 gap-4">
                            <Input 
                                label="Categoría"
                                name="category"
                                value={currentProjectForEdit.category || ''} 
                                onChange={handleEditInputChange}
                            />
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Prioridad</label>
                                <Select
                                    name="priority"
                                    value={currentProjectForEdit.priority || 'Medium'}
                                    onChange={handleEditInputChange}
                                >
                                    <option value="Low">Baja</option>
                                    <option value="Medium">Media</option>
                                    <option value="High">Alta</option>
                                </Select>
                            </div>
                        </div>

                        <Input 
                            label="Enlace Externo (Repositorio, Figma...)"
                            name="external_link"
                            type="url"
                            value={currentProjectForEdit.external_link || ''} 
                            onChange={handleEditInputChange}
                            placeholder="https://..."
                        />

                        <div className="flex justify-end pt-4">
                            <Button type="submit">Guardar Cambios</Button>
                        </div>
                    </form>
                )}
            </Modal>
            
            <Modal isOpen={isInvoiceModalOpen} onClose={() => setIsInvoiceModalOpen(false)} title="Generar Factura">
                <div className="space-y-3">
                    {project.budget_cents > 0 && (
                        <Button variant="secondary" className="w-full justify-start" onClick={handleCreateInvoiceFromBudget}>
                            <DollarSignIcon className="w-5 h-5 mr-3 text-green-400"/>
                            <div className="text-left">
                                <span className="block font-medium">Facturar Presupuesto</span>
                                <span className="text-xs text-gray-400">Importe: {formatCurrency(project.budget_cents)}</span>
                            </div>
                        </Button>
                    )}
                    {unbilledTimeEntries.length > 0 && (
                        <Button variant="secondary" className="w-full justify-start" onClick={handleCreateInvoiceFromHours}>
                            <ClockIcon className="w-5 h-5 mr-3 text-purple-400"/>
                            <div className="text-left">
                                <span className="block font-medium">Facturar Horas Pendientes</span>
                                <span className="text-xs text-gray-400">Total: {(projectStats.hoursTracked).toFixed(2)}h (~{formatCurrency(hoursTotalAmount)})</span>
                            </div>
                        </Button>
                    )}
                    <Button variant="secondary" className="w-full justify-start" onClick={handleCreateInvoice}>
                        <FileTextIcon className="w-5 h-5 mr-3 text-blue-400"/>
                        <div className="text-left">
                            <span className="block font-medium">Factura en Blanco</span>
                            <span className="text-xs text-gray-400">Crear una factura desde cero</span>
                        </div>
                    </Button>
                </div>
            </Modal>

            <Modal isOpen={isLinkModalOpen} onClose={() => setIsLinkModalOpen(false)} title="Añadir Enlace Externo">
                <form onSubmit={handleLinkSave} className="space-y-4">
                     <Input 
                        label="URL del recurso"
                        value={linkInput}
                        type="url"
                        onChange={(e) => setLinkInput(e.target.value)}
                        placeholder="https://github.com/..."
                        required
                        autoFocus
                    />
                     <div className="flex justify-end pt-4">
                        <Button type="submit">Guardar Enlace</Button>
                    </div>
                </form>
            </Modal>

            <Suspense fallback={null}>
                {isConfirmModalOpen && (
                    <ConfirmationModal 
                        isOpen={isConfirmModalOpen}
                        onClose={() => setIsConfirmModalOpen(false)}
                        onConfirm={confirmDelete}
                        title="¿Eliminar Tarea?"
                        message={`¿Estás seguro de que quieres eliminar la tarea: "${taskToDelete?.description}"?`}
                    />
                )}
                {isDeleteFileModalOpen && (
                    <ConfirmationModal 
                        isOpen={isDeleteFileModalOpen}
                        onClose={() => setIsDeleteFileModalOpen(false)}
                        onConfirm={confirmDeleteFile}
                        title="¿Eliminar Archivo?"
                        message={`¿Estás seguro de que quieres eliminar el archivo: "${fileToDelete?.fileName}"?`}
                    />
                )}
            </Suspense>
        </div>
    );
};

export default ProjectDetailPage;
