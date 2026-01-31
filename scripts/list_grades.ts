import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listGrades() {
    const { data, error } = await supabase.from('grades').select('*');
    if (error) {
        console.error('Error fetching grades:', error);
        return;
    }
    console.table(data);
}

listGrades().catch(console.error);
