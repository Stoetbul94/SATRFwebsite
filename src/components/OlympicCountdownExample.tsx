'use client';

import OlympicCountdown from './OlympicCountdown';
import Image from 'next/image';

// Example component showing different ways to use the Olympic Countdown
const OlympicCountdownExample = () => {
  return (
    <div className="space-y-16">
      {/* Basic countdown with 4 rings */}
      <div>
        <h3 className="text-2xl font-bold text-white mb-4 text-center">
          Basic Countdown (4 Rings)
        </h3>
        <OlympicCountdown />
      </div>

      {/* Countdown with 5 rings and SATRF logo */}
      <div>
        <h3 className="text-2xl font-bold text-white mb-4 text-center">
          Countdown with SATRF Logo (5 Rings)
        </h3>
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
      </div>

      {/* Countdown with 5 rings and custom content */}
      <div>
        <h3 className="text-2xl font-bold text-white mb-4 text-center">
          Countdown with Custom Content (5 Rings)
        </h3>
        <OlympicCountdown 
          showFifthRing={true}
          fifthRingContent={
            <div className="text-white text-lg font-bold">
              🇿🇦
            </div>
          }
        />
      </div>
    </div>
  );
};

export default OlympicCountdownExample; 