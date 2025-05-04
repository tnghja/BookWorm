// src/api/auth.js

import { jwtDecode } from 'jwt-decode';
import { baseQuery } from './baseQuery';


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



export const logout = async () => {
  try {
    await baseQuery({
      url: '/auth/logout',
      method: 'POST',
    });
  } catch (error) {
    console.error('Error during backend logout call:', error);
 
  } finally {
      
  }
};

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
  try {
    const newAccessToken = await baseQuery({
      url: '/auth/token/refresh',
      method: 'GET',
      
    });
    return newAccessToken;
  } catch (error) {
    console.error('Error during token refresh:', error);
    throw error;
  }
};