import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Briefcase, DollarSign, Clock, Hash, Send, Zap, Star } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { redirectToCheckout } from '../services/stripeService';
import { useAppStore } from '../hooks/useAppStore';
import { useNavigate } from 'react-router-dom';

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

interface InputFieldProps {
    label: string;
    name: keyof Omit<FormData, 'habilidadesRequeridas' | 'descripcion'>;
    type?: string;
    icon: React.ElementType;
    required?: boolean;
}

// --- COMPONENTE PRINCIPAL ---

const JobPostForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    titulo: '',
    descripcion: '',
    presupuesto: '',
    duracionSemanas: '',
    habilidadesRequeridas: [],