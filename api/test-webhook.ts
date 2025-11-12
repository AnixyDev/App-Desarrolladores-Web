// /api/test-webhook.ts

interface ApiRequest {
  method?: string;
  body: {
    url: string;
    event: string;
  };
}

interface ApiResponse {
  status: (statusCode: number) => {
    json: (body: any) => void;
  };
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { url, event } = req.body;

    if (!url || !event) {
      return res.status(400).json({ error: 'Faltan la URL o el tipo de evento.' });
    }

    let payload: object;
    switch (event) {
      case 'TASK_COMPLETED':
        payload = {
          event: 'TASK_COMPLETED',
          timestamp: new Date().toISOString(),
          data: {
            taskId: 'task-123',
            description: 'Diseñar la nueva landing page',
            projectId: 'proj-456',
            completedBy: 'Usuario de Ejemplo'
          }
        };
        break;
      case 'NEW_DOCUMENT':
        payload = {
          event: 'NEW_DOCUMENT',
          timestamp: new Date().toISOString(),
          data: {
            documentId: 'doc-789',
            title: 'Guía de Estilo de Código',
            createdBy: 'Usuario de Ejemplo'
          }
        };
        break;
      default:
        payload = { event: 'TEST_EVENT', message: 'Esta es una prueba de conexión.' };
    }

    const webhookResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!webhookResponse.ok) {
        throw new Error(`El endpoint respondió con el estado: ${webhookResponse.status}`);
    }

    res.status(200).json({ success: true, message: 'Webhook de prueba enviado con éxito.' });

  } catch (err: any) {
    console.error('Error al probar el webhook:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}
