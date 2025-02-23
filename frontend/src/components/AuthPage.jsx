import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle, Check, Wallet, PieChart, TrendingUp, Users, Calendar } from 'lucide-react';

const AuthPage = ({ onLogin, onRegister, isLoading, error }) => {
  const [isRegisterActive, setIsRegisterActive] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [passwordStrength, setPasswordStrength] = useState({
    hasLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecial: false
  });

  const validatePassword = (password) => {
    setPasswordStrength({
      hasLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'password') {
      validatePassword(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isRegisterActive) {
      const isValidPassword = Object.values(passwordStrength).every(Boolean);
      if (!isValidPassword) {
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        return;
      }
      onRegister(formData);
    } else {
      onLogin(formData);
    }
  };

  const passwordRequirements = [
    { key: 'hasLength', label: 'At least 8 characters' },
    { key: 'hasUpperCase', label: 'One uppercase letter' },
    { key: 'hasLowerCase', label: 'One lowercase letter' },
    { key: 'hasNumber', label: 'One number' },
    { key: 'hasSpecial', label: 'One special character' }
  ];

  const features = [
    {
      icon: <Wallet className="w-6 h-6 text-blue-500" />,
      title: 'Smart Expense Tracking',
      description: 'Track your daily expenses and income with intuitive categorization'
    },
    {
      icon: <PieChart className="w-6 h-6 text-purple-500" />,
      title: 'Visual Analytics',
      description: 'Get insights with beautiful charts and detailed spending analysis'
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-green-500" />,
      title: 'Budget Management',
      description: 'Set and track budgets with real-time monitoring and alerts'
    },
    {
      icon: <Users className="w-6 h-6 text-amber-500" />,
      title: 'Family Sharing',
      description: 'Share and manage finances with family members seamlessly'
    },
    {
      icon: <Calendar className="w-6 h-6 text-red-500" />,
      title: 'Monthly Planning',
      description: 'Plan your monthly expenses and track your financial goals'
    }
  ];

  return (
    <div className="min-h-screen flex items-stretch bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Features Section */}
      <div className="hidden lg:flex lg:w-1/2 p-8 items-center justify-center bg-white">
        <div className="max-w-lg">
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Finance Tracker
            </h1>
            <p className="text-lg text-gray-600">
              Your all-in-one solution for personal and family finance management
            </p>
          </div>

          <div className="space-y-8">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="p-2 bg-gray-50 rounded-xl">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Auth Forms Section */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md relative">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="relative">
              <div 
                className="flex transition-transform duration-500 ease-in-out"
                style={{ 
                  width: '200%',
                  transform: `translateX(${isRegisterActive ? '-50%' : '0%'})` 
                }}
              >
                {/* Login Form */}
                <div className="w-1/2 p-8">
                  <h2 className="text-3xl font-bold text-gray-800 mb-6">Welcome Back</h2>
                  <p className="text-gray-600 mb-8">Please sign in to your account</p>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="you@example.com"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="••••••••"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>

                    {error && (
                      <div className="p-3 rounded-lg bg-red-50 text-red-600 flex items-center gap-2">
                        <AlertCircle size={20} />
                        <span>{error}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors duration-200 flex items-center justify-center"
                    >
                      {isLoading ? (
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        'Sign In'
                      )}
                    </button>
                  </form>

                  <p className="mt-6 text-center text-gray-600">
                    Don't have an account?{' '}
                    <button
                      onClick={() => setIsRegisterActive(true)}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Sign Up
                    </button>
                  </p>
                </div>

                {/* Register Form */}
                <div className="w-1/2 p-8">
                  <h2 className="text-3xl font-bold text-gray-800 mb-6">Create Account</h2>
                  <p className="text-gray-600 mb-8">Join us today!</p>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="you@example.com"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="••••••••"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>

                      <div className="mt-2 space-y-2">
                        {passwordRequirements.map(({ key, label }) => (
                          <div
                            key={key}
                            className="flex items-center gap-2 text-sm"
                          >
                            {passwordStrength[key] ? (
                              <Check size={16} className="text-green-500" />
                            ) : (
                              <AlertCircle size={16} className="text-gray-400" />
                            )}
                            <span className={passwordStrength[key] ? 'text-green-500' : 'text-gray-500'}>
                              {label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm Password
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="••••••••"
                        required
                      />
                    </div>

                    {error && (
                      <div className="p-3 rounded-lg bg-red-50 text-red-600 flex items-center gap-2">
                        <AlertCircle size={20} />
                        <span>{error}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors duration-200 flex items-center justify-center"
                    >
                      {isLoading ? (
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        'Create Account'
                      )}
                    </button>
                  </form>

                  <p className="mt-6 text-center text-gray-600">
                    Already have an account?{' '}
                    <button
                      onClick={() => setIsRegisterActive(false)}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Sign In
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;