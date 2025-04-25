
import { jwtDecode } from 'jwt-decode';
import { baseQuery } from './baseQuery';
import Cookies from 'js-cookie';


const REFRESH_TOKEN_COOKIE = 'refresh_token';
const COOKIE_OPTIONS = {
  secure: true,
  sameSite: 'strict',
  path: '/',
  expires: 7 // 7 days
};

export const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const decoded = jwtDecode(token);
    if (!decoded || !decoded.exp) return true;
    // exp is in seconds, Date.now() is in milliseconds
    const expiryTime = decoded.exp * 1000;
    // Check if token expires within 1 minute
    const oneMinuteFromNow = Date.now() + 60 * 1000;
    return expiryTime <= oneMinuteFromNow;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true; // Assume expired on error
  }
};

export const getTokenExpiryDate = (token) => {
  if (!token) return null;
  
  try {
    const decoded = jwtDecode(token);
    if (!decoded || !decoded.exp) return null;
    
    // exp is in seconds, Date object expects milliseconds
    return new Date(decoded.exp * 1000);
  } catch (error) {
    console.error('Error getting token expiry date:', error);
    return null;
  }
};

export const login = async (email, password) => {
  const data = await baseQuery({
    url: '/auth/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    data: new URLSearchParams({
      username: email,
      password: password,
    }).toString(),
  });
  return data;
};

export const storeAuthTokens = (authData) => {
  if (authData.refresh_token) {
    Cookies.set(REFRESH_TOKEN_COOKIE, authData.refresh_token, COOKIE_OPTIONS);
  }
};

export const getRefreshToken = () => {
  return Cookies.get(REFRESH_TOKEN_COOKIE) || null;
};

// getAccessToken should be implemented in AuthContext and passed down via context. Remove from here.

// isAuthenticated should be implemented in AuthContext and passed down via context. Remove from here.

export const logout = async () => {
  try {
    await baseQuery({
      url: '/auth/logout',
      method: 'POST',
      headers: {
        // 'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Bearer ${getRefreshToken()}`,
      },
    });
  } catch (error) {
    console.error('Error during logout:', error);
    // Continue with cleanup even if API request fails
  } finally {
    // Remove refresh token from cookies
    Cookies.remove(REFRESH_TOKEN_COOKIE, { path: '/' });
    // Remove user data from localStorage
    // localStorage.removeItem('user_data');
    // localStorage.removeItem('user_data_timestamp');
    // Access token is handled by AuthContext state
  }
};
// getCurrentUser now requires accessToken to be passed explicitly
export const getCurrentUser = async (accessToken) => {
  if (!accessToken) {
    throw new Error('Not authenticated');
  }

  const data = await baseQuery({
    url: '/users/me',
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return data;
};

export const apiRefresh = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token found');
  }

  try {
    // The backend returns the new access token as a plain string
    const newAccessToken = await baseQuery({
      url: '/auth/token/refresh',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${refreshToken}`,
      },
    });
    // Optionally, store the new access token here if needed
    return newAccessToken;
  } catch (error) {
    console.error('Error during token refresh:', error);
    throw error;
  }
};