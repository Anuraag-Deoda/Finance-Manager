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
    
    // Check if token exists
    if (!token) {
      console.log('No token found, logging out...');
      store.dispatch(logout());
      return Promise.reject(new Error('Authentication required'));
    }
    
    config.headers.Authorization = `Bearer ${token}`;
    
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
      // Handle 401 (Unauthorized), 403 (Forbidden), and 422 (Unprocessable Entity - Invalid Token)
      if (error.response.status === 401 || error.response.status === 422) {
        console.log('Token error detected, logging out...');
        localStorage.removeItem('token'); // Clear token
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

// AI-related API calls
const aiApi = {
  // Chat with AI
  chat: (message) => api.post('/ai/chat', { message }),
  
  // Get AI insights
  getInsights: (transactions) => api.post('/ai/analyze', { transactions }),
  
  // Get budget recommendations
  getBudgetRecommendations: (currentBudget, monthlyIncome) => 
    api.post('/ai/budget/recommendations', { currentBudget, monthlyIncome }),
  
  // Generate AI report
  generateReport: (startDate, endDate) => 
    api.post('/ai/generate-report', { startDate, endDate }),
  
  // Get savings plan
  getSavingsPlan: (goal, targetDate = null) => 
    api.post('/ai/savings-plan', { goal, targetDate }),
  
  // Optimize family budget
  optimizeFamilyBudget: (familyMembers, totalBudget) => 
    api.post('/ai/family/optimize-budget', { familyMembers, totalBudget }),
  
  // Get AI notifications
  getNotifications: () => api.get('/ai/notifications'),
  
  // Mark notification as read
  markNotificationRead: (notificationId) => 
    api.put(`/ai/notifications/${notificationId}/read`)
};

// Monthly Plans API calls
const monthlyPlansApi = {
  getMonthlyPlan: async (month) => {
    console.log('Fetching monthly plan for:', month);
    try {
      const response = await api.get(`/monthly-plans/${month}`);
      console.log('Monthly plan response:', response.data);
      return response;
    } catch (error) {
      console.error('Error fetching monthly plan:', error.response?.data || error);
      throw error;
    }
  },
  
  createMonthlyPlan: async (month, data) => {
    console.log('Creating monthly plan for:', month, 'with data:', data);
    if (!data.expectedIncome || !data.expectedExpenses) {
      throw new Error('Invalid monthly plan data: missing required fields');
    }
    try {
      const response = await api.post(`/monthly-plans/${month}`, data);
      console.log('Monthly plan created:', response.data);
      return response;
    } catch (error) {
      console.error('Error creating monthly plan:', error.response?.data || error);
      throw error;
    }
  },
  
  updateMonthlyPlan: async (month, data) => {
    console.log('Updating monthly plan for:', month, 'with data:', data);
    if (!data.expectedIncome || !data.expectedExpenses) {
      throw new Error('Invalid monthly plan data: missing required fields');
    }
    try {
      const response = await api.put(`/monthly-plans/${month}`, data);
      console.log('Monthly plan updated:', response.data);
      return response;
    } catch (error) {
      console.error('Error updating monthly plan:', error.response?.data || error);
      throw error;
    }
  },
  
  deleteMonthlyPlan: async (month) => {
    console.log('Deleting monthly plan for:', month);
    try {
      const response = await api.delete(`/monthly-plans/${month}`);
      console.log('Monthly plan deleted:', response.data);
      return response;
    } catch (error) {
      console.error('Error deleting monthly plan:', error.response?.data || error);
      throw error;
    }
  },
  
  // Helper function to determine if response indicates a family plan
  isFamilyPlan: (response) => {
    if (!response?.data) {
      console.warn('Invalid response for family plan check:', response);
      return false;
    }
    return response.data.is_family_plan === true;
  },
  
  // Validate monthly plan data structure
  validatePlanData: (data) => {
    const errors = [];
    if (!Array.isArray(data.expectedIncome)) {
      errors.push('expectedIncome must be an array');
    }
    if (!Array.isArray(data.expectedExpenses)) {
      errors.push('expectedExpenses must be an array');
    }
    if (errors.length > 0) {
      throw new Error(`Invalid plan data: ${errors.join(', ')}`);
    }
    return true;
  }
};

// Extend the api object with the new endpoints
Object.assign(api, {
  family: familyApi,
  user: userApi,
  categories: categoriesApi,
  ai: aiApi,
  monthlyPlans: monthlyPlansApi
});

// Initialize headers if token exists
const token = localStorage.getItem('token');
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export default api;