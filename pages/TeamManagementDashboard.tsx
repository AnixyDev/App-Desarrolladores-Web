
import React, { useState } from 'react';
import { Users, UserPlus, Trash2, Mail, Settings, User, X, Check } from 'lucide-react';

// --- TYPES ---
interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Pending Invitation';
  invitedOn: string;
}

interface NewMember {
    name: string;
    email: string;
    role: string;
}

const roles: string[] = [
  'Developer Senior', 
  'Diseñador UX/UI', 
  'Gestor de Proyectos', 
  'Contador/Facturación', 
  'Admin',
];

const TeamManagementDashboard: React.FC = () => {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newMember, setNewMember] = useState<NewMember>({ name: '', email: '', role: roles[0] });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.name || !newMember.email) return;

    const newId = team.length + 1;
    const invitation: TeamMember = {
      ...newMember,
      id: newId,
      status: 'Pending Invitation',
      invitedOn: new Date().toISOString().slice(0, 10),
    };

    setTeam([...team, invitation]);
    setNewMember({ name: '', email: '', role: roles[0] });
    setShowInviteModal(false);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar a este miembro del equipo?')) {
        setTeam(team.filter(member => member.id !== id));
    }
  };
  
  const handleRoleChange = (id: number, newRole: string) => {
    setTeam(team.map(member => 
      member.id === id ? { ...member, role: newRole } : member
    ));
  };

  const getStatusStyle = (status: TeamMember['status']) => {
    switch (status) {
      case 'Active': return 'bg-green-900/50 text-green-400 border border-green-700';
      case 'Pending Invitation': return 'bg-yellow-900/50 text-yellow-400 border border-yellow-700';
      default: return 'bg-gray-700/50 text-gray-400 border border-gray-600';
    }
  };

  const InviteMemberModal = () => (
    <div className="fixed inset-0 bg-gray-950 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 p-8 rounded-xl w-full max-w-lg border border-fuchsia-600/50 shadow-2xl">
        <div className="flex justify-between items-center border-b border-gray-800 pb-4 mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center"><UserPlus className="w-6 h-6 mr-3 text-fuchsia-500" /> Invitar Nuevo Miembro</h2>
          <button onClick={() => setShowInviteModal(false)} className="text-gray-400 hover:text-white"><X /></button>
        </div>
        
        <form onSubmit={handleInvite} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Nombre Completo</label>
            <input
              type="text"
              value={newMember.name}
              onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
              className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Correo Electrónico</label>
            <input
              type="email"
              value={newMember.email}
              onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
              className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Rol y Permisos</label>
            <select
              value={newMember.role}
              onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
              className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-fuchsia-500 outline-none"
            >
              {roles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-2">El rol define su acceso a Facturación, Proyectos y CRM.</p>
          </div>
          
          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 font-semibold rounded-lg transition duration-200 bg-fuchsia-600 text-black hover:bg-fuchsia-700 shadow-lg shadow-fuchsia-500/50 flex items-center"
            >
              <Mail className="w-5 h-5 mr-2" />
              Enviar Invitación
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 p-4 sm:p-8">
      {showInviteModal && <InviteMemberModal />}

      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
          <h1 className="text-3xl font-bold text-white flex items-center">
            <Users className="w-7 h-7 text-fuchsia-500 mr-3" />
            DevFreelancer Teams
          </h1>
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-6 py-2 font-semibold rounded-lg transition duration-200 bg-fuchsia-600 text-black hover:bg-fuchsia-700 shadow-md shadow-fuchsia-500/30 flex items-center"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Invitar Miembro
          </button>
        </header>

        <div className="bg-gray-900 rounded-xl p-6 shadow-xl">
          <h2 className="text-xl font-semibold text-white mb-4 border-b border-gray-800 pb-2">Miembros del Equipo ({team.length})</h2>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-800">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Miembro</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Rol</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Invitado</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {team.map((member) => (
                  <tr key={member.id} className={member.role === 'CEO / Admin' ? 'bg-gray-800/50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-5 h-5 mr-3 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-white">{member.name}</p>
                          <p className="text-xs text-gray-400">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {member.role === 'CEO / Admin' ? (
                        <span className="text-sm font-medium text-fuchsia-500 flex items-center">
                          <Settings className="w-4 h-4 mr-1" /> {member.role}
                        </span>
                      ) : (
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.id, e.target.value)}
                          className="p-1 bg-gray-800 text-white rounded-md border border-gray-700 focus:border-fuchsia-500 outline-none text-sm"
                        >
                          {roles.filter(r => r !== 'Admin').map(role => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusStyle(member.status)}`}>
                        {member.status === 'Active' ? <Check className="w-4 h-4 mr-1" /> : <Mail className="w-4 h-4 mr-1" />}
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{member.invitedOn}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {member.role !== 'CEO / Admin' && (
                        <button
                          onClick={() => handleDelete(member.id)}
                          className="text-red-500 hover:text-red-700 transition duration-150 p-2 rounded-full hover:bg-gray-800"
                          aria-label={`Eliminar a ${member.name}`}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 p-4 bg-gray-900 rounded-xl border-l-4 border-fuchsia-500">
            <p className="text-sm text-gray-400">Nota: Los usuarios con rol "Admin" tienen acceso completo a Facturación, Proyectos, CRM y Gestión de Equipo. Otros roles tienen acceso restringido basado en el perfil.</p>
        </div>
      </div>
    </div>
  );
};

export default TeamManagementDashboard;