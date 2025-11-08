import React, { useState, lazy, Suspense } from 'react';
import { Briefcase, DollarSign, Clock, Hash, Send, Zap, Star } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { redirectToCheckout } from '../services/stripeService';
import { useAppStore } from '../hooks/useAppStore';
import { useNavigate } from 'react-router-dom';
import Card, { CardContent, CardHeader, CardFooter } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

// Lista de habilidades comunes para la selección múltiple
const commonSkills = [
  'Angular', 'AWS', 'CSS', 'Docker', 'Firebase', 'Go', 'GCP (Google Cloud)',
  'HTML', 'Java', 'JavaScript', 'Kubernetes', 'PHP (Laravel)', 'MongoDB', 
  'MySQL', 'Next.js', 'Node.js', 'PostgreSQL', 'Python (Django/Flask)', 
  'React', 'Svelte', 'Tailwind CSS', 'TypeScript', 'Vue.js',
];

const UpgradePromptModal = lazy(() => import('../components/modals/UpgradePromptModal'));

interface FormData {
    titulo: string;
    descripcion: string;
    presupuesto: string;
    duracionSemanas: string;
    habilidadesRequeridas: string[];
}

// --- COMPONENTE PRINCIPAL ---

const JobPostForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    titulo: '',
    descripcion: '',
    presupuesto: '',
    duracionSemanas: '',
    habilidadesRequeridas: [],
  });
  const [isFeatured, setIsFeatured] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { addJob, profile } = useAppStore();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSkillChange = (skill: string) => {
    setFormData(prev => {
        const skills = prev.habilidadesRequeridas;
        if (skills.includes(skill)) {
            return { ...prev, habilidadesRequeridas: skills.filter(s => s !== skill) };
        }
        return { ...prev, habilidadesRequeridas: [...skills, skill] };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const newJobData = {
        titulo: formData.titulo,
        descripcionCorta: formData.descripcion.substring(0, 100) + '...',
        descripcionLarga: formData.descripcion,
        presupuesto: Number(formData.presupuesto),
        duracionSemanas: Number(formData.duracionSemanas),
        habilidades: formData.habilidadesRequeridas,
        cliente: profile.business_name || profile.full_name,
        fechaPublicacion: 'Ahora',
        isFeatured: isFeatured,
        compatibilidadIA: 0, // Esto se calcularía en el backend
        postedByUserId: profile.id
    };

    if (isFeatured) {
        try {
            await redirectToCheckout('featuredJobPost');
            // La lógica de añadir el trabajo se manejaría en un webhook de Stripe en una app real.
            // Aquí, asumimos que el pago es exitoso y lo añadimos.
            addJob(newJobData);
        } catch (error) {
            addToast((error as Error).message, 'error');
            setIsLoading(false);
        }
    } else {
        addJob(newJobData);
        addToast('¡Oferta publicada con éxito!', 'success');
        navigate('/my-job-posts');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold text-white mb-6">Publicar Nueva Oferta</h1>
      <form onSubmit={handleSubmit}>
        <Card>
            <CardContent className="space-y-6 p-6">
                <Input label="Título de la Oferta" name="titulo" value={formData.titulo} onChange={handleInputChange} required icon={<Briefcase className="w-4 h-4 text-gray-400"/>} placeholder="Ej: Desarrollador Backend con Node.js"/>
                <div>
                    <label htmlFor="descripcion" className="block text-sm font-medium text-gray-300 mb-1">Descripción Completa del Proyecto</label>
                    <textarea id="descripcion" name="descripcion" value={formData.descripcion} onChange={handleInputChange} rows={8} required className="block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-gray-800 text-white" placeholder="Describe las responsabilidades, requisitos, y cualquier detalle relevante..."/>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input label="Presupuesto Fijo (€)" name="presupuesto" type="number" value={formData.presupuesto} onChange={handleInputChange} required icon={<DollarSign className="w-4 h-4 text-gray-400"/>} placeholder="5000"/>
                    <Input label="Duración Estimada (Semanas)" name="duracionSemanas" type="number" value={formData.duracionSemanas} onChange={handleInputChange} required icon={<Clock className="w-4 h-4 text-gray-400"/>} placeholder="8"/>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Habilidades Requeridas</label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                        {commonSkills.map(skill => (
                            <label key={skill} className="flex items-center space-x-2 text-sm text-gray-200 cursor-pointer">
                                <input type="checkbox" checked={formData.habilidadesRequeridas.includes(skill)} onChange={() => handleSkillChange(skill)} className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-primary-600 focus:ring-primary-500"/>
                                <span>{skill}</span>
                            </label>
                        ))}
                    </div>
                </div>

                 <div className="p-4 bg-fuchsia-900/30 border border-fuchsia-600/50 rounded-lg flex items-start gap-4">
                    <Star className="w-6 h-6 text-fuchsia-400 shrink-0 mt-1"/>
                    <div>
                        <h4 className="font-semibold text-white">Destaca tu oferta (5,95€)</h4>
                        <p className="text-sm text-fuchsia-200">Tu oferta aparecerá en la parte superior de los resultados de búsqueda para una mayor visibilidad.</p>
                        <label className="flex items-center mt-3 cursor-pointer">
                            <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-primary-600 focus:ring-primary-500"/>
                            <span className="ml-2 text-white">Sí, quiero destacar esta oferta</span>
                        </label>
                    </div>
                </div>

            </CardContent>
            <CardFooter className="flex justify-end">
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Publicando...' : 'Publicar Oferta'}
                    <Send className="w-4 h-4 ml-2"/>
                </Button>
            </CardFooter>
        </Card>
      </form>
    </div>
  );
};

export default JobPostForm;