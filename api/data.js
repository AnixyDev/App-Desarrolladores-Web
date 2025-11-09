// /api/data.js
import { createClient } from '@supabase/supabase-js';

// This is the Admin client, used for server-side operations
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

// This entire file is now largely superseded by direct client-side Supabase calls from the Zustand slices.
// It's kept for potential future use where a server-side intermediary is absolutely necessary (e.g., complex joins, specific security rules).

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError) {
      return res.status(401).json({ error: `Authentication error: ${userError.message}` });
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

  } catch (err) {
    console.error('API Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
