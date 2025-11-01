
import React, { useState } from 'react';
import { Briefcase, DollarSign, Clock, Zap, Target, Filter, ChevronDown, TrendingUp, Search, Star, InfoIcon } from 'lucide-react';
// FIX: Add .ts extension to types import
import { Job } from '../types.ts';
// FIX: Added .tsx extension to the import path.
import ProposalGeneratorModal from '../components/modals/ProposalGeneratorModal.tsx';
import Button from '../components/ui/Button.tsx';
import { Link } from 'react-router-dom';

const JobCard: React.FC<{ job: Job, onApply: (job: Job) => void }> = ({ job, onApply }) => {
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

      <div className={`absolute top-0 right-0 m-4 px-3 py-1 text-xs font-bold rounded-full flex items-center shadow-lg ${compatibilityColor}`}>
        <Target className="w-4 h-4 mr-1" />
        Match IA: {job.compatibilidadIA}%
      </div>

      <div className="md:w-3/4 pr-4">
        <h3 className="text-xl font-bold text-white mb-2">{job.titulo}</h3>
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
  const [jobs, setJobs] = useState<Job[]>([]); // Data removed for production
  const [sort, setSort] = useState('match');
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const handleApplyClick = (job: Job) => {
    setSelectedJob(job);
    setIsProposalModalOpen(true);
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

        <div className="bg-gray-900 rounded-xl p-4 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 border border-gray-800">
          <div className="relative w-full sm:w-1/2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input 
              type="text" 
              placeholder="Buscar por título, habilidad o cliente..."
              className="w-full bg-gray-800 text-white rounded-lg p-3 pl-10 border border-gray-700 focus:border-fuchsia-500 outline-none"
            />
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

        <div className="space-y-6">
          {sortedJobs.length > 0 ? (
            sortedJobs.map(job => (
              <JobCard key={job.id} job={job} onApply={handleApplyClick} />
            ))
          ) : (
            <div className="text-center p-12 bg-gray-900 rounded-xl border-2 border-dashed border-gray-700">
                <Briefcase className="w-10 h-10 mx-auto text-gray-600 mb-3" />
                <p className="text-lg text-gray-500 font-semibold">No hay ofertas de trabajo disponibles en este momento.</p>
                <p className="text-gray-600">Vuelve a consultar más tarde.</p>
            </div>
          )}
        </div>
      </div>
      
      {selectedJob && (
        <ProposalGeneratorModal 
            isOpen={isProposalModalOpen}
            onClose={() => setIsProposalModalOpen(false)}
            jobTitle={selectedJob.titulo}
            jobDescription={selectedJob.descripcionCorta}
        />
      )}
    </div>
  );
};
export default JobMarketDashboard;