import { useState, useEffect } from 'react';
import { Button } from '../../components/common/Button/Button';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { Layout } from '@/components/layout/Layout';
import { FaFacebook, FaCheckCircle, FaArrowLeft, FaUsers } from 'react-icons/fa';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function LinkFacebookPage() {
  const { auth } = useAuth();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (router.query.linked === 'facebook') {
      toast.success('Link Facebook was successful! You can now manage your Facebook pages.',
        {position: "bottom-right",
        autoClose: 3000,
        }
      );
      setTimeout(() => {
        router.push('/auth/profile');
      }, 2000);
    } else if (router.query.link_error) {
      const errorMessage = Array.isArray(router.query.link_error) 
        ? router.query.link_error[0] 
        : router.query.link_error;
      
      toast.error(decodeURIComponent(errorMessage as string),
        {
          position: "bottom-right",
          autoClose: 5000,
        }
      );
      // Clean up URL but stay on the page
      router.replace('/auth/linkFacebook', undefined, { shallow: true });
    }
  }, [router.query]);

  const handleLinkFacebook = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/user/facebook/link/auth`,
        {
          headers: {
          Authorization: `Bearer ${auth?.token}`,
        },
         credentials: 'include' }
      );
      
      if (!res.ok) {
        // Handle HTTP errors
        const errorData = await res.json().catch(() => ({}));
        const errorMessage = errorData.detail || "An error occurred while preparing Facebook link";
        toast.error(errorMessage,
          {
            position: "bottom-right",
            autoClose: 3000,
          }
        );
        return;
      }
      
      const data = await res.json();
      if (data.auth_url) {
        window.location.href = data.auth_url;
      } else {
        toast.error("Don't have permission to link Facebook account",
          {
            position: "bottom-right",
            autoClose: 3000,
          }
        );
      }
    } catch (err) {
      toast.error("An error occurred while linking Facebook account. Please try again later.",
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
        <title>Link Facebook Account - VideoAI</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-12">
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
                <div className="p-3 bg-blue-50 rounded-full">
                  <FaFacebook className="w-12 h-12 text-blue-600" />
                </div>
                <div className="text-2xl text-gray-400">+</div>
                <div className="p-3 bg-blue-50 rounded-full">
                  <FaUsers className="w-12 h-12 text-blue-600" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Link Your Facebook Account
              </h1>
              <p className="text-gray-600 text-lg">
                Connect with Facebook to manage your pages and posts
              </p>
            </div>

            {/* Benefits Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">What you'll get:</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <FaCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">Manage your Facebook pages</span>
                </div>
                <div className="flex items-center gap-3">
                  <FaCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">Publish posts and videos to Facebook</span>
                </div>
                <div className="flex items-center gap-3">
                  <FaCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">Access page insights and engagement data</span>
                </div>
                <div className="flex items-center gap-3">
                  <FaCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">Secure authentication with Facebook OAuth</span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="text-center">
              <Button
                onClick={handleLinkFacebook}
                disabled={loading}
                className="w-full max-w-md mx-auto bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Connecting...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <FaFacebook className="w-6 h-6" />
                    <span>Continue with Facebook</span>
                  </div>
                )}
              </Button>
              
              <p className="text-sm text-gray-500 mt-4 max-w-md mx-auto">
                By linking your account, you agree to Facebook's terms of service and 
                grant VideoAI permission to manage posts on your behalf.
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
                    We use Facebook's secure OAuth 2.0 protocol. Your Facebook password is never shared with us, 
                    and you can revoke access at any time from your Facebook account settings.
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
