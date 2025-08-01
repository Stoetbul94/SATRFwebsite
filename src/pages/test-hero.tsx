import React from 'react';
import HeroSection from '@/components/home/HeroSection';

export default function TestHero() {
  return (
    <div>
      <HeroSection />
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Hero Component Test Page</h2>
        <p className="text-gray-600">
          If you can see the stunning hero section above with neon effects and animations, 
          the component is working correctly!
        </p>
      </div>
    </div>
  );
} 