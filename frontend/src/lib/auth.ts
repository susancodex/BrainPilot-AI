import { jwtDecode } from "jwt-decode";

// With HttpOnly cookies, tokens are stored in cookies and sent automatically by the browser
// We don't need localStorage for token storage anymore
export const setTokens = (access: string, refresh: string) => {
  // Tokens are now stored as HttpOnly cookies by the backend
  // This function is kept for compatibility but does nothing
};

export const clearTokens = () => {
  // Tokens are cleared by the backend via cookie deletion
  // This function is kept for compatibility but does nothing
};

// Since we can't read HttpOnly cookies, we'll need to make an API call to check auth status
export const getAccessToken = () => null;
export const getRefreshToken = () => null;

export const isAuthenticated = () => {
  // With HttpOnly cookies, we can't directly check token validity from JS
  // We'll need to make an API call to verify authentication
  return true; // Optimistic - actual check happens via API calls
};
