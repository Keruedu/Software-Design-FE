import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/common/Button/Button';
import { Input } from '@/components/common/Input/Input';
import { toast } from 'react-toastify';
import { authService } from '@/services/authService';
import Head from 'next/head';
import { Layout } from '@/components/layout/Layout';
import { FaPenAlt, FaKey, FaGoogle, FaUser, FaFacebook } from 'react-icons/fa';
import { useRouter } from 'next/router';
import api from '@/services/api';

export default function ProfilePage() {
  const { auth, setAuth } = useAuth();
  const user = auth.user;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Change password states
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  useEffect(() => {
    setFullName(user?.fullName || '');
    setEmail(user?.email || '');
    setAvatar(user?.avatar || '');
  }, [user]);  useEffect(() => {
    if (router.query.linked === 'google') {
      toast.success("Google account linked successfully! You can now upload videos to YouTube.",
        {
          position: "bottom-right",
          autoClose: 3000,
        }
      );
      refreshUserData();
      // Clean up URL
      router.replace('/auth/profile', undefined, { shallow: true });
    } else if (router.query.linked === 'facebook') {
      toast.success("Facebook account linked successfully! You can now manage Facebook pages.",
        {
          position: "bottom-right",
          autoClose: 3000,
        }
      );
      refreshUserData();
      // Clean up URL
      router.replace('/auth/profile', undefined, { shallow: true });
    } else if (router.query.link_error) {
      const errorMessage = Array.isArray(router.query.link_error) 
        ? router.query.link_error[0] 
        : router.query.link_error;
      
      toast.error(decodeURIComponent(errorMessage as string),
        {
          position: "bottom-right",
          autoClose: 3000,
        }
      );
      // Clean up URL
      router.replace('/auth/profile', undefined, { shallow: true });
    }
  }, [router.query]);

  const refreshUserData = async () => {
    try {
      const updatedUser = await authService.getCurrentUser();
      setAuth((prev) => ({
        ...prev,
        user: updatedUser
      }));
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await authService.uploadAvatar(file);
      setAvatar(url);
      toast.success('Avatar uploaded!',
        {
          position: "bottom-right",
          autoClose: 3000,
        }
      );
    } catch {
      toast.error('Failed to upload avatar',
        {
          position: "bottom-right",
          autoClose: 3000,
        }
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleAvatarClick = () => {
    if (!isUploading) fileInputRef.current?.click();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await authService.updateProfile({ fullName, email, avatar });
      setAuth((prev) => ({
        ...prev,
        user: { ...prev.user, ...updated }
      }));
      toast.success('Profile updated successfully', {
        position: "bottom-right",
        autoClose: 3000,
      });
    } catch (err: any) {
      toast.error(err?.message || 'Update failed', {
        position: "bottom-right",
        autoClose: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match',
        {
          position: "bottom-right",
          autoClose: 3000,
        }
      );
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters',
        {
          position: "bottom-right",
          autoClose: 3000,
        }
      );
      return;
    }

    setIsChangingPassword(true);
    try {
      await api.post('/user/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      toast.success('Password changed successfully',
        {
          position: "bottom-right",
          autoClose: 3000,
        }
      );
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowChangePassword(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to change password',
        {
          position: "bottom-right",
          autoClose: 3000,
        }
      );
    } finally {
      setIsChangingPassword(false);
    }
  };  // Only regular users can change password
  const isRegularAccount = user?.type === "regular" || !user?.type; 
  return (
    <Layout>
      <Head>
        <title>Profile - VideoAI</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
            <p className="text-gray-600">Manage your account settings and preferences</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="text-center">
                  <div className="relative inline-block">
                    <div
                      className="h-24 w-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden mb-4 relative cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                      onClick={handleAvatarClick}
                      title="Click to change avatar"
                    >
                      {avatar ? (
                        <img
                          src={avatar}
                          alt="avatar"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl font-bold text-white">
                          {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </div>
                    {isUploading && (
                      <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white rounded-full p-2 animate-pulse">
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">{user?.fullName}</h2>
                  <p className="text-gray-500">@{user?.username}</p>
                  <p className="text-sm text-gray-400 mt-1">Click avatar to change photo</p>
                </div>
              </div>
            </div>            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Profile Information */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FaUser className="text-blue-500" />
                  Profile Information
                </h3>
                <form className="space-y-4" onSubmit={handleSave}>
                  <Input
                    label="User Name"
                    value={user?.username || ''}
                    readOnly
                    disabled
                    className='w-full'
                  />
                  <Input
                    label="Full Name"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    required
                    className='w-full'
                  />
                  <Input
                    label="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    type="email"
                    className='w-full'
                  />
                  <Button type="submit" isLoading={isSaving} className="w-full">
                    Save Changes
                  </Button>
                </form>
              </div>

              {/* Google Account Section */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-700">
                  <FaGoogle className="text-red-500" />
                  Google Account
                </h3>
                {user?.social_credentials?.google.email ? (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 text-green-700">
                      <span className="font-medium">✓ Google account linked</span>
                    </div>
                    <p className="text-sm text-green-600 mt-1">
                      Email: {user?.social_credentials?.google?.email}
                    </p>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-gray-600 mb-3">
                      Link your Google account to upload videos to YouTube
                    </p>
                    <Button
                      onClick={() => router.push('/auth/linkGoogle')}
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      <FaGoogle className="mr-2" />
                      Link Google Account
                    </Button>
                  </div>
                )}
              </div>

              {/* Facebook Account Section */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-700">
                  <FaFacebook className="text-blue-600" />
                  Facebook Account
                </h3>
                {user?.social_credentials?.facebook.email ? (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 text-green-700">
                      <span className="font-medium">✓ Facebook account linked</span>
                    </div>
                    <p className="text-sm text-green-600 mt-1">
                      Email: {user?.social_credentials?.facebook?.email}
                    </p>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-gray-600 mb-3">
                      Link your Facebook account to manage pages and posts
                    </p>
                    <Button
                      onClick={() => router.push('/auth/linkFacebook')}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <FaFacebook className="mr-2" />
                      Link Facebook Account
                    </Button>                  </div>
                )}
              </div>

              {/* Security Section - Only show for regular accounts */}
              {isRegularAccount && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <FaKey className="text-blue-500" />
                      Security
                    </h3>
                    <Button
                      onClick={() => setShowChangePassword(!showChangePassword)}
                      variant="outline"
                      size="sm"
                    >
                      {showChangePassword ? 'Cancel' : 'Change Password'}
                    </Button>
                  </div>
                  
                  {showChangePassword && (
                    <form onSubmit={handleChangePassword} className="space-y-4 bg-gray-50 p-4 rounded-lg">
                      <Input
                        label="Current Password"
                        type="password"
                        value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                        required
                        className="w-full"
                      />
                      <Input
                        label="New Password"
                        type="password"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        required
                        minLength={6}
                        className="w-full"
                      />
                      <Input
                        label="Confirm New Password"
                        type="password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                        className="w-full"
                      />
                      <Button 
                        type="submit" 
                        isLoading={isChangingPassword} 
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        Update Password
                      </Button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}