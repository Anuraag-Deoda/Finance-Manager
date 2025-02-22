import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

// Thunk for login
export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const response = await api.post('/login', credentials);
    const token = response.data.token;
    if (!token) {
      throw new Error('No token received');
    }
    // Store token in localStorage
    localStorage.setItem('token', token);
    // Set the token in axios defaults
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    return response.data;
  } catch (error) {
    localStorage.removeItem('token'); // Clear any existing token on error
    delete api.defaults.headers.common['Authorization']; // Remove from axios defaults
    return rejectWithValue(error.response?.data?.message || 'Login failed');
  }
});

// Thunk for register
export const register = createAsyncThunk('auth/register', async (credentials, { rejectWithValue }) => {
  try {
    console.log('Registering with credentials:', credentials);
    const response = await api.post('/register', credentials);
    console.log('Register response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Register error:', error.response || error);
    return rejectWithValue(error.response?.data?.message || 'Registration failed');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: localStorage.getItem('token'),
    isLoading: false,
    error: null,
    isAuthenticated: !!localStorage.getItem('token'),
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      // Clear token from localStorage and axios defaults
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Login failed';
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
      })
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Registration failed';
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;