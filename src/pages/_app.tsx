import React from 'react';
import type { AppProps } from 'next/app';
import Head from 'next/head';

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
      </Head>
      
      <AuthProvider>
        <VideoCreationProvider>
          <Component {...pageProps} />
        </VideoCreationProvider>
      </AuthProvider>
    </>
  );
}
