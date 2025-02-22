/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { auth } from '../../services/api';

const RegisterForm = () => {
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await auth.register(userData);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.location.reload(); // Or use React Router navigation
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-2xl shadow-lg">
        <h2 className="text-3xl font-bold text-center text-gray-900">
          Create your account
        </h2>

        {error && (
          <div className="bg-red-100 text-red-600 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <input
              type="text"
              required
              className="w-full px-4 py-2 rounded-xl border"
              placeholder="Full name"
              value={userData.name}
              onChange={(e) => setUserData({...userData, name: e.target.value})}
            />
            <input
              type="email"
              required
              className="w-full px-4 py-2 rounded-xl border"
              placeholder="Email address"
              value={userData.email}
              onChange={(e) => setUserData({...userData, email: e.target.value})}
            />
            <input
              type="password"
              required
              className="w-full px-4 py-2 rounded-xl border"
              placeholder="Password"
              value={userData.password}
              onChange={(e) => setUserData({...userData, password: e.target.value})}
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600"
          >
            Create Account
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm