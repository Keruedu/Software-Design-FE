import React from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { TrendingTopics } from '../components/features/TrendingTopics/TrendingTopics';
import { Button } from '../components/common/Button/Button';
import { Layout } from '../components/layout/Layout';

export default function Home() {
  const router = useRouter();
  
  return (
    <Layout>
      <Head>
        <title>VideoAI - Create Short Videos with AI</title>
        <meta name="description" content="Create engaging short videos automatically using AI" />
      </Head>
      
      {/* Hero section */}
      <section className="pt-10 pb-12 sm:pt-16 lg:pt-20">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              Create Stunning Videos with AI
            </h1>
            <p className="mt-4 text-base text-gray-500 sm:mt-6 sm:text-xl">
              Turn any topic into a professional short video in minutes. 
              No editing skills required.
            </p>
            <div className="flex justify-center mt-8 sm:mt-10">
              <Button 
                size="lg"
                onClick={() => router.push('/create')}
              >
                Create a Video
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features section */}
      <section className="py-12 bg-gray-50 rounded-lg shadow-inner my-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center mb-10">
            <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">Features</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Everything You Need to Create Amazing Videos
            </p>
          </div>
          
          <div className="mt-10">
            <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
              {/* Feature 1 */}
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">AI-Generated Scripts</h3>
                <p className="mt-2 text-base text-gray-500 text-center">
                  Our AI writes engaging scripts for any topic in seconds.
                </p>
              </div>
              
              {/* Feature 2 */}
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">Natural Voice Over</h3>
                <p className="mt-2 text-base text-gray-500 text-center">
                  Choose from a variety of lifelike voices in multiple languages.
                </p>
              </div>
              
              {/* Feature 3 */}
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">One-Click Video Creation</h3>
                <p className="mt-2 text-base text-gray-500 text-center">
                  Automatically combine voice, text, and visuals into a polished video.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Trending Topics section */}
      <section className="py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Explore Trending Topics</h2>
        <TrendingTopics />
      </section>
      
      {/* CTA section */}
      <section className="bg-blue-600 rounded-lg shadow-lg mt-16 text-white">
        <div className="px-6 py-12 mx-auto text-center">
          <h2 className="text-2xl font-extrabold sm:text-3xl">
            Ready to create your first video?
          </h2>
          <p className="mt-4 text-lg">
            Join thousands of creators who are saving time and creating better content with VideoAI.
          </p>
          <div className="mt-8">
            <Button
              size="lg"
              variant="success"
              onClick={() => router.push('/create')}
            >
              Get Started Now
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
