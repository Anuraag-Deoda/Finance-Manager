// src/services/api.js
import axios from "axios";

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
      'Content-Type': 'application/json'
  },
  withCredentials: true
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
      console.log('Request:', {
          url: config.url,
          method: config.method,
          data: config.data,
          headers: config.headers
      });
      return config;
  },
  (error) => {
      console.error('Request Error:', error);
      return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log("API Response:", response);
    return response;
  },
  (error) => {
    console.error("API Response Error:", error);
    return Promise.reject(error);
  }
);

// Define auth service
// frontend/src/services/api.js
export const auth = {
  register: async (userData) => {
      console.log('Register API call with data:', userData);
      try {
          const response = await api.post('/auth/register', {
              name: userData.name,
              email: userData.email,
              password: userData.password
          });
          console.log('Register success:', response.data);
          return response;
      } catch (error) {
        if (error.response?.status === 400 && error.response.data?.error === 'User already exists') {
          // Special handling for already registered users
          throw new Error('ALREADY_REGISTERED');
      }
          throw error;
      }
  },

  login: async (credentials) => {
    console.log("Making login request with:", credentials);
    const response = await api.post("/auth/login", credentials);
    console.log("Login response:", response);
    return response;
  },

  validateToken: async () => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No token found");

    const response = await api.get("/auth/validate", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  },
};

// Export both the axios instance and auth service
export { api };

// Default export for backward compatibility
export default {
  api,
  auth,
};
