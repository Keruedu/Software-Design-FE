import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';

export default function GoogleCallback() {
  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace('#', ''));
    const accessToken = params.get('access_token');
    if (accessToken) {
        localStorage.setItem('access_token', accessToken);
        // Reload lại trang để AuthContext chạy useEffect kiểm tra token mới
        window.location.replace('/dashboard');
    } else {
        router.replace('/auth/login');
    }
    }, [router]);

  return <div>Signing in with Google...</div>;
}