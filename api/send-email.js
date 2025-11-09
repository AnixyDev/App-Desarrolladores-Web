// /api/send-email.js
// Esta función serverless actúa como un endpoint genérico para enviar correos.

// Para hacerlo funcionar en producción, necesitarás:
// 1. Elegir un proveedor de email (ej. Resend, SendGrid).
// 2. Instalar su librería: `npm install resend`
// 3. Obtener una API key y añadirla como variable de entorno en Vercel (ej. `RESEND_API_KEY`).
// 4. Descomentar y adaptar el código de abajo.

import { Resend } from 'resend';

// La API key se lee de las variables de entorno. Nunca se escribe en el código.
const resend = new Resend(process.env.RESEND_API_KEY);

// La dirección de email "from" debe ser un dominio verificado en tu proveedor de email.
const FROM_EMAIL = 'DevFreelancer <noreply@devfreelancer.app>';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { to, subject, html } = req.body;

    if (!to || !subject || !html) {
      return res.status(400).json({ error: 'Faltan los parámetros: to, subject, html' });
    }

    if (!process.env.RESEND_API_KEY) {
        console.warn("ADVERTENCIA: RESEND_API_KEY no está configurada. Simulando envío de email exitoso.");
        return res.status(200).json({ message: "Simulación de envío exitosa. Configura RESEND_API_KEY para envíos reales." });
    }

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: subject,
      html: html,
    });

    if (error) {
      console.error("Error al enviar email con Resend:", error);
      return res.status(400).json(error);
    }

    res.status(200).json(data);
  } catch (error) {
    console.error("Error en el endpoint de envío de email:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}