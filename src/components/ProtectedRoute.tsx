import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
    children: ReactNode;
    allowedRoles?: ('student' | 'teacher')[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
    const { user, profile, loading } = useAuth();
    const location = useLocation();

    console.log('ProtectedRoute: State check', { user: !!user, profile, loading, allowedRoles });

    // Show loading spinner while checking authentication
    if (loading) {
        console.log('ProtectedRoute: Still loading...');
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
                    <p className="text-slate-300 text-lg">Loading...</p>
                </div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!user) {
        console.log('ProtectedRoute: No user, redirecting to login');
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check role-based access if roles are specified
    if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
        console.log('ProtectedRoute: Role mismatch', { profileRole: profile.role, allowedRoles });
        // Redirect to appropriate dashboard based on user's role
        const redirectPath = profile.role === 'student' ? '/student' : '/teacher';
        return <Navigate to={redirectPath} replace />;
    }

    console.log('ProtectedRoute: Access granted, rendering children');
    return <>{children}</>;
};
