import React, { useState, useRef } from 'react';
import { User, Settings, LogOut, UserPlus, Grid, Users } from 'lucide-react';
import EditProfileModal from './modals/EditProfileModal';
import EditCategoriesModal from './modals/EditCategoriesModal';
import EditFamilyModal from './modals/EditFamilyModal';

const UserProfile = ({ user, onLogout }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showEditCategories, setShowEditCategories] = useState(false);
  const [showEditFamily, setShowEditFamily] = useState(false);
  const [showInviteFamily, setShowInviteFamily] = useState(false);
  
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

  // Helper function to check if profile image is valid
  const isValidImage = (imageUrl) => {
    return imageUrl && imageUrl.trim() !== '' && imageUrl !== 'null' && imageUrl !== 'undefined';
  };

  // Helper function to get user display name
  const getDisplayName = () => {
    if (user?.name && user.name.trim() !== '') {
      return user.name;
    }
    return user?.email?.split('@')[0] || 'User';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors duration-200"
      >
        {isValidImage(user?.profile_image) ? (
          <img
            src={user.profile_image}
            alt={getDisplayName()}
            className="w-8 h-8 rounded-full object-cover bg-gray-100"
            onError={(e) => {
              e.target.onerror = null; // Prevent infinite loop
              e.target.src = ''; // Clear src
              e.target.classList.add('hidden');
              e.target.parentElement.innerHTML = '<div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center"><svg class="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>';
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
    </div>
  );
};

export default UserProfile;