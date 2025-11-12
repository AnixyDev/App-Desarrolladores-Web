import React, { useState, lazy, Suspense } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Users, UserPlus, Trash2, MailIcon as Mail, X, UserIcon as User, RefreshCwIcon } from '../components/icons/Icon';
import { useAppStore } from '../hooks/useAppStore';
import { UserData } from '../types';
import { useToast } from '../hooks/useToast';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';

const ConfirmationModal = lazy(() => import('../components/modals/ConfirmationModal'));

const roles: UserData['role'][] = [
  'Developer', 
  'Manager', 
  'Admin',
];

interface NewMember {
    name: string;
    email: string;
    role: UserData['role'];
}

const TeamManagementDashboard: React.FC = () => {
  const { users, inviteUser, deleteUser, profile } = useAppStore();
  const { addToast } = useToast();
  
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<UserData | null>(null);
  
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<NewMember>({
    defaultValues: {
      name: '',
      email: '',
      role: 'Developer'
    }
  });

  const onInviteSubmit: SubmitHandler<NewMember> = async (data) => {
    try {
      await inviteUser(data.name, data.email, data.role);
      
      const invitationLink = `${window.location.origin}/#/auth/register`;
      const subject = `Has sido invitado al equipo de ${profile.business_name} en DevFreelancer`;
      const html = `<h1>¡Hola ${data.name}!</h1><p>Has sido invitado a unirte al equipo de <strong>${profile.business_name}</strong> en DevFreelancer con el rol de ${data.role}.</p><p><a href="${invitationLink}">Haz clic aquí para crear tu cuenta y aceptar la invitación.</a></p>`;

      const response = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: data.email, subject, html }),
      });

      if (!response.ok) {
        throw new Error('El servidor de correo no respondió correctamente.');
      }

      addToast(`Invitación enviada a ${data.email}`, 'success');
      reset();
      setShowInviteModal(false);

    } catch (error) {
      addToast(`Error: ${(error as Error).message}`, 'error');
    }
  };

  const handleDelete = (member: UserData) => {
    setMemberToDelete(member);
    setIsConfirmModalOpen(true);
  };
  
  const confirmDelete = async () => {
      if (memberToDelete) {
          try {
              await deleteUser(memberToDelete.id);
              addToast(`Miembro "${memberToDelete.name}" eliminado.`, 'info');
          } catch (error) {
              addToast(`Error al eliminar: ${(error as Error).message}`, 'error');
          } finally {
              setIsConfirmModalOpen(false);
              setMemberToDelete(null);
          }
      }
  };
  
  const getStatusStyle = (status: UserData['status']) => {
    switch (status) {
      case 'Activo': return 'bg-green-900/50 text-green-400 border border-green-700';
      case 'Pendiente': return 'bg-yellow-900/50 text-yellow-400 border border-yellow-700';
      case 'Inactivo': return 'bg-gray-700/50 text-gray-400 border border-gray-600';
      default: return 'bg-gray-700/50 text-gray-400 border border-gray-600';
    }
  };

  const InviteMemberModal = () => (
    <Modal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)} title="Invitar Nuevo Miembro">
        <form onSubmit={handleSubmit(onInviteSubmit)} className="space-y-4">
            <Input
              label="Nombre Completo"
              {...register("name", { required: "El nombre es obligatorio." })}
              error={errors.name?.message}
            />
            <Input
              label="Correo Electrónico"
              type="email"
              {...register("email", { 
                  required: "El email es obligatorio.",
                  pattern: { value: /^\S+@\S+$/i, message: "Email no válido."}
              })}
              error={errors.email?.message}
            />
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Rol y Permisos</label>
            <select
              {...register("role")}
              className="w-full px-3 py-2 bg-slate-800 text-white rounded-md border border-slate-600 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
            >
              {roles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-2">El rol define su acceso a Facturación, Proyectos y CRM.</p>
          </div>
          
          <div className="pt-4 flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center"
            >
              {isSubmitting ? (
                <RefreshCwIcon className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Mail className="w-5 h-5 mr-2" />
              )}
              {isSubmitting ? 'Enviando...' : 'Invitar y Enviar Email'}
            </Button>
          </div>
        </form>
    </Modal>
  );

  return (
    <div className="min-h-screen bg-slate-950 p-4 sm:p-8">
      <InviteMemberModal />

      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
          <h1 className="text-3xl font-bold text-white flex items-center">
            <Users className="w-7 h-7 text-primary-400 mr-3" />
            DevFreelancer Teams
          </h1>
          <Button
            onClick={() => { reset(); setShowInviteModal(true); }}
            className="flex items-center"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Invitar Miembro
          </Button>
        </header>

        <div className="bg-slate-900 rounded-xl p-6 shadow-xl border border-slate-800">
          <h2 className="text-xl font-semibold text-white mb-4 border-b border-slate-800 pb-2">Miembros del Equipo ({users.length})</h2>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left">
              <thead className="text-xs text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="p-4">Miembro</th>
                  <th className="p-4">Rol</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4">Invitado el</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map(member => (
                  <tr key={member.id} className="border-t border-slate-800">
                    <td className="p-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center mr-3">
                          <User className="text-primary-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-white">{member.name}</p>
                          <p className="text-sm text-slate-400">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                        <p className="text-white">{member.role}</p>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusStyle(member.status)}`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-300">{member.invitedOn || 'N/A'}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleDelete(member)} className="text-slate-400 hover:text-red-500 p-2 rounded-full transition duration-200">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <Suspense fallback={null}>
        {isConfirmModalOpen && (
          <ConfirmationModal
            isOpen={isConfirmModalOpen}
            onClose={() => setIsConfirmModalOpen(false)}
            onConfirm={confirmDelete}
            title="Eliminar Miembro del Equipo"
            message={`¿Estás seguro de que quieres eliminar a ${memberToDelete?.name} del equipo? Se revocará su acceso permanentemente.`}
          />
        )}
      </Suspense>
    </div>
  );
};

export default TeamManagementDashboard;
