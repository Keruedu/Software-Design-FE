import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/common/Button/Button';
import { Input } from '@/components/common/Input/Input';
import { toast } from 'react-toastify';
import { authService } from '@/services/authService';
import Head from 'next/head';
import { Layout } from '@/components/layout/Layout';
import { FaPenAlt } from 'react-icons/fa';

export default function ProfilePage() {
  const { auth, setAuth } = useAuth();
  const user = auth.user;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  useEffect(() => {
    setFullName(user?.fullName || '');
    setEmail(user?.email || '');
    setAvatar(user?.avatar || '');
  }, [user]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await authService.uploadAvatar(file);
      setAvatar(url);
      toast.success('Avatar uploaded!');
    } catch {
      toast.error('Failed to upload avatar');
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

  return (
    <Layout>
      <Head>
        <title>Profile - VideoAI</title>
      </Head>
      <div className="max-w-xl mx-auto bg-white rounded-lg shadow p-8 mt-10">
        <h1 className="text-2xl font-bold mb-6 text-center">Your Profile</h1>
        <div className="flex flex-col items-center mb-6">
          <div
            className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mb-2 relative cursor-pointer border-2 border-blue-500 hover:opacity-80 transition"
            onClick={handleAvatarClick}
            title="Click to change avatar"
            style={{ position: 'relative' }}
          >
            {avatar ? (
              <img
                src={avatar}
                alt="avatar"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-3xl font-bold text-gray-400">
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
            <span className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-1 text-xs pointer-events-none z-10">
              {isUploading}
            </span>
          </div>
          <span className="text-gray-600 text-sm">Click the avatar to change your profile picture</span>
        </div>
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
    </Layout>
  );
}