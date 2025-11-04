import React, { useState, lazy, Suspense, useEffect } from 'react';
import { Briefcase, DollarSign, Clock, Zap, Target, Filter, ChevronDown, TrendingUp, Search, Star, InfoIcon, BellRing } from 'lucide-react';
import { Job } from '../types.ts';
import Button from '../components/ui/Button.tsx';
import { Link } from 'react-router-dom';
import { useAppStore } from '../hooks/useAppStore.tsx';
import EmptyState from '../components/ui/EmptyState.tsx';
import { useToast } from '../hooks/useToast.ts';

const ProposalGeneratorModal = lazy(() => import('../components/modals/ProposalGeneratorModal.tsx'));
const UpgradePromptModal = lazy(() => import('../components/modals/UpgradePromptModal.tsx'));

const JobCard: React.FC<{ job: Job, onApply: (job: Job) => void, onSave: (jobId: string) => void, isSaved: boolean }> = ({ job, onApply, onSave, isSaved }) => {
  let compatibilityColor = 'text-red-400 bg-red-900/30';
  if (job.compatibilidadIA >= 80) {
    compatibilityColor = 'text-fuchsia-500 bg-fuchsia-900/30'; 
  } else if (job.compatibilidadIA >= 60) {
    compatibilityColor = 'text-yellow-400 bg-yellow-900/30';
  }

  return (
    <div className={`bg-gray-900 p-6 rounded-xl border transition duration-300 flex flex-col md:flex-row justify-between relative ${job.isFeatured ? 'border-fuchsia-600 shadow-lg shadow-fuchsia-900/30' : 'border-gray-700 hover:border-fuchsia-600'}`}>
      
      {job.isFeatured && (
        <div className="absolute top-0 left-0 -translate-y-1/2 ml-4 px-3 py-1 text-xs font-bold rounded-full flex items-center shadow-lg bg-fuchsia-500 text-black">
            <Star className="w-4 h-4 mr-1"/>
            Destacado
        </div>
      )}
      
      <button onClick={() => onSave(job.id)} className={`absolute top-4 right-4 text-gray-500 hover:text-yellow-400 transition-colors ${isSaved ? 'text-yellow-400' : ''}`} aria-label="Guardar oferta">
        <Star className={`w-6 h-6 ${isSaved ? 'fill-current' : ''}`} />
      </button>


      <div className={`absolute top-0 right-16 m-4 px-3 py-1 text-xs font-bold rounded-full flex items-center shadow-lg ${compatibilityColor}`}>
        <Target className="w-4 h-4 mr-1" />
        Match IA: {job.compatibilidadIA}%
      </div>

      <div className="md:w-3/4 pr-4">
        <Link to={`/job-market/${job.id}`} className="text-xl font-bold text-white mb-2 hover:text-primary-400 transition-colors">{job.titulo}</Link>
        <p className="text-gray-400 mb-4">{job.descripcionCorta}</p>
        
        <div className="flex flex-wrap items-center text-sm text-gray-400 space-x-4 mb-4">
          <span className="flex items-center">
            <DollarSign className="w-4 h-4 mr-1 text-green-400" />
            €{job.presupuesto.toLocaleString('es-ES')} (Fijo)
          </span>
          <span className="flex items-center">
            <Clock className="w-4 h-4 mr-1 text-yellow-400" />
            {job.duracionSemanas} Semanas
          </span>
          <span className="flex items-center text-gray-500">
            {job.fechaPublicacion}
          </span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {job.habilidades.map((skill, index) => (
            <span key={index} className="px-3 py-1 text-xs font-medium rounded-full bg-gray-800 text-fuchsia-500 border border-fuchsia-900/50">
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div className="md:w-1/4 mt-4 md:mt-0 flex flex-col items-start md:items-end justify-between">
        <p className="text-gray-400 mb-2 text-sm">Cliente: <span className="text-white font-semibold">{job.cliente}</span></p>
        
        <button
          onClick={() => onApply(job)}
          className="w-full md:w-auto mt-2 px-4 py-2 bg-fuchsia-600 text-black font-semibold rounded-lg shadow-md hover:bg-fuchsia-700 transition duration-200 flex items-center justify-center"
        >
          <Zap className="w-4 h-4 mr-2" />
          Aplicar con IA
        </button>
      </div>
    </div>
  );
};

const JobMarketDashboard = () => {
  const { jobs, savedJobIds, saveJob, profile, notifiedJobIds, addNotification, markJobAsNotified } = useAppStore();
  const { addToast } = useToast();
  const [sort, setSort] = useState('match');
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [alertsEnabled, setAlertsEnabled] = useState(true);

  useEffect(() => {
    // Simular la comprobación de nuevas ofertas coincidentes
    const timer = setTimeout(() => {
      if (!profile || !profile.skills || profile.plan !== 'Pro') return;

      const userSkills = new Set(profile.skills);
      const newMatches = jobs.filter(job => 
        !notifiedJobIds.includes(job.id) && 
        job.habilidades.some(skill => userSkills.has(skill))
      );

      newMatches.forEach(job => {
        addNotification(`¡Nueva oferta encontrada que coincide con tus habilidades: '${job.titulo}'!`, `/job-market/${job.id}`);
        markJobAsNotified(job.id);
      });
    }, 1500); // Retraso para simular una comprobación en segundo plano

    return () => clearTimeout(timer);
  }, [jobs, profile, notifiedJobIds, addNotification, markJobAsNotified]);


  const handleApplyClick = (job: Job) => {
    if (profile?.plan === 'Free') {
        setIsUpgradeModalOpen(true);
    } else {
        setSelectedJob(job);
        setIsProposalModalOpen(true);
    }
  };
  
  const handleAlertsToggle = () => {
      const newState = !alertsEnabled;
      setAlertsEnabled(newState);
      addToast(`Alertas de trabajo ${newState ? 'activadas' : 'desactivadas'} (Simulación)`, 'info');
  };

  const sortedJobs = [...jobs].sort((a, b) => {
    if (a.isFeatured && !b.isFeatured) return -1;
    if (!a.isFeatured && b.isFeatured) return 1;

    switch (sort) {
      case 'match':
        return b.compatibilidadIA - a.compatibilidadIA;
      case 'budget':
        return b.presupuesto - a.presupuesto;
      case 'date':
        return 0;
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen bg-gray-950 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
            <TrendingUp className="w-7 h-7 text-fuchsia-500 mr-3" />
            Mercado de Proyectos
          </h1>
          <p className="text-gray-400">
            Descubre oportunidades. Nuestro motor de IA te muestra los proyectos más compatibles con tu perfil.
          </p>
        </header>

        <div className="bg-gray-900 rounded-xl p-4 mb-6 flex flex-col md:flex-row justify-between items-center gap-4 border border-gray-800 flex-wrap">
          <div className="relative w-full sm:w-auto sm:flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input 
              type="text" 
              placeholder="Buscar por título, habilidad..."
              className="w-full bg-gray-800 text-white rounded-lg p-3 pl-10 border border-gray-700 focus:border-fuchsia-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-4 flex-wrap">
             <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-200 flex items-center gap-1"><BellRing className="w-4 h-4 text-primary-400" /> Alertas</label>
                <button type="button" onClick={handleAlertsToggle} className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${alertsEnabled ? 'bg-primary-600' : 'bg-gray-600'}`}>
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${alertsEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
             </div>
             <div className="flex items-center gap-2">
                 <label htmlFor="sort" className="text-sm text-gray-400">Ordenar por:</label>
                <select 
                  id="sort" 
                  value={sort} 
                  onChange={e => setSort(e.target.value)}
                  className="bg-gray-800 text-white rounded-lg p-3 border border-gray-700 focus:border-fuchsia-500 outline-none"
                >
                  <option value="match">Mejor Match IA</option>
                  <option value="budget">Mayor Presupuesto</option>
                  <option value="date">Más Recientes</option>
                </select>
             </div>
           <Link to="/post-job">
             <Button variant='primary'>Publicar un Proyecto</Button>
           </Link>
          </div>
        </div>

        <div className="space-y-6">
          {sortedJobs.length > 0 ? (
            sortedJobs.map(job => (
              <JobCard key={job.id} job={job} onApply={handleApplyClick} onSave={saveJob} isSaved={savedJobIds.includes(job.id)} />
            ))
          ) : (
            <EmptyState
                icon={Briefcase}
                title="No hay ofertas de trabajo"
                message="Actualmente no hay ofertas disponibles. ¡Vuelve a consultar más tarde o publica la tuya!"
                action={{ text: 'Publicar una Oferta', onClick: () => {} }}
            />
          )}
        </div>
      </div>
      
      <Suspense fallback={null}>
        {selectedJob && isProposalModalOpen && (
          <ProposalGeneratorModal 
              isOpen={isProposalModalOpen}
              onClose={() => setIsProposalModalOpen(false)}
              job={selectedJob}
          />
        )}
        {isUpgradeModalOpen && (
            <UpgradePromptModal
                isOpen={isUpgradeModalOpen}
                onClose={() => setIsUpgradeModalOpen(false)}
                featureName="aplicar a ofertas de trabajo"
            />
        )}
      </Suspense>
    </div>
  );
};
export default JobMarketDashboard;