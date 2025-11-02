import React from 'react';
import { Link } from 'react-router-dom';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import { Logo } from '../components/icons/Logo';

const PrivacyPolicyPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-950 flex flex-col justify-center items-center p-4 sm:p-8">
             <div className="flex items-center mb-8">
                <Logo className="h-10 w-10 mr-3" />
                <span className="text-3xl font-bold text-white">DevFreelancer</span>
            </div>
            <Card className="w-full max-w-4xl">
                <CardHeader>
                    <h1 className="text-2xl font-bold text-white">Política de Privacidad</h1>
                    <p className="text-gray-400">Última actualización: 24 de Octubre de 2024</p>
                </CardHeader>
                <CardContent className="prose prose-invert max-w-none text-gray-300">
                    <h2>1. Introducción</h2>
                    <p>
                        Bienvenido a DevFreelancer ("nosotros", "nuestro"). Nos comprometemos a proteger tu privacidad. Esta Política de Privacidad explica cómo recopilamos, usamos, divulgamos y protegemos tu información cuando utilizas nuestra aplicación web (el "Servicio").
                    </p>
                    
                    <h2>2. Información que Recopilamos</h2>
                    <p>Podemos recopilar información sobre ti de varias maneras. La información que podemos recopilar a través del Servicio incluye:</p>
                    <ul>
                        <li><strong>Datos Personales:</strong> Información de identificación personal, como tu nombre, dirección de correo electrónico, nombre de empresa y NIF/CIF, que nos proporcionas voluntariamente cuando te registras en el Servicio.</li>
                        <li><strong>Datos de Clientes y Proyectos:</strong> Información que introduces sobre tus clientes, proyectos, facturas, gastos y otros datos de negocio necesarios para el funcionamiento de la aplicación. Eres el único propietario y responsable de estos datos.</li>
                        <li><strong>Datos Financieros:</strong> No almacenamos directamente datos de pago. Las transacciones son procesadas por nuestros proveedores de pago externos.</li>
                        <li><strong>Datos de Uso:</strong> Recopilamos automáticamente información sobre cómo interactúas con el Servicio, como las páginas que visitas y las funciones que utilizas.</li>
                        <li><strong>Información de Google:</strong> Si eliges registrarte o iniciar sesión con tu cuenta de Google, recibiremos información de tu perfil de Google, como tu nombre, correo electrónico y foto de perfil, según lo permitido por tu configuración de privacidad de Google.</li>
                    </ul>

                    <h2>3. Cómo Usamos tu Información</h2>
                    <p>Usamos la información que recopilamos para:</p>
                    <ul>
                        <li>Crear y gestionar tu cuenta.</li>
                        <li>Proporcionar, operar y mantener nuestro Servicio.</li>
                        <li>Procesar tus transacciones y gestionar tus suscripciones.</li>
                        <li>Mejorar, personalizar y ampliar nuestro Servicio.</li>
                        <li>Comunicarnos contigo para fines informativos y de soporte.</li>
                        <li>Prevenir el fraude y garantizar la seguridad de nuestra plataforma.</li>
                    </ul>

                    <h2>4. Cómo Compartimos tu Información</h2>
                    <p>No compartimos tu información personal con terceros, excepto en las siguientes situaciones:</p>
                    <ul>
                        <li><strong>Con tu Consentimiento:</strong> Podemos compartir tu información con tu consentimiento explícito.</li>
                        <li><strong>Proveedores de Servicios:</strong> Compartimos información con proveedores de servicios externos que realizan tareas en nuestro nombre, como procesamiento de pagos y alojamiento de datos.</li>
                        <li><strong>Cumplimiento Legal:</strong> Podemos divulgar tu información si así lo exige la ley o en respuesta a solicitudes válidas de las autoridades públicas.</li>
                    </ul>

                    <h2>5. Seguridad de los Datos</h2>
                    <p>
                        Utilizamos medidas de seguridad administrativas, técnicas y físicas para proteger tu información personal. Si bien hemos tomado medidas razonables para proteger la información que nos proporcionas, ten en cuenta que ninguna medida de seguridad es perfecta o impenetrable.
                    </p>
                    
                    <h2>6. Tus Derechos de Privacidad</h2>
                    <p>Dependiendo de tu ubicación, puedes tener los siguientes derechos con respecto a tus datos personales:</p>
                    <ul>
                        <li>El derecho a acceder, actualizar o eliminar la información que tenemos sobre ti.</li>
                        <li>El derecho a la rectificación si la información es inexacta o incompleta.</li>
                        <li>El derecho a oponerte a nuestro procesamiento de tus datos personales.</li>
                        <li>El derecho a la portabilidad de los datos.</li>
                    </ul>
                    <p>Puedes gestionar la información de tu perfil desde la página de "Ajustes".</p>

                    <h2>7. Contacto</h2>
                    <p>
                        Si tienes preguntas o comentarios sobre esta Política de Privacidad, por favor, contáctanos en <a href="mailto:privacy@devfreelancer.com" className="text-primary-400">privacy@devfreelancer.com</a>.
                    </p>
                     <div className="text-center mt-8">
                        <Link to="/" className="text-primary-400 hover:underline">Volver a la aplicación</Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default PrivacyPolicyPage;