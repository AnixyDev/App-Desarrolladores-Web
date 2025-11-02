
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../hooks/useAppStore.tsx';
import Card, { CardContent, CardHeader } from '../components/ui/Card.tsx';
import Button from '../components/ui/Button.tsx';
import Modal from '../components/ui/Modal.tsx';
import Input from '../components/ui/Input.tsx';
import { Client, NewClient } from '../types.ts';
import { EditIcon, TrashIcon, PhoneIcon, MailIcon, UsersIcon } from '../components/icons/Icon.tsx';
import { useToast } from '../hooks/useToast.ts';
import EmptyState from '../components/ui/EmptyState.tsx';
import UpgradePromptModal from '../components/modals/UpgradePromptModal.tsx';


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
    const [formData, setFormData] = useState<NewClient | Client>(initialClientState);
    const [editingClient, setEditingClient] = useState<Client | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.name && formData.email) {
            if (editingClient) {
                updateClient(formData as Client);
                addToast('Cliente actualizado con éxito', 'success');
            } else {
                addClient(formData as NewClient);
                addToast('Cliente añadido con éxito', 'success');
            }
            closeModal();
        }
    };

    const handleDelete = (id: string, name: string) => {
        if (window.confirm(`¿Estás seguro? Se eliminarán todos los datos asociados a "${name}" (proyectos, facturas, etc.).`)) {
            deleteClient(id);
            addToast(`Cliente "${name}" eliminado`, 'info');
        }
    }

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h1 className="text-2xl font-semibold text-white">Clientes</h1>
                <Button onClick={handleOpenAddModal}>Añadir Cliente</Button>
            </div>
            
            {clients.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {clients.map(client => (
                        <Card key={client.id} className="flex flex-col">
                            <CardHeader>
                                <Link to={`/clients/${client.id}`} className="text-primary-400 text-lg font-semibold hover:underline">
                                    {client.name}
                                </Link>
                                <p className="text-sm text-gray-400">{client.company}</p>
                            </CardHeader>
                            <CardContent className="flex-grow space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <MailIcon className="w-4 h-4 text-gray-500" />
                                    <span className="text-gray-300">{client.email}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <PhoneIcon className="w-4 h-4 text-gray-500" />
                                    <span className="text-gray-300">{client.phone || 'N/A'}</span>
                                </div>
                            </CardContent>
                            <div className="p-4 border-t border-gray-800 flex items-center justify-end gap-2">
                                <Button as="a" href={`mailto:${client.email}`} size="sm" variant="secondary" title="Enviar Email" aria-label={`Enviar email a ${client.name}`}><MailIcon className="w-4 h-4" /></Button>
                                <Button as="a" href={`tel:${client.phone}`} size="sm" variant="secondary" title="Llamar" aria-label={`Llamar a ${client.name}`}><PhoneIcon className="w-4 h-4" /></Button>
                                <Button onClick={() => openEditModal(client)} size="sm" variant="secondary" title="Editar" aria-label={`Editar cliente ${client.name}`}><EditIcon className="w-4 h-4" /></Button>
                                <Button onClick={() => handleDelete(client.id, client.name)} size="sm" variant="secondary" className="text-red-400 hover:bg-red-500/20 hover:text-red-300" title="Eliminar" aria-label={`Eliminar cliente ${client.name}`}><TrashIcon className="w-4 h-4" /></Button>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <EmptyState
                    icon={UsersIcon}
                    title="No tienes clientes"
                    message="Aún no has añadido ningún cliente. ¡Empieza por añadir el primero para organizar tus proyectos!"
                    action={{ text: 'Añadir Cliente', onClick: handleOpenAddModal }}
                />
            )}


            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingClient ? "Editar Cliente" : "Añadir Nuevo Cliente"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input name="name" label="Nombre Completo" value={formData.name} onChange={handleInputChange} required />
                    <Input name="company" label="Empresa (Opcional)" value={formData.company} onChange={handleInputChange} />
                    <Input name="email" label="Email" type="email" value={formData.email} onChange={handleInputChange} required />
                    <Input name="phone" label="Teléfono (Opcional)" value={formData.phone} onChange={handleInputChange} />
                    <div className="flex justify-end pt-4">
                        <Button type="submit">Guardar Cliente</Button>
                    </div>
                </form>
            </Modal>
            
            <UpgradePromptModal 
                isOpen={isUpgradeModalOpen} 
                onClose={() => setIsUpgradeModalOpen(false)}
                featureName="clientes"
            />
        </div>
    );
};

export default ClientsPage;