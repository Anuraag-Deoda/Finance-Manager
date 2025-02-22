/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
/* eslint-disable no-undef */
import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Camera, Plus, Trash2, LogOut, Users, Settings, Edit, X, Check } from 'lucide-react';
import { logout } from '../redux/authSlice';
import api from '../services/api';
import { Alert, AlertDescription } from '@/components/ui/alert';

const UserProfile = ({ user, onClose }) => {
    const dispatch = useDispatch();
    const [activeTab, setActiveTab] = useState('profile');
    const [profileData, setProfileData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        profileImage: user?.profile_image || null
    });
    const [customCategories, setCustomCategories] = useState([]);
    const [familyMembers, setFamilyMembers] = useState([]);
    const [newCategory, setNewCategory] = useState({
        name: '',
        type: 'expense',
        icon: '📊',
        color: '#000000'
    });
    const [inviteEmail, setInviteEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        fetchCustomCategories();
        fetchFamilyMembers();
    }, []);

    const fetchCustomCategories = async () => {
        try {
            const response = await api.get('/custom-categories');
            setCustomCategories(response.data);
        } catch (error) {
            setError('Failed to fetch custom categories');
        }
    };

    const fetchFamilyMembers = async () => {
        try {
            const response = await api.get('/family/members');
            setFamilyMembers(response.data);
        } catch (error) {
            setError('Failed to fetch family members');
        }
    };

    const handleProfileUpdate = async () => {
        try {
            const formData = new FormData();
            formData.append('name', profileData.name);
            if (profileData.newImage) {
                formData.append('profile_image', profileData.newImage);
            }

            await api.put('/user/profile', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setSuccess('Profile updated successfully');
            setIsEditing(false);
        } catch (error) {
            setError('Failed to update profile');
        }
    };

    const handleImageSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            setProfileData({
                ...profileData,
                newImage: file,
                profileImage: URL.createObjectURL(file)
            });
        }
    };

    const handleAddCategory = async () => {
        try {
            const response = await api.post('/custom-categories', newCategory);
            setCustomCategories([...customCategories, response.data]);
            setNewCategory({ name: '', type: 'expense', icon: '📊', color: '#000000' });
            setSuccess('Category added successfully');
        } catch (error) {
            setError('Failed to add category');
        }
    };

    const handleDeleteCategory = async (categoryId) => {
        try {
            await api.delete(`/custom-categories/${categoryId}`);
            setCustomCategories(customCategories.filter(cat => cat.id !== categoryId));
            setSuccess('Category deleted successfully');
        } catch (error) {
            setError('Failed to delete category');
        }
    };

    const handleFamilyInvite = async () => {
        try {
            await api.post('/family/invite', { email: inviteEmail });
            setSuccess('Invitation sent successfully');
            setInviteEmail('');
        } catch (error) {
            setError('Failed to send invitation');
        }
    };

    const handleLogout = () => {
        dispatch(logout());
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">User Settings</h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-4 mb-6">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`px-4 py-2 rounded-xl transition-all duration-200 ${activeTab === 'profile'
                                    ? 'bg-blue-100 text-blue-600 font-medium'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Settings className="w-4 h-4" />
                                Profile
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('categories')}
                            className={`px-4 py-2 rounded-xl transition-all duration-200 ${activeTab === 'categories'
                                    ? 'bg-blue-100 text-blue-600 font-medium'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Plus className="w-4 h-4" />
                                Categories
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('family')}
                            className={`px-4 py-2 rounded-xl transition-all duration-200 ${activeTab === 'family'
                                    ? 'bg-blue-100 text-blue-600 font-medium'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                Family
                            </div>
                        </button>
                    </div>

                    {/* Alerts */}
                    {error && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    {success && (
                        <Alert className="mb-4 bg-green-50 text-green-600">
                            <AlertDescription>{success}</AlertDescription>
                        </Alert>
                    )}

                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <div className="space-y-6">
                            {/* Profile Image */}
                            <div className="flex items-center gap-6">
                                <div className="relative">
                                    {profileData.profileImage ? (
                                        <img
                                            src={profileData.profileImage}
                                            alt="Profile"
                                            className="w-24 h-24 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                                            <Camera className="w-8 h-8 text-gray-400" />
                                        </div>
                                    )}
                                    <label className="absolute bottom-0 right-0 p-2 bg-blue-500 rounded-full cursor-pointer hover:bg-blue-600 transition-colors duration-200">
                                        <Camera className="w-4 h-4 text-white" />
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleImageSelect}
                                        />
                                    </label>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-semibold text-gray-900">{profileData.name}</h3>
                                    <p className="text-gray-500">{profileData.email}</p>
                                </div>
                            </div>

                            {/* Profile Form */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                    <input
                                        type="text"
                                        value={profileData.name}
                                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500"
                                        disabled={!isEditing}
                                    />
                                </div>

                                <div className="flex justify-end gap-4">
                                    {isEditing ? (
                                        <>
                                            <button
                                                onClick={() => setIsEditing(false)}
                                                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleProfileUpdate}
                                                className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600"
                                            >
                                                Save Changes
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600"
                                        >
                                            Edit Profile
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Categories Tab */}
                    {activeTab === 'categories' && (
                        <div className="space-y-6">
                            {/* Add New Category */}
                            <div className="bg-gray-50 p-4 rounded-xl space-y-4">
                                <h3 className="font-medium text-gray-900">Add New Category</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        type="text"
                                        value={newCategory.name}
                                        onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                                        placeholder="Category Name"
                                        className="px-4 py-2 border rounded-xl"
                                    />
                                    <select
                                        value={newCategory.type}
                                        onChange={(e) => setNewCategory({ ...newCategory, type: e.target.value })}
                                        className="px-4 py-2 border rounded-xl"
                                    >
                                        <option value="expense">Expense</option>
                                        <option value="income">Income</option>
                                    </select>
                                    <input
                                        type="text"
                                        value={newCategory.icon}
                                        onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                                        placeholder="Emoji Icon"
                                        className="px-4 py-2 border rounded-xl"
                                    />
                                    <input
                                        type="color"
                                        value={newCategory.color}
                                        onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                                        className="px-4 py-2 border rounded-xl"
                                    />
                                </div>
                                <button
                                    onClick={handleAddCategory}
                                    className="w-full px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600"
                                >
                                    Add Category
                                </button>
                            </div>

                            {/* Category List */}
                            <div className="space-y-4">
                                <h3 className="font-medium text-gray-900">Custom Categories</h3>
                                <div className="divide-y divide-gray-100">
                                    {customCategories.map((category) => (
                                        <div
                                            key={category.id}
                                            className="py-4 flex items-center justify-between group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <span className="text-2xl">{category.icon}</span>
                                                <div>
                                                    <h4 className="font-medium text-gray-900">{category.name}</h4>
                                                    <p className="text-sm text-gray-500 capitalize">{category.type}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteCategory(category.id)}
                                                className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-100 rounded-full transition-all duration-200"
                                            >
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Family Tab */}
                    {activeTab === 'family' && (
                        <div className="space-y-6">
                            {/* Invite Member */}
                            <div className="bg-gray-50 p-4 rounded-xl space-y-4">
                                <h3 className="font-medium text-gray-900">Invite Family Member</h3>
                                <div className="flex gap-4">
                                    <input
                                        type="email"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        placeholder="Enter email address"
                                        className="flex-1 px-4 py-2 border rounded-xl"
                                    />
                                    <button
                                        onClick={handleFamilyInvite}
                                        className="px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600"
                                    >
                                        Send Invite
                                    </button>
                                </div>
                            </div>

                            {/* Family Members List */}
                            <div className="space-y-4">
                                <h3 className="font-medium text-gray-900">Family Members</h3>
                                <div className="divide-y divide-gray-100">
                                    {familyMembers.map((member) => (
                                        <div key={member.id} className="py-4 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                {member.profile_image ? (
                                                    <img
                                                        src={member.profile_image}
                                                        alt={member.name}
                                                        className="w-10 h-10 rounded-full"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                                        <Users className="w-5 h-5 text-gray-400" />
                                                    </div>
                                                )}
                                                <div>
                                                    <h4 className="font-medium text-gray-900">{member.name}</h4>
                                                    <p className="text-sm text-gray-500">{member.email}</p>
                                                    <span className="text-xs text-gray-400 capitalize">{member.role}</span>
                                                </div>
                                            </div>
                                            {member.id !== user.id && (
                                                <button
                                                    onClick={() => handleRemoveMember(member.id)}
                                                    className="p-2 hover:bg-red-100 rounded-full transition-colors duration-200"
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Logout Button */}
                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors duration-200"
                        >
                            <LogOut className="w-4 h-4" />
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;