
import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../hooks/useAppStore.tsx';
import Card, { CardContent, CardHeader } from '../components/ui/Card.tsx';
import Button from '../components/ui/Button.tsx';
import Input from '../components/ui/Input.tsx';
import { formatCurrency } from '../lib/utils.ts';
import { Project } from '../types.ts';
import { PlusIcon, TrashIcon, ClockIcon, FileTextIcon, MessageSquareIcon } from '../components/icons/Icon.tsx';
import ProjectChat from '../components/ProjectChat.tsx';

const ProjectDetailPage: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();

    const {
        getProjectById,
        getClientById,
        getTasksByProjectId,
        timeEntries,
        addTask,
        toggleTask,
        deleteTask,
        updateProjectStatus
    } = useAppStore();

    const [newTaskDescription, setNewTaskDescription] = useState('');

    const project = projectId ? getProjectById(projectId) : undefined;
    const client = project ? getClientById(project.client_id) : undefined;
    const tasks = projectId ? getTasksByProjectId(projectId) : [];
    
    const projectTimeEntries = useMemo(() => {
        return timeEntries.filter(entry => entry.project_id === projectId);
    }, [timeEntries, projectId]);

    const projectStats = useMemo(() => {
        const completedTasks = tasks.filter(t => t.completed).length;
        const progress = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;
        const totalSeconds = projectTimeEntries.reduce((sum, entry) => sum + entry.duration_seconds, 0);
        const hoursTracked = totalSeconds / 3600;

        return {
            completedTasks,
            progress,
            hoursTracked
        };
    }, [tasks, projectTimeEntries]);

    if (!project || !client) {
        return <div className="text-center text-red-500 mt-8">Proyecto o cliente no encontrado.</div>;
    }

    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (newTaskDescription.trim() && projectId) {
            addTask({ project_id: projectId, description: newTaskDescription });
            setNewTaskDescription('');
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

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">{project.name}</h1>
                    <Link to={`/clients/${client.id}`} className="text-lg text-primary-400 hover:underline">{client.name}</Link>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="secondary" onClick={handleCreateInvoice}>
                        <FileTextIcon className="w-4 h-4 mr-2"/> Crear Factura
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Project Info Card */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <h2 className="text-lg font-semibold text-white">Detalles del Proyecto</h2>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-400 block">Estado</label>
                            <select 
                                value={project.status} 
                                onChange={(e) => updateProjectStatus(project.id, e.target.value as Project['status'])}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-600 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md bg-gray-800 text-white"
                            >
                                <option value="planning">Planificación</option>
                                <option value="in-progress">En Progreso</option>
                                <option value="completed">Completado</option>
                                <option value="on-hold">En Pausa</option>
                            </select>
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
                                <p className="text-white">{project.due_date}</p>
                            </div>
                        </div>
                        {project.budget_cents > 0 && (
                            <div>
                                <p className="text-sm font-medium text-gray-400">Presupuesto</p>
                                <p className="text-white font-semibold">{formatCurrency(project.budget_cents)}</p>
                            </div>
                        )}
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

                {/* Tasks Card */}
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
                        <ul className="space-y-2 max-h-96 overflow-y-auto pr-2">
                            {tasks.map(task => (
                                <li key={task.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => toggleTask(task.id)} aria-label={task.completed ? `Marcar tarea '${task.description}' como incompleta` : `Marcar tarea '${task.description}' como completada`}>
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${task.completed ? 'border-primary-500 bg-primary-500' : 'border-gray-500'}`}>
                                                {task.completed && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                            </div>
                                        </button>
                                        <span className={` ${task.completed ? 'line-through text-gray-500' : 'text-white'}`}>{task.description}</span>
                                    </div>
                                    <Button size="sm" variant="secondary" onClick={() => deleteTask(task.id)} className="text-red-400 hover:bg-red-500/20" aria-label={`Eliminar tarea '${task.description}'`}>
                                        <TrashIcon className="w-4 h-4"/>
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </div>

            {/* Chat Card */}
            <Card>
                <CardHeader>
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <MessageSquareIcon className="w-5 h-5"/> Canal del Proyecto
                    </h2>
                </CardHeader>
                <CardContent>
                    <ProjectChat projectId={project.id} />
                </CardContent>
            </Card>
        </div>
    );
};

export default ProjectDetailPage;