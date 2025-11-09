// pages/ClientsPage.tsx
import React, { useState, lazy, Suspense, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../hooks/useAppStore';
import Card, { CardContent, CardHeader, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { Client, NewClient } from '../types';
import { EditIcon, TrashIcon, PhoneIcon, MailIcon, Users as UsersIcon, SearchIcon, DownloadIcon } from '../components/icons/Icon';
import { useToast } from '../hooks/useToast';
import EmptyState from '../components/ui/EmptyState';
import { validateEmail } from '../lib/utils';

const UpgradePromptModal = lazy(() => import('../components/modals/UpgradePromptModal'));
const ConfirmationModal = lazy(() => import('../components/modals/ConfirmationModal'));


const initialClientState: NewClient = {
    name: '',
    company: '',
    email: '',
    phone: '',
};

const ClientsPage: React.FC = () => {
    const { clients, addClient, updateClient, deleteClient, profile } = useAppStore();
    const { addToast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
    const [formData, setFormData] = useState<NewClient | Client>(initialClientState);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [emailError, setEmailError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const filteredClients = useMemo(() => {
        if (!searchTerm) return clients;
        return clients.filter(client => 
            client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.company.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [clients, searchTerm]);


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (name === 'email') {
            setEmailError('');
        }
    };

    const handleOpenAddModal = () => {
        if (profile.plan === 'Free' && clients.length >= 1) {
            setIsUpgradeModalOpen(true);
        } else {
            setEditingClient(null);
            setFormData(initialClientState);
            setIsModalOpen(true);
        }
    };
    
    const openEditModal = (client: Client) => {
        setEditingClient(client);
        setFormData(client);
        setIsModalOpen(true);
    }
    
    const closeModal = () => {
        setIsModalOpen(false);
        setEditingClient(null);
        setFormData(initialClientState);
        setEmailError('');
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateEmail(formData.email)) {
            setEmailError('Por favor, introduce un correo electrónico válido.');
            return;
        }

        setIsSubmitting(true);
        try {
            if (editingClient) {
                await updateClient(formData as Client);
                addToast('Cliente actualizado con éxito', 'success');
            } else {
                await addClient(formData as NewClient);
                addToast('Cliente añadido con éxito', 'success');
            }
            closeModal();
        } catch (error) {
            addToast(`Error: ${(error as Error).message}`, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = (client: Client) => {
        setClientToDelete(client);
        setIsConfirmModalOpen(true);
    };

    const confirmDelete = async () => {
        if (clientToDelete) {
            try {
                await deleteClient(clientToDelete.id);
                addToast(`Cliente "${clientToDelete.name}" eliminado`, 'info');
            } catch(error) {
                addToast(`Error al eliminar: ${(error as Error).message}`, 'error');
            } finally {
                setIsConfirmModalOpen(false);
                setClientToDelete(null);
            }
        }
    };

    const handleExportCSV = () => {
        if (filteredClients.length === 0) {
            addToast('No hay clientes para exportar.', 'info');
            return;
        }

        const sortedClients = [...filteredClients].sort((a, b) => a.name.localeCompare(b.name));

        const headers = ['id', 'name', 'company', 'email', 'phone'];
        
        const escapeCSV = (field: string | null | undefined): string => {
            if (field === null || field === undefined) return '';
            const str = String(field);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        const csvContent = [
            headers.join(','),
            ...sortedClients.map(client => 
                [
                    escapeCSV(client.id),
                    escapeCSV(client.name),
                    escapeCSV(client.company),
                    escapeCSV(client.email),
                    escapeCSV(client.phone),
                ].join(',')
            )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        const date = new Date().toISOString().split('T')[0];
        link.setAttribute('download', `clientes_devfreelancer_${date}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        addToast('Lista de clientes exportada a CSV.', 'success');
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div className="flex-1">
                    <h1 className="text-2xl font-semibold text-white">Clientes</h1>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                     <Input 
                        wrapperClassName="flex-1"
                        placeholder="Buscar cliente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        icon={<SearchIcon className="w-5 h-5 text-gray-400" />}
                    />
                    <Button variant="secondary" onClick={handleExportCSV} aria-label="Exportar a CSV">
                        <DownloadIcon className="w-4 h-4" />
                    </Button>
                    <Button onClick={handleOpenAddModal}>Añadir Cliente</Button>
                </div>
            </div>
            
            {clients.length === 0 ? (
                 <EmptyState
                    icon={UsersIcon}
                    title="No tienes clientes"
                    message="Aún no has añadido ningún cliente. ¡Empieza por añadir el primero para organizar tus proyectos!"
                    action={{ text: 'Añadir Cliente', onClick: handleOpenAddModal }}
                />
            ) : filteredClients.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredClients.map(client => (
                        <Card key={client.id} className="flex flex-col">
                            <CardHeader>
                                <Link to={`/clients/${client.id}`} className="text-primary-400 text-lg font-semibold hover:underline">
                                    {client.name}
                                </Link>
                                <p className="text-sm text-gray-400">{client.company}</p>
                            </CardHeader>
                            <CardContent className="flex-grow space-y-3 text-sm">
                                <div className="flex items-center gap-2">
                                    <MailIcon className="w-4 h-4 text-gray-500" />
                                    <a href={`mailto:${client.email}`} className="text-gray-300 hover:text-white truncate">{client.email}</a>
                                </div>
                                <div className="flex items-center gap-2">
                                    <PhoneIcon className="w-4 h-4 text-gray-500" />
                                    <a href={`tel:${client.phone}`} className="text-gray-300 hover:text-white">{client.phone || 'N/A'}</a>
                                </div>
                            </CardContent>
                            <CardFooter className="flex items-center justify-end gap-2">
                                <Button onClick={() => openEditModal(client)} size="sm" variant="secondary" title="Editar" aria-label={`Editar cliente ${client.name}`}><EditIcon className="w-4 h-4" /></Button>
                                <Button onClick={() => handleDelete(client)} size="sm" variant="danger" title="Eliminar" aria-label={`Eliminar cliente ${client.name}`}><TrashIcon className="w-4 h-4" /></Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                <EmptyState
                    icon={SearchIcon}
                    title="No se encontraron clientes"
                    message={`No hay clientes que coincidan con "${searchTerm}".`}
                />
            )}


            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingClient ? "Editar Cliente" : "Añadir Nuevo Cliente"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input name="name" label="Nombre Completo" value={formData.name} onChange={handleInputChange} required />
                    <Input name="company" label="Empresa (Opcional)" value={formData.company} onChange={handleInputChange} />
                    <Input name="email" label="Email" type="email" value={formData.email} onChange={handleInputChange} required error={emailError} />
                    <Input name="phone" label="Teléfono (Opcional)" value={formData.phone} onChange={handleInputChange} />
                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Guardando...' : 'Guardar Cliente'}
                        </Button>
                    </div>
                </form>
            </Modal>
            
            <Suspense fallback={null}>
                {isUpgradeModalOpen && (
                    <UpgradePromptModal 
                        isOpen={isUpgradeModalOpen} 
                        onClose={() => setIsUpgradeModalOpen(false)}
                        featureName="clientes"
                    />
                )}
                {isConfirmModalOpen && (
                    <ConfirmationModal 
                        isOpen={isConfirmModalOpen}
                        onClose={() => setIsConfirmModalOpen(false)}
                        onConfirm={confirmDelete}
                        title="¿Eliminar Cliente?"
                        message={`¿Estás seguro? Se eliminarán permanentemente todos los datos asociados a "${clientToDelete?.name}", incluyendo proyectos, facturas y gastos. Esta acción no se puede deshacer.`}
                    />
                )}
            </Suspense>
        </div>
    );
};

export default ClientsPage;