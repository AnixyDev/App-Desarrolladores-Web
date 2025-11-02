
import React, { useState } from 'react';
import { useAppStore } from '../hooks/useAppStore.tsx';
import Card, { CardContent, CardHeader, CardFooter } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const SettingsPage: React.FC = () => {
    const { profile } = useAppStore();
    const [formData, setFormData] = useState(profile);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => prev ? ({ ...prev, [name]: value }) : null);
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, you would call an updateProfile action here.
        alert('Perfil actualizado (simulación).');
    }

    if (!formData) return <div>Cargando perfil...</div>;

    return (
        <div>
            <h1 className="text-2xl font-semibold text-white mb-6">Ajustes</h1>
            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <h2 className="text-lg font-semibold text-white">Información del Perfil</h2>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Input label="Nombre Completo" name="full_name" value={formData.full_name} onChange={handleInputChange} />
                        <Input label="Email" name="email" type="email" value={formData.email} onChange={handleInputChange} />
                        <Input label="Nombre del Negocio" name="business_name" value={formData.business_name} onChange={handleInputChange} />
                        <Input label="NIF/CIF" name="tax_id" value={formData.tax_id} onChange={handleInputChange} />
                        <Input label="Tarifa por Hora (€)" name="hourly_rate_cents" type="number" value={formData.hourly_rate_cents / 100} onChange={(e) => setFormData(p => p ? {...p, hourly_rate_cents: Number(e.target.value) * 100} : null)} />
                        <Input label="Color principal para PDFs" name="pdf_color" type="color" value={formData.pdf_color} onChange={handleInputChange} wrapperClassName="flex items-center gap-4" />
                    </CardContent>
                    <CardFooter className="flex justify-end">
                        <Button type="submit">Guardar Cambios</Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
};

export default SettingsPage;