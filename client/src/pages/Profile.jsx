import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import { changePasswordApi } from '../services/api/auth.js';
import { getGenerationsApi } from '../services/api/generations.js';
import {
  RiUserLine,
  RiMailLine,
  RiShieldUserLine,
  RiHistoryLine,
  RiLockPasswordLine,
  RiEyeLine,
  RiEyeOffLine,
  RiErrorWarningLine,
} from 'react-icons/ri';

export const Profile = () => {
  const { user } = useAuth();
  const [generations, setGenerations] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Password change state — strictly starts completely empty
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await getGenerationsApi({ limit: 5 });
        if (response.success && response.data) {
          setGenerations(response.data);
        }
      } catch (error) {
        console.warn('[Profile] Could not fetch generation history:', error.message);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchHistory();
  }, []);

  // Validation logic
  const isLengthValid = newPassword.length >= 8;
  const isDifferent = currentPassword && newPassword ? currentPassword !== newPassword : true;
  const isFormValid = Boolean(currentPassword && newPassword && isLengthValid && isDifferent);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!currentPassword) {
      setErrorMessage('Current password is required.');
      return;
    }

    if (!newPassword) {
      setErrorMessage('New password is required.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage('New password must be at least 8 characters long.');
      return;
    }

    if (currentPassword === newPassword) {
      setErrorMessage('New password must be different from current password.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await changePasswordApi({ currentPassword, newPassword });
      if (response.success) {
        toast.success('Password updated successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setErrorMessage('');
      }
    } catch (error) {
      const msg = error.message || 'Failed to update password.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto my-8 space-y-8 animate-fadeIn">
      {/* Profile Overview Card */}
      <div className="p-8 bg-white/5 backdrop-blur-xl border border-[#202A44] rounded-2xl shadow-xl">
        <h2 className="text-2xl font-bold text-[#F8FAFC] mb-6 flex items-center gap-2">
          <RiUserLine className="text-[#8B5CF6]" />
          User Profile
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[#94A3B8]">
          <div className="p-4 bg-[#0B1020] rounded-xl border border-[#202A44]">
            <span className="text-xs text-[#64748B] uppercase tracking-wider block mb-1">Full Name</span>
            <p className="text-lg font-semibold text-[#F8FAFC]">{user?.name || 'N/A'}</p>
          </div>

          <div className="p-4 bg-[#0B1020] rounded-xl border border-[#202A44]">
            <span className="text-xs text-[#64748B] uppercase tracking-wider block mb-1 flex items-center gap-1">
              <RiMailLine size={14} /> Email
            </span>
            <p className="text-base font-medium text-[#F8FAFC] truncate">{user?.email || 'N/A'}</p>
          </div>

          <div className="p-4 bg-[#0B1020] rounded-xl border border-[#202A44]">
            <span className="text-xs text-[#64748B] uppercase tracking-wider block mb-1 flex items-center gap-1">
              <RiShieldUserLine size={14} /> Role
            </span>
            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/30 uppercase">
              {user?.role || 'User'}
            </span>
          </div>
        </div>
      </div>

      {/* Password Change Card */}
      <div className="p-8 bg-white/5 backdrop-blur-xl border border-[#202A44] rounded-2xl shadow-xl">
        <h3 className="text-xl font-bold text-[#F8FAFC] mb-4 flex items-center gap-2">
          <RiLockPasswordLine className="text-[#8B5CF6]" />
          Change Password
        </h3>

        {errorMessage && (
          <div className="mb-4 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-red-400 text-xs">
            <RiErrorWarningLine size={16} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">Current Password</label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  setErrorMessage('');
                }}
                placeholder="Enter current password"
                className="w-full pl-4 pr-10 py-2.5 bg-[#050812]/80 border border-[#202A44] rounded-xl text-[#F8FAFC] text-sm placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
              />
              <button
                type="button"
                aria-label="Toggle current password visibility"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#F8FAFC] transition-colors"
              >
                {showCurrentPassword ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">New Password (8+ chars)</label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setErrorMessage('');
                }}
                placeholder="Enter new password"
                className="w-full pl-4 pr-10 py-2.5 bg-[#050812]/80 border border-[#202A44] rounded-xl text-[#F8FAFC] text-sm placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
              />
              <button
                type="button"
                aria-label="Toggle new password visibility"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#F8FAFC] transition-colors"
              >
                {showNewPassword ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
              </button>
            </div>
            {newPassword && !isLengthValid && (
              <p className="text-[11px] text-amber-400 mt-1">Password must be at least 8 characters long.</p>
            )}
            {newPassword && currentPassword && !isDifferent && (
              <p className="text-[11px] text-amber-400 mt-1">New password must differ from current password.</p>
            )}
          </div>

          <div className="md:col-span-2 mt-2">
            <button
              type="submit"
              disabled={isChangingPassword || !isFormValid}
              className="px-6 py-2.5 bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] hover:from-[#7C3AED] hover:to-[#4F46E5] text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-[#8B5CF6]/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isChangingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Recent AI Generation History */}
      <div className="p-8 bg-white/5 backdrop-blur-xl border border-[#202A44] rounded-2xl shadow-xl">
        <h3 className="text-xl font-bold text-[#F8FAFC] mb-4 flex items-center gap-2">
          <RiHistoryLine className="text-[#8B5CF6]" />
          Recent AI Generations
        </h3>

        {loadingHistory ? (
          <div className="text-center py-6 text-[#94A3B8] text-sm">Loading generation history...</div>
        ) : generations.length === 0 ? (
          <div className="text-center py-8 text-[#94A3B8] text-sm bg-[#0B1020]/60 rounded-xl border border-[#202A44]/60">
            No personal generations recorded yet. Generate images or summarize text to build your history!
          </div>
        ) : (
          <div className="space-y-3">
            {generations.map((gen) => (
              <div
                key={gen._id}
                className="p-4 bg-[#0B1020] border border-[#202A44] rounded-xl flex items-center justify-between text-sm hover:border-[#8B5CF6]/40 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-[#8B5CF6] capitalize">{gen.type?.replace('_', ' ')}</span>
                    <span className="text-xs text-[#64748B]">• {new Date(gen.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-[#94A3B8] text-xs line-clamp-1">{gen.prompt}</p>
                </div>
                <span className="text-xs text-[#64748B] capitalize">{gen.provider}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
