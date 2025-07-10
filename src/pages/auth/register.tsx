import { use, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { FiMail, FiLock, FiUser, FiUserPlus } from 'react-icons/fi';
import { toast } from 'react-toastify';

import { Button } from '../../components/common/Button/Button';
import { Input } from '../../components/common/Input/Input';
import { ProtectedRoute } from '../../components/common/ProtectedRoute';
import { useAuth } from '../../context/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const validateForm = () => {
    if (!username || !email || !fullName || !password || !confirmPassword) {
      setError('All fields are required');
      return false;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Username must contain only letters, numbers, and underscores');
      return false;
    }

    if (username.length < 3 || username.length > 50) {
      setError('Username must be between 3 and 50 characters');
      return false;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      await register(username, email, fullName, password);
      toast.success('Account created successfully! Please log in.', {
        position: 'bottom-right',
        autoClose: 3000,
      });
      router.push({
        pathname: '/auth/login',
        query: { 
          registered: 'success',
          username: username 
        }
      });
    } catch (err: any) {
      console.error('Registration error:', err);
      const errorMessage = 
        err.response?.data?.detail || 
        err.response?.data?.message || 
        'Registration failed. Please try again.';
    
      setError(errorMessage);
      toast.error(errorMessage, {
        position: 'bottom-right',
        autoClose: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };
    return (
    <ProtectedRoute requireAuth={false}>
      <>
        <Head>
          <title>Create Account - VideoAI</title>
          <meta name="description" content="Create a new VideoAI account" />
        </Head>
        <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {/* Left side - registration form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-lg w-full space-y-6">
            {/* Header */}
            <div className="text-center">
              <Link href="/" className="inline-block">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  VideoAI
                </h1>
              </Link>
              <h2 className="mt-3 text-xl font-semibold text-gray-900">Join VideoAI!</h2>
              <p className="mt-1 text-gray-600">Create your account to start making amazing videos</p>
            </div>

            {/* Registration Form Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-4 w-4 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-2">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <form className="space-y-3" onSubmit={handleSubmit}>
                <Input
                  label="Full Name"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  leftIcon={<FiUser className="h-5 w-5 text-gray-400" />}
                  className="w-full py-2"
                  required
                />
                
                <Input
                  label="Username"
                  type="text"
                  placeholder="johndoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  leftIcon={<FiUser className="h-5 w-5 text-gray-400" />}
                  className="w-full py-2"
                  required
                />
                
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<FiMail className="h-5 w-5 text-gray-400" />}
                  className="w-full py-2"
                  required
                />
                
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<FiLock className="h-5 w-5 text-gray-400" />}
                  className="w-full py-2"
                  required
                />
                
                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  leftIcon={<FiLock className="h-5 w-5 text-gray-400" />}
                  className="w-full py-2"
                  required
                />
                
                <div className="mt-3">
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
                      required
                    />
                    <span className="ml-2 block text-xs text-gray-700">
                      I agree to the{' '}
                      <Link href="/terms" className="text-blue-600 hover:underline">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link href="/privacy" className="text-blue-600 hover:underline">
                        Privacy Policy
                      </Link>
                    </span>
                  </label>
                </div>
                
                <Button
                  type="submit"
                  isLoading={isLoading}
                  disabled={!username || !email || !password || !confirmPassword}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 mt-4"
                  icon={<FiUserPlus />}
                >
                  Create Account
                </Button>
              </form>
              
              {/* Sign in link */}
              <div className="text-center mt-4">
                <p className="text-gray-600">
                  Already have an account?{' '}
                  <Link
                    href="/auth/login"
                    className="text-blue-600 font-semibold hover:text-blue-500 transition-colors"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>        
        {/* Right side - promotional content */}
        <div className="hidden lg:block lg:w-1/2 bg-gradient-to-br from-blue-600 to-purple-700">
          <div className="h-full flex flex-col items-center justify-center p-8">
            <div className="max-w-lg text-center text-white">
              <h2 className="text-2xl font-bold mb-4">Join Our Video Creator Community</h2>
              <p className="mb-6 text-blue-100">
                Get started with VideoAI and transform your ideas into engaging short videos in minutes.
                No video editing skills required!
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  {
                    title: 'AI Script Generation',
                    description: 'Automatically generate tailored scripts'
                  },
                  {
                    title: 'Professional Voices',
                    description: 'Natural-sounding AI voices'
                  },
                  {
                    title: 'Beautiful Templates',
                    description: 'Professional video templates'
                  },
                  {
                    title: 'Easy Sharing',
                    description: 'Export and share instantly'
                  }
                ].map((feature, i) => (
                  <div key={i} className="text-left p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                    <h3 className="font-bold text-sm">{feature.title}</h3>
                    <p className="text-xs text-blue-100 mt-1">{feature.description}</p>
                  </div>
                ))}
              </div>
              
              {/* <div className="inline-flex items-center bg-white bg-opacity-20 rounded-full px-4 py-2 text-sm">
                <span className="font-semibold">🎉 New users get 5 free videos!</span>
              </div> */}
            </div>
          </div>
        </div>
      </div>
      </>
    </ProtectedRoute>
  );
}
