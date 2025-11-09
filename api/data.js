// /api/data.js
import { createClient } from '@supabase/supabase-js';

// These should be set as Environment Variables in Vercel.
const supabaseUrl = process.env.VITE_SUPABASE_URL;
// This is the SERVICE_ROLE_KEY, which has admin privileges. NEVER expose this on the client.
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; 

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Middleware to verify the JWT from the user's request
const verifyUser = async (req) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { error: { message: 'Unauthorized: Missing token' }, user: null };
    }
    const token = authHeader.split(' ')[1];
    
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error) {
        return { error: { message: `Unauthorized: ${error.message}` }, user: null };
    }
    return { error: null, user };
};

export default async function handler(req, res) {
    const { user, error: userError } = await verifyUser(req);
    if (userError) {
        return res.status(401).json({ error: userError.message });
    }

    const { table, action, id, data } = req.body;

    try {
        let responseData;
        let query;

        switch (action) {
            case 'GET_ALL_FOR_USER':
                // Fetch all data for the logged-in user
                const [
                    profile, clients, projects, tasks, invoices, expenses, timeEntries,
                    // ... other tables
                ] = await Promise.all([
                    supabaseAdmin.from('profiles').select('*').eq('id', user.id).single(),
                    supabaseAdmin.from('clients').select('*').eq('user_id', user.id),
                    supabaseAdmin.from('projects').select('*').eq('user_id', user.id),
                    supabaseAdmin.from('tasks').select('*').eq('user_id', user.id),
                    supabaseAdmin.from('invoices').select('*').eq('user_id', user.id),
                    supabaseAdmin.from('expenses').select('*').eq('user_id', user.id),
                    supabaseAdmin.from('time_entries').select('*').eq('user_id', user.id),
                ]);

                responseData = {
                    profile: profile.data,
                    clients: clients.data,
                    projects: projects.data,
                    tasks: tasks.data,
                    invoices: invoices.data,
                    expenses: expenses.data,
                    timeEntries: timeEntries.data,
                    // Return empty arrays for non-migrated data
                    recurringInvoices: [], budgets: [], proposals: [], contracts: [], users: [], referrals: [], articles: [], jobs: [], savedJobIds: [], applications: [], notifiedJobIds: [], notifications: [], projectMessages: [], projectFiles: [], shadowIncome: [], invoiceTemplates: [], proposalTemplates: [], portalComments: [], portalFiles: [],
                };
                break;

            case 'GET_ALL':
                query = supabaseAdmin.from(table).select('*').eq('user_id', user.id);
                const { data: getAllData, error: getAllError } = await query;
                if (getAllError) throw getAllError;
                responseData = getAllData;
                break;
            
            case 'CREATE':
                const { data: createData, error: createError } = await supabaseAdmin
                    .from(table)
                    .insert([{ ...data, user_id: user.id }])
                    .select()
                    .single();
                if (createError) throw createError;
                responseData = createData;
                break;

            case 'UPDATE':
                 const { data: updateData, error: updateError } = await supabaseAdmin
                    .from(table)
                    .update(data)
                    .eq('id', id)
                    .eq('user_id', user.id) // Security check
                    .select()
                    .single();
                if (updateError) throw updateError;
                responseData = updateData;
                break;

            case 'DELETE':
                const { error: deleteError } = await supabaseAdmin
                    .from(table)
                    .delete()
                    .eq('id', id)
                    .eq('user_id', user.id); // Security check
                if (deleteError) throw deleteError;
                responseData = { success: true, id };
                break;

            default:
                return res.status(400).json({ error: 'Invalid action' });
        }
        
        res.status(200).json(responseData);

    } catch (err) {
        console.error(`Error performing action '${action}' on table '${table}':`, err);
        res.status(500).json({ error: err.message });
    }
}
