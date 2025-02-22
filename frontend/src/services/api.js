// api.js
import axios from 'axios';
import store from '../redux/store';
import { logout } from '../redux/authSlice';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // For debugging
    console.log('Request config:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      data: config.data
    });
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => {
    // For debugging
    console.log('Response:', {
      status: response.status,
      data: response.data,
      headers: response.headers
    });
    return response;
  },
  (error) => {
    console.error('Response error:', error.response || error);
    
    if (error.response) {
      // Handle 401 and 422 errors
      if (error.response.status === 401 || error.response.status === 422) {
        console.log('Token error detected, logging out...');
        // Clear token and logout user
        store.dispatch(logout());
      }
    }
    return Promise.reject(error);
  }
);

// Initialize headers if token exists
const token = localStorage.getItem('token');
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export default api;