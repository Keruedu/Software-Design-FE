import { useState } from 'react';
import { useRouter } from 'next/router';
import { Button } from '@/components/common/Button/Button';
import { Input } from '@/components/common/Input/Input';
import { toast } from 'react-toastify';
import Head from 'next/head';
import { Layout } from '@/components/layout/Layout';
import api from '@/services/api';

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match',
        {
          position: 'bottom-right',
          autoClose: 3000,
        }
      );
      return;
    }
    setIsSaving(true);
    try {
      await api.post('/user/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      toast.success('Password changed successfully',
        {
          position: 'bottom-right',
          autoClose: 3000,
        }
      );
      router.push('/auth/profile');
    } catch (err: any) {
      toast.error(
        err?.response?.data?.detail || 'Failed to change password',
        {
            position: 'bottom-right',
            autoClose: 3000,
        }
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Layout>
      <Head>
        <title>Change Password - VideoAI</title>
      </Head>
      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-8 mt-10">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Change Password</h1>
        <form className="space-y-4" onSubmit={handleSubmit}>
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
            className="w-full"
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            className="w-full"
          />
          <Button type="submit" isLoading={isSaving} className="w-full">
            Change Password
          </Button>
        </form>
      </div>
    </Layout>
  );
}