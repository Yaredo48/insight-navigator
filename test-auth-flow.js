// Test authentication flow
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuth() {
    console.log('Testing authentication...');
    
    try {
        // Test signup
        console.log('1. Testing signup...');
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: 'testflow@example.com',
            password: 'password123',
            options: {
                data: {
                    name: 'Test Flow User',
                    role: 'student'
                }
            }
        });
        
        if (signUpError) {
            console.error('Signup failed:', signUpError);
            return;
        }
        
        console.log('Signup successful:', signUpData);
        
        // Test profile creation
        console.log('2. Testing profile creation...');
        const { error: profileError } = await supabase
            .from('user_profiles')
            .upsert({
                id: signUpData.user.id,
                role: 'student',
                name: 'Test Flow User'
            });
        
        if (profileError) {
            console.error('Profile creation failed:', profileError);
        } else {
            console.log('Profile creation successful');
        }
        
        // Test login
        console.log('3. Testing login...');
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: 'testflow@example.com',
            password: 'password123'
        });
        
        if (signInError) {
            console.error('Login failed:', signInError);
            return;
        }
        
        console.log('Login successful:', signInData);
        
        // Test profile fetch
        console.log('4. Testing profile fetch...');
        const { data: profile, error: fetchError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', signInData.user.id)
            .single();
        
        if (fetchError) {
            console.error('Profile fetch failed:', fetchError);
        } else {
            console.log('Profile fetch successful:', profile);
        }
        
    } catch (error) {
        console.error('Auth test error:', error);
    }
}

testAuth();
