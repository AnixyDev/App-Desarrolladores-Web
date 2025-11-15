// /api/data.ts
import { createClient } from '@supabase/supabase-js';

interface ApiRequest {
  method?: string;
  body: {
    action: 'ADD' | 'UPDATE' | 'DELETE';
    entity: string;
    payload: any;
  };
  headers: { [key: string]: string | string[] | undefined };
}

interface ApiResponse {
  status: (statusCode: number) => {
    json: (body: any) => void;
  };
}

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    
    let token: string | undefined;
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    }

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({ error: `Authentication error: ${userError?.message || 'User not found'}` });
    }
    
    const userId = user.id;
    const { action, entity, payload } = req.body;

    let data, error;

    switch (action) {
      case 'ADD':
        ({ data, error } = await supabaseAdmin
          .from(entity)
          .insert({ ...payload, user_id: userId })
          .select()
          .single());
        break;

      case 'UPDATE':
        ({ data, error } = await supabaseAdmin
          .from(entity)
          .update(payload)
          .eq('id', payload.id)
          .eq('user_id', userId) 
          .select()
          .single());
        break;

      case 'DELETE':
         ({ data, error } = await supabaseAdmin
          .from(entity)
          .delete()
          .eq('id', payload.id)
          .eq('user_id', userId));
        break;

      default:
        return res.status(400).json({ error: 'Invalid action. GET_ALL is deprecated; data is fetched from client slices.' });
    }

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json(data);

  } catch (err: any) {
    console.error('API Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}