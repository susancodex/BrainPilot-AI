import { jwtDecode } from "jwt-decode";

export const setTokens = (access: string, refresh: string) => {
  localStorage.setItem("access_token", access);
  localStorage.setItem("refresh_token", refresh);
};

export const clearTokens = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
};

export const getAccessToken = () => localStorage.getItem("access_token");
export const getRefreshToken = () => localStorage.getItem("refresh_token");

export const isAuthenticated = () => {
  const token = getAccessToken();
  if (!token) return false;
  
  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    // Return true if token is not expired (with a 5 second buffer)
    return decoded.exp !== undefined && decoded.exp > currentTime + 5;
  } catch (e) {
    return false;
  }
};
