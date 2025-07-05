import React from 'react';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import global styles
import '../styles/globals.css';

// Import providers
import { AuthProvider } from '../context/AuthContext';
import { VideoCreationProvider } from '../context/VideoCreationContext';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>VideoAI - AI Short Video Creator</title>
        
        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </Head>
      
      <AuthProvider>
        <VideoCreationProvider>
          <Component {...pageProps} />
          <ToastContainer />
        </VideoCreationProvider>
      </AuthProvider>
    </>
  );
}
