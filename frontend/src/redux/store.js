import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import aiReducer from './aiSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    ai: aiReducer
  },
});

export default store;