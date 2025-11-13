import { Outlet, useNavigation, useLocation, useNavigate } from "react-router";
import { HydrateFallbackTemplate } from "~/components/HydrateFallbackTemplate";
import TitleBar from "~/components/TitleBar";
import { Toaster } from "~/components/ui/sonner";
import { useAuthStore } from "~/store/auth";
import { useEffect, useState } from "react";
import { ErrorResponse, isErrorInCategory } from "~/types/errors";

export default function RootLayout() {
  const navigation = useNavigation();
  const location = useLocation();
  const navigate = useNavigate();
  const {
    isAuthenticated,
    isLoading,
    clearAuth,
    initializeAuth
  } = useAuthStore();
  
  const [isInitializing, setIsInitializing] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const isNavigating = Boolean(navigation.location);

  // Authentication initialization on app load and route changes
  useEffect(() => {
    const initializeAuthentication = async () => {
      // Skip if we're on server-side or already authenticated
      if (typeof window === 'undefined') {
        setAuthChecked(true);
        return;
      }

      // Skip authentication check for auth routes
      const publicRoutes = ['/login', '/register', '/password-reset', '/email-verification'];
      const isPublicRoute = publicRoutes.some(route => location.pathname.startsWith(route));
      
      if (isPublicRoute) {
        setAuthChecked(true);
        return;
      }

      setIsInitializing(true);
      
      try {
        // Initialize authentication state from localStorage and validate with server
        const authSuccess = await initializeAuth();
        
        if (!authSuccess) {
          // Authentication failed, redirect to login
          navigate('/login', { replace: true });
        }
      } catch (error) {
        console.error('Authentication initialization failed:', error);
        
        // Handle standardized errors
        if (error && typeof error === 'object' && 'code' in error) {
          const err = error as ErrorResponse;
          
          // Clear auth state for authentication errors
          if (isErrorInCategory(err.code, 'AUTHENTICATION')) {
            clearAuth();
            navigate('/login', { replace: true });
          }
        } else {
          // For unexpected errors, clear auth and redirect to login
          clearAuth();
          navigate('/login', { replace: true });
        }
      } finally {
        setIsInitializing(false);
        setAuthChecked(true);
      }
    };

    initializeAuthentication();
  }, [ navigate, initializeAuth, clearAuth]);

  // Show loading state while checking authentication
  if (!authChecked || isInitializing || isLoading) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center dark:bg-gray-900">
        <HydrateFallbackTemplate />
      </div>
    );
  }

  // For public routes, render without authentication check
  const publicRoutes = ['/login', '/register', '/password-reset', '/email-verification'];
  const isPublicRoute = publicRoutes.some(route => location.pathname.startsWith(route));
  
  if (isPublicRoute) {
    return (
      <div className="h-screen bg-gray-50 flex flex-col dark:bg-gray-900">
        <div className="grow-0 shrink-0">
          <TitleBar />
        </div>
        <div className="flex-1 min-h-0 dark:bg-gray-900 text-base 2xl:text-lg">
          {isNavigating ? <HydrateFallbackTemplate className="" /> : <Outlet />}
        </div>
        <Toaster />
      </div>
    );
  }

  // If not authenticated and we've checked, show nothing (will redirect)
  if (!isAuthenticated && authChecked) {
    return null;
  }

  // Authenticated, render main content
  return (
    <div className="h-screen bg-gray-50 flex flex-col dark:bg-gray-900">
      <div className="grow-0 shrink-0">
        <TitleBar />
      </div>

      {/* Main content area - responsive font size */}
      <div className="flex-1 min-h-0 dark:bg-gray-900 text-base 2xl:text-lg">
        {isNavigating ? <HydrateFallbackTemplate
        className="h-full"
        /> : <Outlet />}
      </div>
      <Toaster />
    </div>
  );
}
