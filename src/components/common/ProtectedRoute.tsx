import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAuth = true 
}) => {
  const { auth } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!auth.loading) {
      if (requireAuth && !auth.isAuthenticated) {
        const currentPath = router.asPath;
        router.push(`/auth/login?returnUrl=${encodeURIComponent(currentPath)}`);
      } else if (!requireAuth && auth.isAuthenticated) {
        router.push('/dashboard');
      }
    }
  }, [auth.loading, auth.isAuthenticated, requireAuth, router]);

  if (auth.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (requireAuth && !auth.isAuthenticated) {
    return null;
  }

  if (!requireAuth && auth.isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};
