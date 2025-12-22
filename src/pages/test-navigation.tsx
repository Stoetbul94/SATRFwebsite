import React from 'react';
import Link from 'next/link';
import Head from 'next/head';

export default function TestNavigation() {
  return (
    <>
      <Head>
        <title>Navigation Test - SATRF</title>
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-midnight-steel via-midnight-dark to-midnight-light flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-oxanium font-bold text-electric-cyan mb-4">
              Navigation Test
            </h1>
            <p className="text-gray-300 font-oxanium mb-8">
              Testing navigation links
            </p>
          </div>

          <div className="space-y-4">
            <Link 
              href="/" 
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-oxanium font-medium rounded-lg text-midnight-steel bg-electric-cyan hover:bg-electric-neon transition-colors duration-200"
            >
              Go to Homepage
            </Link>
            
            <Link 
              href="/login" 
              className="w-full flex justify-center py-3 px-4 border border-electric-cyan text-sm font-oxanium font-medium rounded-lg text-electric-cyan hover:bg-electric-cyan hover:text-midnight-steel transition-colors duration-200"
            >
              Go to Login
            </Link>
            
            <Link 
              href="/register" 
              className="w-full flex justify-center py-3 px-4 border border-electric-cyan text-sm font-oxanium font-medium rounded-lg text-electric-cyan hover:bg-electric-cyan hover:text-midnight-steel transition-colors duration-200"
            >
              Go to Register
            </Link>
            
            <Link 
              href="/dashboard" 
              className="w-full flex justify-center py-3 px-4 border border-electric-cyan text-sm font-oxanium font-medium rounded-lg text-electric-cyan hover:bg-electric-cyan hover:text-midnight-steel transition-colors duration-200"
            >
              Go to Dashboard
            </Link>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-400 font-oxanium">
              If these links work, navigation is functioning properly.
            </p>
          </div>
        </div>
      </div>
    </>
  );
} 