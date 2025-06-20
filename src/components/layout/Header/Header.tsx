import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../../context/AuthContext';
import { Button } from '../../common/Button/Button';

export const Header: React.FC = () => {
  const { auth, logout } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  
  const navItems = [
    { label: 'Home', href: '/' },
    { label: 'Create', href: '/create' },
    { label: 'My Videos', href: '/dashboard' },
  ];
  
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and nav items */}
          <div className="flex">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-2xl font-bold text-blue-600">
                VideoAI
              </Link>
            </div>
            
            {/* Nav items - desktop */}
            <nav className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => {
                const isActive = router.pathname === item.href || 
                  (item.href !== '/' && router.pathname.startsWith(item.href));
                
                return (
                  <Link 
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          
          {/* Right side buttons */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {auth.isAuthenticated ? (
              <div className="flex items-center">
                {/* User profile */}
                <div className="relative ml-3">
                  
                  
                  <div className="flex-shrink-0 mr-3 relative">
                    <button
                      onClick={() => setProfileMenuOpen((open) => !open)}
                      className="focus:outline-none"
                      aria-label="User menu"
                    >
                      {auth.user?.avatar ? (
                        <img
                          src={auth.user.avatar}
                          alt="avatar"
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-lg font-bold text-gray-700 uppercase">
                          {auth.user?.username?.charAt(0) || 'U'}
                        </div>
                      )}
                    </button>
                    {profileMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg z-50">
                        <div className="px-4 py-2 text-gray-800 font-semibold border-b">{auth.user?.username}</div>
                        <button
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
                          onClick={() => {
                            setProfileMenuOpen(false);
                            router.push('/auth/profile');
                          }}
                        >
                          Profile
                        </button>
                        {!auth.user?.social_credentials?.google && (
                          <button
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
                            onClick={() => {
                              setProfileMenuOpen(false);
                              router.push('/auth/changePassword');
                            }}
                          >
                            Change Password
                          </button>
                        )}
                        <button
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                          onClick={() => {
                            setProfileMenuOpen(false);
                            logout();
                          }}
                        >
                          Log out
                        </button>
                      </div>
                    )}
                  </div>
                  
                </div>
              </div>
            ) : (
              <div className="flex space-x-4">
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/auth/login')}
                >
                  Log in
                </Button>
                <Button
                  size="sm"
                  onClick={() => router.push('/auth/register')}
                >
                  Sign up
                </Button>
              </div>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navItems.map((item) => {
              const isActive = router.pathname === item.href || 
                (item.href !== '/' && router.pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
          
          {/* Mobile auth buttons */}
          <div className="pt-4 pb-3 border-t border-gray-200">
            {auth.isAuthenticated ? (
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                    {auth.user?.username?.charAt(0) || 'U'}
                  </div>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">{auth.user?.username}</div>
                  <div className="text-sm font-medium text-gray-500">{auth.user?.email}</div>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="ml-auto flex-shrink-0 bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <span className="sr-only">Log out</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex justify-between px-4 space-x-3">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => {
                    setMobileMenuOpen(false);
                    router.push('/auth/login');
                  }}
                >
                  Log in
                </Button>
                <Button
                  fullWidth
                  onClick={() => {
                    setMobileMenuOpen(false);
                    router.push('/auth/register');
                  }}
                >
                  Sign up
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
