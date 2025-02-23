import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login, register } from '../redux/authSlice';
import { useNavigate } from 'react-router-dom';
import AuthPage from '../components/AuthPage';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector((state) => state.auth);

  const handleLogin = async (credentials) => {
    try {
      await dispatch(login(credentials)).unwrap();
      navigate('/dashboard');
    } catch {
      // Error handling is managed by authSlice
    }
  };

  const handleRegister = async (credentials) => {
    try {
      await dispatch(register(credentials)).unwrap();
      // After successful registration, log them in
      await dispatch(login(credentials)).unwrap();
      navigate('/dashboard');
    } catch {
      // Error handling is managed by authSlice
    }
  };

  return (
    <AuthPage
      onLogin={handleLogin}
      onRegister={handleRegister}
      isLoading={isLoading}
      error={error}
    />
  );
};

export default Login;