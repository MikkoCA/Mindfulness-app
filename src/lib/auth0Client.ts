// Auth0 client utility for authentication

// Define the Auth0 configuration
const auth0Config = {
  domain: 'dev-gpya6w7bujdxiibs.us.auth0.com',
  clientId: 'uTKAd4iRzETMA7q7nsJGcKsOBMVkbRZQ',
  redirectUri: process.env.NEXT_PUBLIC_APP_URL || 'https://mindfulness-app-ngpm.vercel.app',
  audience: '',
  scope: 'openid profile email'
};

// User storage key for localStorage
export const USER_STORAGE_KEY = 'mindfulness_current_user';

// Get user from localStorage
export const getStoredUser = () => {
  if (typeof window === 'undefined') return null;
  const userData = localStorage.getItem(USER_STORAGE_KEY);
  return userData ? JSON.parse(userData) : null;
};

// Store user in localStorage
export const storeUser = (user: any) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
};

// Remove user from localStorage
export const removeStoredUser = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(USER_STORAGE_KEY);
};

// Generate an Auth0 login URL
export const getLoginUrl = () => {
  const redirectUri = `${auth0Config.redirectUri}/api/auth/callback`;
  
  return `https://${auth0Config.domain}/authorize?` +
    `client_id=${auth0Config.clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(auth0Config.scope)}`;
};

// Generate an Auth0 logout URL
export const getLogoutUrl = () => {
  const returnTo = encodeURIComponent(auth0Config.redirectUri);
  
  return `https://${auth0Config.domain}/v2/logout?` +
    `client_id=${auth0Config.clientId}` +
    `&returnTo=${returnTo}`;
};

// Check if a user is authenticated
export const isAuthenticated = () => {
  return !!getStoredUser();
};

// Parse the URL for auth-related parameters
export const parseAuthParameters = () => {
  if (typeof window === 'undefined') return null;
  
  const params = new URLSearchParams(window.location.search);
  
  return {
    code: params.get('code'),
    state: params.get('state'),
    error: params.get('error'),
    errorDescription: params.get('error_description'),
    authSuccess: params.get('auth') === 'success'
  };
}; 