import React, { useState, useRef } from 'react';
import { User, Settings, LogOut, UserPlus, Grid, Users, Lightbulb } from 'lucide-react';
import EditProfileModal from './modals/EditProfileModal';
import EditCategoriesModal from './modals/EditCategoriesModal';
import EditFamilyModal from './modals/EditFamilyModal';
import { isValidImageUrl, getProfileImageUrl } from '../services/api';
import { toast } from 'react-hot-toast';

const UserProfile = ({ user, onLogout }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showEditCategories, setShowEditCategories] = useState(false);
  const [showEditFamily, setShowEditFamily] = useState(false);
  const [showInviteFamily, setShowInviteFamily] = useState(false);
  const [savingsGoal, setSavingsGoal] = useState({
    name: '',
    amount: '',
    targetDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [savingsPlan, setSavingsPlan] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('insights');
  
  const dropdownRef = useRef(null);

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setShowDropdown(false);
    }
  };

  React.useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Helper function to get user display name
  const getDisplayName = () => {
    if (user?.name && user.name.trim() !== '') {
      return user.name;
    }
    return user?.email?.split('@')[0] || 'User';
  };

  // Get the profile image URL
  const getProfileImage = () => {
    if (!user || !user.profile_image) return null;
    return getProfileImageUrl(user.profile_image);
  };

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const response = await api.ai.getInsights(transactions);
      if (response.data && response.data.insights) {
        setInsights(response.data.insights);
      } else {
        setInsights([
          {
            type: 'tip',
            title: 'Start tracking your expenses',
            description: 'Add more transactions to get personalized insights about your spending habits.'
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching AI insights:', error);
      setInsights([
        {
          type: 'alert',
          title: 'Could not analyze your transactions',
          description: 'We encountered an error while analyzing your transactions. Please try again later.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBudgetRecommendations = async () => {
    try {
      const currentBudget = categories.reduce((acc, category) => {
        acc[category.name] = category.budget || 0;
        return acc;
      }, {});
      
      const response = await api.ai.getBudgetRecommendations(currentBudget, monthlyIncome);
      if (response.data && response.data.recommendations) {
        setRecommendations(response.data.recommendations);
      }
    } catch (error) {
      console.error('Error fetching budget recommendations:', error);
    }
  };

  const generateSavingsPlan = async () => {
    if (!savingsGoal.name || !savingsGoal.amount || !savingsGoal.targetDate) {
      toast.error('Please fill in all fields for your savings goal');
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.ai.getSavingsPlan({
        goal: savingsGoal.name,
        amount: parseFloat(savingsGoal.amount),
        targetDate: savingsGoal.targetDate
      });
      
      if (response.data && response.data.plan) {
        setSavingsPlan(response.data.plan);
        toast.success('Savings plan generated successfully!');
      }
    } catch (error) {
      console.error('Error generating savings plan:', error);
      toast.error('Failed to generate savings plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;
    
    const userMessage = { role: 'user', content: chatInput };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setChatLoading(true);
    
    try {
      const response = await api.ai.chat(chatInput);
      if (response.data && response.data.reply) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: response.data.reply }]);
      } else {
        setChatMessages(prev => [...prev, { 
          role: 'assistant', 
          content: "I'm sorry, I couldn't process your request. Please try again." 
        }]);
      }
    } catch (error) {
      console.error('Error sending message to AI:', error);
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Sorry, I encountered an error. Please try again later." 
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-4">
          <div className="h-24 bg-gray-100 rounded-xl"></div>
          <div className="h-24 bg-gray-100 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors duration-200"
      >
        {isValidImageUrl(getProfileImage()) ? (
          <img
            src={getProfileImage()}
            alt={getDisplayName()}
            className="w-8 h-8 rounded-full object-cover bg-gray-100"
            onError={(e) => {
              e.target.onerror = null; // Prevent infinite loop
              e.target.src = ''; // Clear src
              e.target.classList.add('hidden');
              
              // Check if parentElement exists before setting innerHTML
              if (e.target.parentElement) {
                e.target.parentElement.innerHTML = '<div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center"><svg class="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>';
              }
            }}
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <User className="w-4 h-4 text-blue-600" />
          </div>
        )}
        <span className="font-medium text-gray-700">{getDisplayName()}</span>
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <div className="absolute right-0 top-12 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
          <button
            onClick={() => {
              setShowEditProfile(true);
              setShowDropdown(false);
            }}
            className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-gray-50 transition-colors duration-200"
          >
            <Settings className="w-4 h-4 text-gray-500" />
            <span>Edit Profile</span>
          </button>

          {user?.family_id ? (
            <>
              <button
                onClick={() => {
                  setShowInviteFamily(true);
                  setShowDropdown(false);
                }}
                className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-gray-50 transition-colors duration-200"
              >
                <UserPlus className="w-4 h-4 text-gray-500" />
                <span>Invite Family Members</span>
              </button>

              <button
                onClick={() => {
                  setShowEditCategories(true);
                  setShowDropdown(false);
                }}
                className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-gray-50 transition-colors duration-200"
              >
                <Grid className="w-4 h-4 text-gray-500" />
                <span>Edit Categories</span>
              </button>

              <button
                onClick={() => {
                  setShowEditFamily(true);
                  setShowDropdown(false);
                }}
                className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-gray-50 transition-colors duration-200"
              >
                <Users className="w-4 h-4 text-gray-500" />
                <span>Manage Family</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setShowEditFamily(true);
                setShowDropdown(false);
              }}
              className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-gray-50 transition-colors duration-200"
            >
              <Users className="w-4 h-4 text-gray-500" />
              <span>Create Family</span>
            </button>
          )}

          <div className="h-px bg-gray-100 my-2" />

          <button
            onClick={() => {
              onLogout();
              setShowDropdown(false);
            }}
            className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-gray-50 transition-colors duration-200 text-red-600"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      )}

      {/* Modals */}
      <EditProfileModal
        show={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        user={user}
      />

      <EditCategoriesModal
        show={showEditCategories}
        onClose={() => setShowEditCategories(false)}
      />

      <EditFamilyModal
        show={showEditFamily}
        onClose={() => setShowEditFamily(false)}
      />

      {/* <InviteFamilyModal
        show={showInviteFamily}
        onClose={() => setShowInviteFamily(false)}
      /> */}

      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab('insights')}
          className={`px-4 py-2 rounded-xl transition-colors duration-200 whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'insights'
              ? 'bg-blue-100 text-blue-600 font-medium'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Lightbulb className="w-4 h-4" />
          AI Insights
        </button>
        {/* Other tabs */}
      </div>
    </div>
  );
};

export default UserProfile;