import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface UserProfile {
    id: string;
    role: 'student' | 'teacher' | null;
    display_name: string | null;
    created_at: string;
    updated_at: string;
    user_id: string; // From Supabase schema
    email: string | null;
    avatar_url: string | null;
}

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    session: Session | null;
    loading: boolean;
    signUp: (email: string, password: string, name: string, role: 'student' | 'teacher') => Promise<void>;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Fetch user profile from database
    const fetchUserProfile = async (userId: string) => {
        console.log('Fetching profile for:', userId);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error) {
                console.error('Supabase query error:', error);
                throw error;
            }
            if (!data) {
                console.warn('No profile found for user:', userId);
                return null;
            }

            // Safely map database response to UserProfile
            const userProfile: UserProfile = {
                id: data.id,
                created_at: data.created_at,
                updated_at: data.updated_at,
                user_id: data.user_id,
                email: data.email,
                avatar_url: data.avatar_url,
                display_name: data.display_name,
                role: (data.role === 'student' || data.role === 'teacher') ? data.role : null
            };

            console.log('Profile found:', userProfile);
            setProfile(userProfile);
            return userProfile;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            toast.error('Failed to load user profile');
            return null;
        }
    };

    // Initialize auth state
    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                await fetchUserProfile(session.user.id);
            }
            setLoading(false);
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                await fetchUserProfile(session.user.id);
            } else {
                setProfile(null);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signUp = async (email: string, password: string, name: string, role: 'student' | 'teacher') => {
        try {
            // Sign up the user
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name, // Store name in metadata too just in case
                        role,
                    }
                }
            });

            if (error) throw error;

            if (data.user) {
                // Create user profile in profiles table
                // Note: Trigger on auth.users usually creates this, but if manual insert is needed:
                // If using a trigger, we might confirm update. If no trigger, we insert.
                // Assuming no trigger for now or updating existing.
                // Actually, often profiles are created via triggers on auth.users insert.
                // If so, we should UPDATE not INSERT, or handle conflict.
                // But let's stick to the previous code's logic of manual insert for now, replacing table name.
                // However, `profiles` often has `id` referencing `auth.users.id`.
                // Let's try upsert or basic insert.
                const { error: profileError } = await supabase
                    .from('profiles')
                    .upsert({
                        id: data.user.id, // Assuming profile ID matches user ID which is common
                        user_id: data.user.id,
                        role,
                        display_name: name,
                        email: email
                    });

                if (profileError) {
                    console.error('Profile creation error:', profileError);
                    // If upsert failed, it might be due to RLS or trigger. 
                    // But we proceed if user created.
                    throw profileError;
                }

                toast.success('Account created successfully!');

                // Fetch the profile and navigate
                const userProfile = await fetchUserProfile(data.user.id);
                if (userProfile && (userProfile.role === 'student' || userProfile.role === 'teacher')) {
                    navigate(userProfile.role === 'student' ? '/student' : '/teacher');
                } else if (role) {
                    // If fetch failed but we know role, navigate anyway?
                    // Safer to rely on fetched profile but fallback to arg
                    navigate(role === 'student' ? '/student' : '/teacher');
                }
            }
        } catch (error) {
            const authError = error as AuthError;
            console.error('Sign up error:', error);
            toast.error(authError.message || 'Failed to create account');
            throw error;
        }
    };

    const signIn = async (email: string, password: string) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            if (data.user) {
                const userProfile = await fetchUserProfile(data.user.id);
                toast.success('Logged in successfully!');

                // Navigate based on role
                if (userProfile) {
                    const role = userProfile.role;
                    if (role === 'student' || role === 'teacher') {
                        navigate(role === 'student' ? '/student' : '/teacher');
                    } else {
                        // Handle generic or missing role
                        navigate('/');
                    }
                } else {
                    // If no profile found, sign out and throw error
                    await supabase.auth.signOut();
                    throw new Error('User profile not found. Please contact support.');
                }
            }
        } catch (error) {
            const authError = error as AuthError;
            console.error('Sign in error:', error);
            toast.error(authError.message || 'Failed to sign in');
            throw error;
        }
    };

    const signOut = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;

            setUser(null);
            setProfile(null);
            setSession(null);
            toast.success('Logged out successfully');
            navigate('/');
        } catch (error) {
            const authError = error as AuthError;
            toast.error(authError.message || 'Failed to sign out');
            throw error;
        }
    };

    const resetPassword = async (email: string) => {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) throw error;
            toast.success('Password reset email sent! Check your inbox.');
        } catch (error) {
            const authError = error as AuthError;
            toast.error(authError.message || 'Failed to send reset email');
            throw error;
        }
    };

    const value = {
        user,
        profile,
        session,
        loading,
        signUp,
        signIn,
        signOut,
        resetPassword,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
