import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { FiMail, FiLock, FiLogIn, FiUser } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook,FaTiktok } from 'react-icons/fa';


import { Button } from '../../components/common/Button/Button';
import { Input } from '../../components/common/Input/Input';
import { ProtectedRoute } from '../../components/common/ProtectedRoute';
import { useAuth } from '../../context/AuthContext';
import { getInputType, isValidEmailOrUsername } from '../../utils/validation';
import { toast } from 'react-toastify';


export default function LoginPage() {
  const router = useRouter();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');
  const { login, loginWithGoogle, loginWithFacebook,loginWithTikTok } = useAuth();
  
  
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
          <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
          {/* Left side - login form */}          <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6 lg:px-8">
            <div className="max-w-lg w-full space-y-6">
              {/* Header */}
              <div className="text-center">
                <Link href="/" className="inline-block">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    VideoAI
                  </h1>
                </Link>
                <h2 className="mt-3 text-xl font-semibold text-gray-900">Welcome back!</h2>
                <p className="mt-1 text-gray-600">Sign in to continue creating amazing videos</p>
              </div>

              {/* Login Form Card */}
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

                <form className="space-y-4" onSubmit={handleSubmit}>
                  <Input
                    label="Email or Username"
                    type="text"
                    placeholder="your@email.com or username"
                    value={usernameOrEmail}
                    onChange={(e) => handleUsernameOrEmailChange(e.target.value)}
                    leftIcon={usernameOrEmail && getInputType(usernameOrEmail) === 'email' ? <FiMail className="h-5 w-5 text-gray-400" /> : <FiUser className="h-5 w-5 text-gray-400" />}
                    error={validationError}
                    helperText={!validationError && usernameOrEmail ? `Logging in with ${getInputType(usernameOrEmail)}` : 'Enter your email address or username'}
                    className="w-full py-3"
                    required
                  />

                  <div>
                    <Input
                      label="Password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      leftIcon={<FiLock className="h-5 w-5 text-gray-400" />}
                      className="w-full py-3"
                      required
                    />
                    <div className="flex justify-end mt-1">
                      <Link
                        href="/auth/forgot-password"
                        className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                      >
                        Forgot password?
                      </Link>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    isLoading={isLoading}
                    disabled={!usernameOrEmail || !password || !!validationError}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                    icon={<FiLogIn />}
                  >
                    Sign in
                  </Button>
                </form>

                {/* Divider */}
                <div className="mt-4">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">Or continue with</span>
                    </div>
                  </div>
                </div>                {/* Social Login */}
                <div className="mt-4 space-y-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 py-3 rounded-xl font-medium transition-all duration-200"
                    onClick={loginWithGoogle}
                    icon={<FcGoogle className="h-5 w-5" />}
                  >
                    Sign in with Google
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    className="w-full flex items-center justify-center gap-3 bg-blue-600 border-2 border-blue-600 text-white hover:bg-blue-700 hover:border-blue-700 py-3 rounded-xl font-medium transition-all duration-200"
                    onClick={loginWithFacebook}
                    icon={<FaFacebook className="h-5 w-5" />}
                  >
                    Sign in with Facebook
                  </Button>
                   <Button
                    type="button"
                    variant="primary"
                    className="w-full flex items-center justify-center gap-3 bg-gray-900 border-2 border-gray-600 text-white hover:bg-gray-700 hover:border-gray-700 py-3 rounded-xl font-medium transition-all duration-200"
                    onClick={loginWithTikTok}
                    icon={<FaTiktok className="h-5 w-5" />}
                  >
                    Sign in with TikTok
                  </Button>
                </div>

                {/* Sign up link */}
                <div className="text-center mt-4">
                  <p className="text-gray-600">
                    Don't have an account?{' '}
                    <Link
                      href="/auth/register"
                      className="text-blue-600 font-semibold hover:text-blue-500 transition-colors"
                    >
                      Create account
                    </Link>
                  </p>
                </div>

                {/* Demo credentials - Compact version */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-center">
                    <h4 className="text-xs font-semibold text-gray-700 mb-1">Demo Credentials</h4>
                    <div className="text-xs text-gray-600 flex justify-center gap-4">
                      <span className="flex items-center">
                        <FiMail className="w-3 h-3 mr-1" />
                        Email: demo@example.com
                      </span>
                      <span className="flex items-center">
                        <FiLock className="w-3 h-3 mr-1" />
                        Password: password
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            
            
            
            
          </div>
            {/* Right side - promotional content */}
          <div className="hidden lg:block lg:w-1/2 bg-blue-600">
            <div className="h-full flex items-center justify-center p-8">
              <div className="max-w-lg text-white">
                <h2 className="text-2xl font-bold mb-4">Create Amazing AI Videos in Minutes</h2>
                <p className="mb-6 text-blue-100">
                  Use our AI-powered platform to create stunning short videos effortlessly.
                  Perfect for social media, marketing, education, and more.
                </p>
                <ul className="space-y-3">
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
                        className="h-4 w-4 mr-3 text-blue-200"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-sm">{item}</span>
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
