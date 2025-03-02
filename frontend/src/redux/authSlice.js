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
    localStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // Fetch user profile after successful login
    const profileResponse = await api.get('/user/profile');
    return { ...response.data, profile: profileResponse.data };
  } catch (error) {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    return rejectWithValue(error.response?.data?.message || 'Login failed');
  }
});

// Thunk for register
export const register = createAsyncThunk('auth/register', async (credentials, { rejectWithValue }) => {
  try {
    const response = await api.post('/register', credentials);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Registration failed');
  }
});

// Thunk for fetching user profile
export const fetchUserProfile = createAsyncThunk('auth/fetchProfile', async (_, { rejectWithValue }) => {
  try {
    const response = await api.user.getProfile();  // Use the grouped API call
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch profile');
  }
});

// Thunk for updating user profile
export const updateUserProfile = createAsyncThunk('auth/updateProfile', async (profileData, { rejectWithValue }) => {
  try {
    const response = await api.put('/user/profile', profileData);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
  }
});

// Thunk for getting family members
export const getFamilyMembers = createAsyncThunk('auth/getFamilyMembers', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/family/members');
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch family members');
  }
});

// Thunk for inviting family member
export const inviteFamilyMember = createAsyncThunk('auth/inviteFamilyMember', async (email, { rejectWithValue }) => {
  try {
    const response = await api.post('/family/invite', { email });
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to invite family member');
  }
});

// Thunk for removing family member
export const removeFamilyMember = createAsyncThunk('auth/removeFamilyMember', async (memberId, { rejectWithValue }) => {
  try {
    const response = await api.delete(`/family/members/${memberId}`);
    return { memberId, ...response.data };
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to remove family member');
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
    profile: null,
    family: {
      members: [],
      isLoading: false,
      error: null
    }
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      state.profile = null;
      state.family = {
        members: [],
        isLoading: false,
        error: null
      };
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
    },
    clearError: (state) => {
      state.error = null;
      state.family.error = null;
    },
    setProfile: (state, action) => {
      state.profile = action.payload;
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
        state.profile = action.payload.profile;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Login failed';
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
        state.profile = null;
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
      })
      // Fetch Profile
      .addCase(fetchUserProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update Profile
      .addCase(updateUserProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Family Members
      .addCase(getFamilyMembers.pending, (state) => {
        state.family.isLoading = true;
        state.family.error = null;
      })
      .addCase(getFamilyMembers.fulfilled, (state, action) => {
        state.family.isLoading = false;
        state.family.members = action.payload;
        state.family.error = null;
      })
      .addCase(getFamilyMembers.rejected, (state, action) => {
        state.family.isLoading = false;
        state.family.error = action.payload;
      })
      // Invite Family Member
      .addCase(inviteFamilyMember.pending, (state) => {
        state.family.isLoading = true;
        state.family.error = null;
      })
      .addCase(inviteFamilyMember.fulfilled, (state, action) => {
        state.family.isLoading = false;
        state.family.members.push(action.payload);
        state.family.error = null;
      })
      .addCase(inviteFamilyMember.rejected, (state, action) => {
        state.family.isLoading = false;
        state.family.error = action.payload;
      })
      // Remove Family Member
      .addCase(removeFamilyMember.pending, (state) => {
        state.family.isLoading = true;
        state.family.error = null;
      })
      .addCase(removeFamilyMember.fulfilled, (state, action) => {
        state.family.isLoading = false;
        state.family.members = state.family.members.filter(member => member.id !== action.payload.memberId);
        state.family.error = null;
      })
      .addCase(removeFamilyMember.rejected, (state, action) => {
        state.family.isLoading = false;
        state.family.error = action.payload;
      });
  },
});

export const { logout, clearError, setProfile } = authSlice.actions;
export default authSlice.reducer;