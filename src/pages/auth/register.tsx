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
      
      <div className="flex min-h-screen bg-gray-50">
        {/* Left side - registration form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center">
          <div className="max-w-md w-full px-6 py-8">
            <div className="text-center mb-8">
              <Link href="/" className="inline-block">
                <h1 className="text-3xl font-bold text-blue-600">VideoAI</h1>
              </Link>
              <p className="mt-2 text-gray-600">Create your account</p>
            </div>
            
            {error && (
              <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
                <p>{error}</p>
              </div>
            )}
            
            <form className="space-y-4" onSubmit={handleSubmit}>              <Input
                label="Fullname"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
              
              <Input
                label="Username"
                type="text"
                placeholder="johndoe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              
              <Input
                label="Email Address"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}                required
              />
              
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}                required
              />
              
              <Input
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}                required
              />
              
              <div className="mt-2">
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
                    required
                  />
                  <span className="ml-2 block text-sm text-gray-700">
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
                disabled={!username || !email || !password || !confirmPassword}                className="w-full"
              >
                Create Account
              </Button>
            </form>
            
            <div className="text-center mt-8">
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link
                  href="/auth/login"
                  className="text-blue-600 font-medium hover:text-blue-500"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
        
        {/* Right side - promotional content */}
        <div className="hidden lg:block lg:w-1/2 bg-gradient-to-br from-blue-600 to-purple-700">
          <div className="h-full flex flex-col items-center justify-center p-12">
            <div className="max-w-lg text-center text-white">
              <h2 className="text-3xl font-bold mb-6">Join Our Video Creator Community</h2>
              <p className="mb-8 text-blue-100">
                Get started with VideoAI and transform your ideas into engaging short videos in minutes.
                No video editing skills required!
              </p>
              
              <div className="grid grid-cols-2 gap-6 mb-8">
                {[
                  {
                    title: 'AI Script Generation',
                    description: 'Automatically generate tailored scripts for any topic'
                  },
                  {
                    title: 'Professional Voice Overs',
                    description: 'Choose from dozens of natural-sounding AI voices'
                  },
                  {
                    title: 'Beautiful Templates',
                    description: 'Access our library of professional video templates'
                  },
                  {
                    title: 'Easy Sharing',
                    description: 'Export and share to social media with one click'
                  }
                ].map((feature, i) => (
                  <div key={i} className="text-left">
                    <h3 className="font-bold text-lg">{feature.title}</h3>
                    <p className="text-sm text-blue-100">{feature.description}</p>
                  </div>
                ))}
              </div>
              
              <div className="inline-flex items-center bg-white bg-opacity-20 rounded-full px-4 py-2 text-sm">
                <span className="font-semibold">New users get 5 free videos!</span>
              </div>
            </div>
          </div>        </div>
      </div>
      </>
    </ProtectedRoute>
  );
}
