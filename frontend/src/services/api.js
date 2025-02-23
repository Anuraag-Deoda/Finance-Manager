import axios from 'axios';
import store from '../redux/store';
import { logout } from '../redux/authSlice';

const api = axios.create({
  baseURL: 'http://localhost:5000/api/',
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
  async (error) => {
    console.error('Response error:', error.response || error);
    
    if (error.response) {
      // Handle 401 (Unauthorized) and 422 (Unprocessable Entity - Invalid Token)
      if (error.response.status === 401 || error.response.status === 422) {
        console.log('Token error detected, logging out...');
        store.dispatch(logout());
      }
      
      // Handle 403 (Forbidden - No family access)
      if (error.response.status === 403 && error.response.data?.message?.includes('family')) {
        // Optionally handle family-specific access errors
        console.log('Family access error:', error.response.data.message);
      }
    }
    return Promise.reject(error);
  }
);

// Family-related API calls
const familyApi = {
  createFamily: (data) => api.post('/family/create', data),
  getMembers: () => api.get('/family/members'),
  addMember: (data) => api.post('/family/members/add', data),
  updateMember: (id, data) => api.put(`/family/members/${id}`, data),
  removeMember: (id) => api.delete(`/family/members/${id}`),
  inviteMember: (data) => api.post('/family/members/invite', data),
  searchUsers: (query) => api.get(`/family/users/search`, { params: { query } }), // Better way to handle query params
};

// User profile API calls
const userApi = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data) => api.put('/user/profile', data),
  uploadProfileImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await api.post('/user/profile/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  }
};

export const isValidImageUrl = (url) => {
  if (!url) return false;
  const trimmedUrl = url.trim();
  return trimmedUrl !== '' && 
         trimmedUrl !== 'null' && 
         trimmedUrl !== 'undefined' &&
         trimmedUrl !== 'none';
};

// Add helper function to get profile image URL
export const getProfileImageUrl = (baseUrl) => {
  if (!isValidImageUrl(baseUrl)) return null;
  // If it's a full URL, return as is
  if (baseUrl.startsWith('http')) return baseUrl;
  // Otherwise, prepend the API base URL
  return `${api.defaults.baseURL}${baseUrl}`;
};

// Categories API calls
const categoriesApi = {
  getCategories: () => api.get('/categories'),
  createCategory: (data) => api.post('/categories', data),
  updateCategory: (id, data) => api.put(`/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/categories/${id}`),
};

// Extend the api object with the new endpoints
Object.assign(api, {
  family: familyApi,
  user: userApi,
  categories: categoriesApi,
});

// Initialize headers if token exists
const token = localStorage.getItem('token');
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export default api;