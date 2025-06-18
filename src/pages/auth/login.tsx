import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { FiMail, FiLock, FiLogIn, FiUser } from 'react-icons/fi';

import { Button } from '../../components/common/Button/Button';
import { Input } from '../../components/common/Input/Input';
import { ProtectedRoute } from '../../components/common/ProtectedRoute';
import { useAuth } from '../../context/AuthContext';
import { getInputType, isValidEmailOrUsername } from '../../utils/validation';
import { toast } from 'react-toastify';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');
  
  useEffect(() => {
    if (!router.isReady) return;

    const { registered, username } = router.query;
    
    if (username) {
      const usernameValue = Array.isArray(username) ? username[0] : username;
      setUsernameOrEmail(usernameValue);
    }
    
    if (registered === 'success') {
      
      router.replace('/auth/login', undefined, { shallow: true })
        .catch(err => console.error('Error replacing URL:', err));
    }
  }, [router.isReady, router.query, router]);

  const handleUsernameOrEmailChange = (value: string) => {
    setUsernameOrEmail(value);
    setValidationError('');
    
    if (value.trim() && !isValidEmailOrUsername(value)) {
      const inputType = getInputType(value);
      if (inputType === 'email') {
        setValidationError('Please enter a valid email address');
      } else {
        setValidationError('Username must be 3-50 characters and contain only letters, numbers, and underscores');
      }
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setValidationError('');
    
    // Client-side validation
    if (!isValidEmailOrUsername(usernameOrEmail)) {
      const inputType = getInputType(usernameOrEmail);
      if (inputType === 'email') {
        setValidationError('Please enter a valid email address');
      } else {
        setValidationError('Username must be 3-50 characters and contain only letters, numbers, and underscores');
      }
      return;
    }
    
    setIsLoading(true);
    
    try {
      await login(usernameOrEmail, password);
      const returnUrl = router.query.returnUrl as string || '/dashboard';
      router.push(returnUrl);
      
      toast.success('Login successful!', {
        position: 'bottom-right',
        autoClose: 3000,
      });
      
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
      toast.error(err instanceof Error ? err.message : 'Login failed. Please try again.', {
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
          <title>Login - VideoAI</title>
          <meta name="description" content="Login to your VideoAI account" />
        </Head>
        
        <div className="flex min-h-screen bg-gray-50">
          {/* Left side - login form */}
          <div className="w-full lg:w-1/2 flex items-center justify-center">
            <div className="max-w-md w-full px-6 py-8">
              <div className="text-center mb-8">
                <Link href="/" className="inline-block">
                  <h1 className="text-3xl font-bold text-blue-600">VideoAI</h1>
                </Link>
                <p className="mt-2 text-gray-600">Sign in to your account</p>
              </div>
              
              {error && (
                <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
                  <p>{error}</p>
                </div>
              )}              <form className="space-y-6" onSubmit={handleSubmit}>                <Input
                  label="Email or Username"
                  type="text"
                  placeholder="your@email.com or username"
                  value={usernameOrEmail}
                  onChange={(e) => handleUsernameOrEmailChange(e.target.value)}
                  leftIcon={usernameOrEmail && getInputType(usernameOrEmail) === 'email' ? <FiMail className="h-5 w-5 text-gray-400" /> : <FiUser className="h-5 w-5 text-gray-400" />}
                  error={validationError}
                  helperText={!validationError && usernameOrEmail ? `Logging in with ${getInputType(usernameOrEmail)}` : 'Enter your email address or username'}
                  required
                /><div>
                  <Input
                    label="Password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    leftIcon={<FiLock className="h-5 w-5 text-gray-400" />}
                    required
                  />
                  <div className="flex justify-end mt-1">
                    <Link
                      href="/auth/forgot-password"
                      className="text-sm text-blue-600 hover:text-blue-500"
                    >
                      Forgot password?
                    </Link>
                  </div>
                </div>                <Button
                  type="submit"
                  isLoading={isLoading}
                  disabled={!usernameOrEmail || !password || !!validationError}
                  className="w-full"
                  icon={<FiLogIn />}
                >
                  Sign in
                </Button>
              </form>
              
              <div className="text-center mt-8">
                <p className="text-gray-600">
                  Don't have an account?{' '}
                  <Link
                    href="/auth/register"
                    className="text-blue-600 font-medium hover:text-blue-500"
                  >
                    Create account
                  </Link>
                </p>
              </div>              <div className="text-center mt-6 border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-500 italic">
                  Demo credentials: <br />
                  Email: demo@example.com / Password: password<br />
                  Username: demouser / Password: password
                </p>
              </div>
            </div>
          </div>
          
          {/* Right side - image or promotional content */}
          <div className="hidden lg:block lg:w-1/2 bg-blue-600">
            <div className="h-full flex items-center justify-center p-12">
              <div className="max-w-lg text-white">
                <h2 className="text-3xl font-bold mb-6">Create Amazing AI Videos in Minutes</h2>
                <p className="mb-6 text-blue-100">
                  Use our AI-powered platform to create stunning short videos effortlessly.
                  Perfect for social media, marketing, education, and more.
                </p>
                <ul className="space-y-2">
                  {[
                    'Generate scripts with AI',
                    'Choose from premium voice options',
                    'Select beautiful backgrounds',
                    'Edit and customize your videos',
                    'Share to social media instantly'
                  ].map((item, i) => (
                    <li key={i} className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2 text-blue-200"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </>
    </ProtectedRoute>
  );
}
