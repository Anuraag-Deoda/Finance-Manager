/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { login, register } from '../redux/authSlice';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Mail, Lock, UserPlus, LogIn } from 'lucide-react';

const passwordRequirements = [
    { id: 'length', label: 'At least 8 characters', regex: /.{8,}/ },
    { id: 'uppercase', label: 'One uppercase letter', regex: /[A-Z]/ },
    { id: 'lowercase', label: 'One lowercase letter', regex: /[a-z]/ },
    { id: 'number', label: 'One number', regex: /[0-9]/ },
    { id: 'special', label: 'One special character', regex: /[!@#$%^&*]/ }
];

const AuthForm = ({ onSuccess }) => {
    const dispatch = useDispatch();
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [passwordStrength, setPasswordStrength] = useState({});

    const validatePassword = (password) => {
        const strength = {};
        passwordRequirements.forEach(req => {
            strength[req.id] = req.regex.test(password);
        });
        setPasswordStrength(strength);
        return Object.values(strength).every(Boolean);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!isLogin) {
            if (formData.password !== formData.confirmPassword) {
                setError('Passwords do not match');
                return;
            }
            if (!validatePassword(formData.password)) {
                setError('Password does not meet requirements');
                return;
            }
        }

        try {
            const action = isLogin ? login : register;
            await dispatch(action(formData)).unwrap();
            onSuccess();
        } catch (err) {
            setError(err.toString());
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-gray-900">
                            {isLogin ? 'Welcome Back' : 'Create Account'}
                        </h2>
                        <p className="mt-2 text-gray-600">
                            {isLogin ? 'Sign in to manage your finances' : 'Start your financial journey'}
                        </p>
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500"
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={(e) => {
                                        setFormData({ ...formData, password: e.target.value });
                                        if (!isLogin) validatePassword(e.target.value);
                                    }}
                                    className="w-full pl-10 pr-10 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        {!isLogin && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Confirm Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={formData.confirmPassword}
                                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                            className="w-full pl-10 pr-10 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-gray-700">Password Requirements:</p>
                                    <div className="space-y-1">
                                        {passwordRequirements.map(req => (
                                            <div
                                                key={req.id}
                                                className={`flex items-center space-x-2 text-sm ${passwordStrength[req.id] ? 'text-green-600' : 'text-gray-500'
                                                    }`}
                                            >
                                                <div className={`h-2 w-2 rounded-full ${passwordStrength[req.id] ? 'bg-green-500' : 'bg-gray-300'
                                                    }`} />
                                                <span>{req.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        <button
                            type="submit"
                            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-xl hover:bg-blue-700 transition duration-200"
                        >
                            {isLogin ? <LogIn className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
                            {isLogin ? 'Sign In' : 'Create Account'}
                        </button>
                    </form>

                    <div className="text-center">
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                            {isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthForm;