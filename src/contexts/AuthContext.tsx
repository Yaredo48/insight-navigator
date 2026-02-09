import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface UserProfile {
    id: string;
    role: 'student' | 'teacher';
    name: string | null;
    created_at: string;
    updated_at: string;
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
                .from('user_profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Supabase query error:', error);
                throw error;
            }
            console.log('Profile found:', data);
            setProfile(data);
            return data;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            // Return null but let caller handle it, or maybe throw?
            // For now, returning null is handled in signIn/signUp
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
            });

            if (error) throw error;

            if (data.user) {
                // Create user profile
                const { error: profileError } = await supabase
                    .from('user_profiles')
                    .insert({
                        id: data.user.id,
                        role,
                        name,
                    });

                if (profileError) throw profileError;

                toast.success('Account created successfully!');

                // Fetch the profile and navigate
                const userProfile = await fetchUserProfile(data.user.id);
                if (userProfile) {
                    navigate(role === 'student' ? '/student' : '/teacher');
                }
            }
        } catch (error) {
            const authError = error as AuthError;
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
                    // alert(`Login successful! Redirecting to /${userProfile.role}`); // Debugging
                    navigate(userProfile.role === 'student' ? '/student' : '/teacher');
                } else {
                    // If no profile found, sign out and throw error
                    await supabase.auth.signOut();
                    throw new Error('User profile not found. Please contact support.');
                }
            }
        } catch (error) {
            const authError = error as AuthError;
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
