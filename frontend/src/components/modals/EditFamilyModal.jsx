import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit2, Check, AlertCircle, UserPlus, User, Search, Mail } from 'lucide-react';
import api from '../../services/api';

const AVAILABLE_ICONS = ['👨', '👩', '👦', '👧', '👴', '👵', '🧑'];
const AVAILABLE_ROLES = ['Parent', 'Child', 'Grandparent', 'Guardian'];
const DEFAULT_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96C93D',
  '#FED766', '#A18CD1', '#FF8787', '#7FB5FF'
];

const EditFamilyModal = ({ show, onClose }) => {
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('members'); // members, add, invite
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [newMember, setNewMember] = useState({
    role: '',
    icon: '👤',
    color: DEFAULT_COLORS[0]
  });

  useEffect(() => {
    if (show) {
      fetchMembers();
    }
  }, [show]);

  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.length < 3) {
        setSearchResults([]);
        return;
      }

      try {
        const response = await api.family.searchUsers(searchQuery);
        setSearchResults(response.data);
      } catch (err) {
        console.error('Error searching users:', err);
      }
    };

    const debounceTimeout = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimeout);
  }, [searchQuery]);

  const fetchMembers = async () => {
    try {
      setIsLoading(true);
      const response = await api.family.getMembers();
      setMembers(response.data);
    } catch (err) {
      setError('Failed to fetch family members');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddExistingUser = async () => {
    if (!selectedUser || !newMember.role) {
      setError('Please select a user and role');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await api.family.addMember({
        user_id: selectedUser.id,
        role: newMember.role,
        icon: newMember.icon,
        color: newMember.color
      });

      setMembers([...members, response.data.member]);
      setSelectedUser(null);
      setNewMember({
        role: '',
        icon: '👤',
        color: DEFAULT_COLORS[0]
      });
      setActiveTab('members');
      setSuccessMessage('Family member added successfully');
    setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add family member');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteUser = async (email) => {
    if (!email || !newMember.role) {
      setError('Please enter email and role');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await api.family.inviteMember({
        email,
        role: newMember.role
      });

      setNewMember({
        role: '',
        icon: '👤',
        color: DEFAULT_COLORS[0]
      });
      setActiveTab('members');
      setSuccessMessage('Invitation sent successfully');
    setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send invitation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (id) => {
    if (!window.confirm('Are you sure you want to remove this family member? This action cannot be undone.')) return;

    try {
      setIsLoading(true);
      setError(null);
      await api.family.removeMember(id);
      setMembers(members.filter(member => member.id !== id));
    } catch (err) {
      setError('Failed to remove family member');
    } finally {
      setIsLoading(false);
    }
  };

  const MemberForm = ({ onSubmit }) => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Role *
        </label>
        <select
          value={newMember.role}
          onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
          className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select role</option>
          {AVAILABLE_ROLES.map(role => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Icon
        </label>
        <div className="flex flex-wrap gap-2 p-2 border border-gray-200 rounded-xl">
          {AVAILABLE_ICONS.map(icon => (
            <button
              key={icon}
              type="button"
              onClick={() => setNewMember({ ...newMember, icon })}
              className={`w-10 h-10 text-xl flex items-center justify-center rounded-lg transition-colors duration-200 ${newMember.icon === icon ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
                }`}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Color
        </label>
        <div className="flex flex-wrap gap-2 p-2 border border-gray-200 rounded-xl">
          {DEFAULT_COLORS.map(color => (
            <button
              key={color}
              type="button"
              onClick={() => setNewMember({ ...newMember, color })}
              className={`w-10 h-10 rounded-lg transition-all duration-200 ${newMember.color === color ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      <button
        onClick={onSubmit}
        disabled={isLoading || !newMember.role}
        className="w-full py-2 px-4 bg-blue-600 text-white rounded-xl font-medium transition-colors duration-200 flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <Check size={18} />
            Add to Family
          </>
        )}
      </button>
    </div>
  );

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl p-6 m-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Manage Family</h2>
            <p className="text-sm text-gray-500">Add and manage family members</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('members')}
            className={`px-4 py-2 rounded-xl transition-colors duration-200 ${activeTab === 'members'
                ? 'bg-blue-100 text-blue-600 font-medium'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            Current Members
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`px-4 py-2 rounded-xl transition-colors duration-200 flex items-center gap-2 ${activeTab === 'add'
                ? 'bg-blue-100 text-blue-600 font-medium'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            <UserPlus size={18} />
            Add Existing User
          </button>
          <button
            onClick={() => setActiveTab('invite')}
            className={`px-4 py-2 rounded-xl transition-colors duration-200 flex items-center gap-2 ${activeTab === 'invite'
                ? 'bg-blue-100 text-blue-600 font-medium'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            <Mail size={18} />
            Invite New User
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 flex items-center gap-2">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}
        {successMessage && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-600 flex items-center gap-2">
            <Check size={20} />
            <span>{successMessage}</span>
          </div>
        )}

        <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
          {activeTab === 'members' && (
            <div className="space-y-4">
              {members.map(member => (
                <div
                  key={member.id}
                  className="p-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                        style={{ backgroundColor: member.color + '33' }}
                      >
                        {member.icon}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{member.name}</h3>
                        <p className="text-sm text-gray-500">{member.role}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="p-2 hover:bg-red-100 rounded-xl transition-colors duration-200"
                    >
                      <Trash2 size={16} className="text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'add' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search Users
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Search by email..."
                  />
                </div>
              </div>

              {searchResults.length > 0 && (
                <div className="border border-gray-200 rounded-xl divide-y divide-gray-200">
                  {searchResults.map(user => (
                    <button
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      className={`w-full p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors duration-200 ${selectedUser?.id === user.id ? 'bg-blue-50' : ''
                        }`}
                    >
                      {user.profile_image ? (
                        <img
                          src={user.profile_image}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-500" />
                        </div>
                      )}
                      <div className="text-left">
                        <h4 className="font-medium text-gray-900">{user.name || 'Unnamed User'}</h4>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {selectedUser && (
                <div className="mt-6 p-4 border border-gray-200 rounded-xl">
                  <h4 className="font-medium text-gray-900 mb-4">Add {selectedUser.name || selectedUser.email} to Family</h4>
                  <MemberForm onSubmit={handleAddExistingUser} />
                </div>
              )}
            </div>
          )}

          {activeTab === 'invite' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter email address"
                />
              </div>

              <MemberForm onSubmit={() => handleInviteUser(searchQuery)} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditFamilyModal;