import { Outlet, useNavigation, useLocation, useNavigate } from "react-router";
import { HydrateFallbackTemplate } from "~/components/HydrateFallbackTemplate";
import TitleBar from "~/components/TitleBar";
import { Toaster } from "~/components/ui/sonner";
import { useAuthStore } from "~/store/auth";
import { useEffect, useState } from "react";
import { ScrollArea } from "~/components/ui/scroll-area";

export default function RootLayout() {
  const navigation = useNavigation();
  const location = useLocation();
  const navigate = useNavigate();
  const {
    verifyToken,
    isAuthenticated,
    isLoading,
    clearAuth,
    ensureValidToken
  } = useAuthStore();
  
  const [isVerifying, setIsVerifying] = useState(false);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  const isNavigating = Boolean(navigation.location);

  // SSR-friendly authentication check
  useEffect(() => {
    const checkAuthentication = async () => {
      // Skip if we're already authenticated or on client-side without localStorage
      if (isAuthenticated || typeof window === 'undefined') {
        setHasCheckedAuth(true);
        return;
      }

      setIsVerifying(true);
      
      try {
        // Check if we have a token
        const token = localStorage.getItem('Authorization');
        
        if (!token) {
          // No token, redirect to login
          navigate('/login', { replace: true });
          setHasCheckedAuth(true);
          return;
        }

        // Ensure token is valid and refresh if needed
        const isValid = await ensureValidToken();
        
        if (!isValid) {
          // Token is invalid or couldn't be refreshed
          navigate('/login', { replace: true });
          setHasCheckedAuth(true);
          return;
        }

        // Verify token with server
        const tokenValid = await verifyToken();
        
        if (!tokenValid) {
          // Token verification failed
          navigate('/login', { replace: true });
          setHasCheckedAuth(true);
          return;
        }

        setHasCheckedAuth(true);
      } catch (error) {
        console.error('Authentication check failed:', error);
        clearAuth();
        navigate('/login', { replace: true });
        setHasCheckedAuth(true);
      } finally {
        setIsVerifying(false);
      }
    };

    checkAuthentication();
  }, [location.pathname, isAuthenticated]);

  // Show loading state while checking authentication
  if ((isLoading || isVerifying || !hasCheckedAuth) && !isAuthenticated) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center dark:bg-gray-900">
        <HydrateFallbackTemplate />
      </div>
    );
  }

  // If not authenticated and we've checked, show nothing (will redirect)
  if (!isAuthenticated && hasCheckedAuth) {
    return null;
  }

  // Authenticated, render main content
  return (
    <div className="h-screen bg-gray-50 flex flex-col dark:bg-gray-900">
      
      <div className="grow-0 shrink-0">
        <TitleBar />
      </div>

      {/* Main content area - responsive font size */}
      <ScrollArea className="h-[calc(100vh-54px)] overflow-y-auto dark:bg-gray-900 text-base 2xl:text-lg">
        {isNavigating ? <HydrateFallbackTemplate
        className="h-[calc(100vh-54px)]"
        /> : <Outlet />}
      </ScrollArea>
      <Toaster />
    </div>
  );
}
