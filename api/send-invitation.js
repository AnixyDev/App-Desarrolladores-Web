// /api/send-invitation.js

/**
 * ESTE ES UN ARCHIVO DE EJEMPLO PARA UNA FUNCIÓN SERVERLESS EN VERCEL.
 * 
 * En una aplicación real, este endpoint se encargaría de enviar un correo electrónico
 * utilizando un servicio de terceros como Resend, SendGrid o Nodemailer.
 * NO debe contener claves de API directamente en el código; estas deben ser
 * almacenadas de forma segura como variables de entorno en Vercel.
 * 
 * El frontend haría una llamada a esta API, y esta función se ejecutaría en el servidor.
 */

/*
// Ejemplo conceptual usando 'Resend' (NO FUNCIONAL SIN CONFIGURACIÓN)
import { Resend } from 'resend';

// La API key se obtendría de las variables de entorno: process.env.RESEND_API_KEY
// const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { name, email, role } = req.body;

    // Lógica para construir el email de invitación
    const { data, error } = await resend.emails.send({
      from: 'DevFreelancer <onboarding@yourdomain.com>',
      to: [email],
      subject: `Has sido invitado a un equipo en DevFreelancer`,
      html: `<h1>¡Hola ${name}!</h1><p>Has sido invitado a unirte a un equipo en DevFreelancer con el rol de ${role}.</p><p>Haz clic aquí para aceptar la invitación.</p>`, // Aquí iría un enlace de invitación real
    });

    if (error) {
      return res.status(400).json(error);
    }

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
*/

// Para esta simulación, la llamada del frontend no llegará aquí.
// El frontend simulará la llamada para mantener la interactividad.
// Este archivo sirve como guía estructural para un despliegue real.
