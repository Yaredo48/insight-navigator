import { createContext, useContext, useState, ReactNode } from 'react';
import { toast } from 'sonner';

interface UserProfile {
    id: string;
    role: 'student' | 'teacher';
    name: string | null;
    created_at: string;
    updated_at: string;
}

interface AuthContextType {
    user: any;
    profile: UserProfile | null;
    session: any;
    loading: boolean;
    signUp: (email: string, password: string, name: string, role: 'student' | 'teacher') => Promise<void>;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<any>({
        id: 'guest-user-id',
        email: 'guest@example.com',
        user_metadata: { name: 'Guest User', role: 'student' },
    });
    const [profile, setProfile] = useState<UserProfile | null>({
        id: 'guest-user-id',
        role: 'student',
        name: 'Guest User',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    });
    const [session] = useState<any>(null);
    const [loading] = useState(false);

    const signUp = async (email: string, password: string, name: string, role: 'student' | 'teacher') => {
        console.log('Mock Sign Up:', { email, name, role });
        setProfile({
            id: 'guest-user-id',
            role,
            name,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        });
        window.location.href = role === 'student' ? '/student' : '/teacher';
    };

    const signIn = async (email: string, password: string) => {
        console.log('Mock Sign In:', email);
        toast.success('Signed in as Guest');
    };

    const signOut = async () => {
        console.log('Mock Sign Out');
        window.location.href = '/';
    };

    const resetPassword = async (email: string) => {
        console.log('Mock Reset Password:', email);
        toast.success('Password reset email simulated');
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
