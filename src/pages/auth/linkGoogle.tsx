import { useState, useEffect } from 'react';
import { Button } from '../../components/common/Button/Button';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { Layout } from '@/components/layout/Layout';
import { FcGoogle } from 'react-icons/fc';
import { FaYoutube, FaCheckCircle, FaArrowLeft } from 'react-icons/fa';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function LinkGooglePage() {
  const { auth } = useAuth();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (router.query.linked === 'google') {
      toast.success('Link Google was successful! You can now upload videos to YouTube.',
        {position: "bottom-right",
        autoClose: 3000,
        }
      );
      setTimeout(() => {
        router.push('/auth/profile');
      }, 2000);
    }
  }, [router.query]);

  const handleLinkGoogle = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/user/google/link/auth`,
        {
          headers: {
          Authorization: `Bearer ${auth?.token}`,
        },
         credentials: 'include' }
      );
      const data = await res.json();
      if (data.auth_url) {
        // Thêm access_token vào state
        const url = new URL(data.auth_url);
        let state = url.searchParams.get('state') || '';
        if (state) {
          state += `&access_token=${auth?.token}`;
        } else {
          state = `access_token=${auth?.token}`;
        }
        url.searchParams.set('state', state);
        window.location.href = url.toString();
      } else {
        toast.error("Don't have permission to link Google account",
          {
            position: "bottom-right",
            autoClose: 3000,
          }
        );
      }
    } catch (err) {
      toast.error("An error occurred while linking Google account. Please try again later.",
        {
          position: "bottom-right",
          autoClose: 3000,
        }
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <Layout>
      <Head>
        <title>Link Google Account - VideoAI</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-blue-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          {/* Back Button */}
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => router.push('/auth/profile')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <FaArrowLeft className="w-4 h-4" />
              Back to Profile
            </Button>
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center items-center gap-4 mb-4">
                <div className="p-3 bg-red-50 rounded-full">
                  <FcGoogle className="w-12 h-12" />
                </div>
                <div className="text-2xl text-gray-400">+</div>
                <div className="p-3 bg-red-50 rounded-full">
                  <FaYoutube className="w-12 h-12 text-red-600" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Link Your Google Account
              </h1>
              <p className="text-gray-600 text-lg">
                Connect with Google to unlock YouTube video uploading
              </p>
            </div>

            {/* Benefits Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">What you'll get:</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <FaCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">Direct video upload to your YouTube channel</span>
                </div>
                <div className="flex items-center gap-3">
                  <FaCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">Seamless integration with YouTube's features</span>
                </div>
                <div className="flex items-center gap-3">
                  <FaCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">Automatic video metadata and descriptions</span>
                </div>
                <div className="flex items-center gap-3">
                  <FaCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">Secure authentication with Google OAuth</span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="text-center">
              <Button
                onClick={handleLinkGoogle}
                disabled={loading}
                className="w-full max-w-md mx-auto bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Connecting...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <FcGoogle className="w-6 h-6" />
                    <span>Continue with Google</span>
                  </div>
                )}
              </Button>
              
              <p className="text-sm text-gray-500 mt-4 max-w-md mx-auto">
                By linking your account, you agree to Google's terms of service and 
                grant VideoAI permission to upload videos on your behalf.
              </p>
            </div>

            {/* Security Note */}
            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 text-blue-600 mt-0.5">
                  🔒
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1">Secure & Private</h4>
                  <p className="text-sm text-blue-700">
                    We use Google's secure OAuth 2.0 protocol. Your Google password is never shared with us, 
                    and you can revoke access at any time from your Google account settings.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}