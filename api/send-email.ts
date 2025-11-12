// /api/send-email.ts
import { Resend } from 'resend';

interface ApiRequest {
  method?: string;
  body: {
    to: string;
    subject: string;
    html: string;
  };
}

interface ApiResponse {
  status: (statusCode: number) => {
    json: (body: any) => void;
  };
}

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = 'DevFreelancer <noreply@devfreelancer.app>';

export default async function handler(req: ApiRequest, res: ApiResponse) {
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
