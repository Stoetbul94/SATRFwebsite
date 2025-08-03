import React from 'react';
import Head from 'next/head';
import OlympicCountdown from '../components/OlympicCountdown';
import OlympicCountdownExample from '../components/OlympicCountdownExample';
import Image from 'next/image';

const TestOlympicCountdownPage = () => {
  return (
    <>
      <Head>
        <title>Olympic Countdown Test - SATRF</title>
        <meta name="description" content="Test page for Olympic Countdown component" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-satrf-navy via-blue-900 to-satrf-lightBlue">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-8">
            🏆 Olympic Countdown Component Test
          </h1>
          
          <div className="space-y-16">
            {/* Basic Countdown */}
            <section className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6 text-center">
                Basic Countdown (4 Rings)
              </h2>
              <OlympicCountdown />
            </section>

            {/* Countdown with SATRF Logo */}
            <section className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6 text-center">
                Countdown with SATRF Logo (5 Rings)
              </h2>
              <OlympicCountdown 
                showFifthRing={true}
                                 fifthRingContent={
                   <div className="w-8 h-8 relative">
                     <Image
                       src="/SATRFLOGO.png"
                       alt="SATRF Logo"
                       fill
                       className="object-contain"
                       unoptimized
                     />
                   </div>
                 }
              />
            </section>

            {/* Countdown with South African Flag */}
            <section className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6 text-center">
                Countdown with South African Flag (5 Rings)
              </h2>
              <OlympicCountdown 
                showFifthRing={true}
                fifthRingContent={
                  <div className="text-white text-lg font-bold">
                    🇿🇦
                  </div>
                }
              />
            </section>

            {/* All Examples */}
            <section className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6 text-center">
                All Examples Together
              </h2>
              <OlympicCountdownExample />
            </section>
          </div>

          <div className="mt-12 text-center">
            <a 
              href="/"
              className="inline-block bg-white/20 hover:bg-white/30 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default TestOlympicCountdownPage; 