import axios from 'axios';

// Create a configured Axios instance
const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create a function to set the auth token that can be called from outside
let accessToken = null;
export const setAxiosAccessToken = (token) => {
  accessToken = token;
};

export const getAxiosAccessToken = () => {
  return accessToken;
};
// Request interceptor for token injection using the state-managed token
api.interceptors.request.use(config => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

export async function baseQuery({ url, method = 'get', data, params, headers }) {
  try {
    const response = await api.request({
      url,
      method,
      data,
      params,
      headers,
    });
    return response.data;
  } catch (error) {
    // Normalize error for React Query
    throw (
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      'Unknown error'
    );
  }
}
