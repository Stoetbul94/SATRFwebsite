import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

const TestRulesPage = () => {
  return (
    <>
      <Head>
        <title>Test Rules Page - SATRF</title>
        <meta name="description" content="Test page for Rules & Documentation" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-satrf-navy via-blue-900 to-satrf-lightBlue">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              🧪 Rules Page Test
            </h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Test the Rules & Documentation page functionality and features.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">
              Available Test Pages
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h3 className="text-xl font-bold text-white mb-4">
                  📋 Rules & Documentation
                </h3>
                <p className="text-gray-300 mb-4">
                  Professional rules page with search, filtering, and download functionality.
                </p>
                <Link 
                  href="/rules"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  View Rules Page →
                </Link>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h3 className="text-xl font-bold text-white mb-4">
                  🏆 Olympic Countdown
                </h3>
                <p className="text-gray-300 mb-4">
                  Dynamic Olympic countdown component with rings and real-time updates.
                </p>
                <Link 
                  href="/test-olympic-countdown"
                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  View Countdown →
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link 
              href="/"
              className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default TestRulesPage; 