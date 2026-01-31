import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
    console.log('Checking student_progress table...');
    const { data, error } = await supabase.from('student_progress').select('*').limit(1);
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Success! Data:', data);
    }
}

checkTable().catch(console.error);
