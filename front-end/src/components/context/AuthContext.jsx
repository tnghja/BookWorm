import {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useMemo,
  // useRef // (Removed if not used)
} from 'react';
import {
  login as apiLogin,
  logout as apiLogout,
  getCurrentUser,
  apiRefresh,
  getTokenExpiryDate,
} from '@/api/auth';
import { setAxiosAccessToken } from '@/api/baseQuery';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined);
  const [prevUser, setPrevUser] = useState(undefined);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [accessToken, setAccessToken] = useState(null);
  const [tokenExpiry, setTokenExpiry] = useState(null);

  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      setError(null);
      let currentUserData = null;
      let currentToken = null;
      let currentExpiry = null;
      let currentlyAuth = false;

      try {
        const refreshData = await apiRefresh();
        currentToken = refreshData.access_token;

        if (currentToken) {
          try {
            currentExpiry = jwtDecode(currentToken).exp;
          } catch (decodeError) {
            currentToken = null;
            currentExpiry = null;
            throw new Error("Invalid token received from refresh.");
          }

          setAxiosAccessToken(currentToken);
          currentUserData = await getCurrentUser(currentToken);
          currentlyAuth = !!currentUserData;
        } else {
          currentlyAuth = false;
        }
      } catch (err) {
        currentToken = null;
        currentExpiry = null;
        currentUserData = null;
        currentlyAuth = false;
        setAxiosAccessToken(null);
      } finally {
        setAccessToken(currentToken);
        setTokenExpiry(currentExpiry);
        setUser(currentUserData);
        setIsAuthenticated(currentlyAuth);
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, []);
  
  const loginHandler = useCallback(async (email, password) => {
    setIsLoading(true);
    setError(null);
    let userBeforeLoginAttempt = undefined;
    setUser(current => {
      userBeforeLoginAttempt = current;
      return current;
    });
    setPrevUser(userBeforeLoginAttempt);

    try {
      const authData = await apiLogin(email, password);
      setAccessToken(authData.access_token);
      const expiryDate = getTokenExpiryDate(authData.access_token);
      setTokenExpiry(expiryDate);
      setAxiosAccessToken(authData.access_token);

      const userData = await getCurrentUser(authData.access_token);
      setUser(userData);
      setIsAuthenticated(true);
    } catch (err) {
      setAccessToken(null);
      setTokenExpiry(null);
      setAxiosAccessToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setError(err);
      
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logoutHandler = useCallback(async () => {
    setIsLoading(true);
    setError(null);
  const userObjectToStoreAsPrev = user;
    setPrevUser(userObjectToStoreAsPrev);

    try {
      await apiLogout();
    } catch (err) {
    } finally {
      setAccessToken(null);
      setTokenExpiry(null);
      setAxiosAccessToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
  }, [user, prevUser, isAuthenticated, isLoading, isInitialized, accessToken, tokenExpiry]);

  // --- Context Value ---
  const contextValue = useMemo(
    () => ({
      user,
      prevUser,
      isAuthenticated,
      isLoading,
      isInitialized, // Include isInitialized in the context value
      error,
      accessToken,
      tokenExpiry,
      login: loginHandler,
      logout: logoutHandler
      // refresh: initializeAuth // Usually refresh isn't exposed directly
    }),
    // Update dependencies to include isInitialized
    [user, prevUser, isAuthenticated, isLoading, isInitialized, error, accessToken, tokenExpiry, loginHandler, logoutHandler]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// --- Custom Hook ---
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  // Add a check for initialization if consumers depend on it
  // if (!context.isInitialized) {
  //   // Optionally return loading state or throw error if accessed too early
  //   console.warn("useAuth called before AuthContext is initialized.");
  // }
  return context;
};