'use client';

import { useState, useEffect } from 'react';
import { FiAward } from 'react-icons/fi';

interface OlympicCountdownProps {
  showFifthRing?: boolean;
  fifthRingContent?: React.ReactNode;
}

const OlympicCountdown: React.FC<OlympicCountdownProps> = ({ 
  showFifthRing = false, 
  fifthRingContent 
}) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [hasStarted, setHasStarted] = useState(false);

  // Olympic Games start: July 21, 2028, 20:00 UTC+2 (18:00 UTC)
  const olympicStartDate = new Date('2028-07-21T18:00:00Z');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = olympicStartDate.getTime() - now.getTime();

      if (difference <= 0) {
        setHasStarted(true);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    // Calculate immediately
    calculateTimeLeft();

    // Update every second
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  // Olympic ring colors (official colors)
  const ringColors = ['#0066CC', '#FFD700', '#000000', '#009B3A', '#CE1126'];
  const ringLabels = ['Days', 'Hours', 'Minutes', 'Seconds', ''];
  const ringValues = [timeLeft.days, timeLeft.hours, timeLeft.minutes, timeLeft.seconds, null];

  const OlympicRingsWithCountdown = () => (
    <div className="flex justify-center items-center mb-8">
      <svg 
        width="400" 
        height="120" 
        viewBox="0 0 400 120" 
        className="w-full max-w-md mx-auto"
        aria-label="Olympic rings countdown timer"
      >
        {/* Olympic rings with countdown numbers */}
        {ringColors.map((color, index) => {
          const cx = 40 + (index * 80); // Horizontal spacing
          const cy = 60; // Vertical center
          const r = 35; // Ring radius
          
          return (
            <g key={index} className="transition-all duration-300 ease-in-out">
              {/* Ring */}
              <circle 
                cx={cx} 
                cy={cy} 
                r={r} 
                fill="none" 
                stroke={color} 
                strokeWidth="4"
                className="drop-shadow-lg"
              />
              
              {/* Countdown number or content inside ring */}
              {index < 4 ? (
                <text
                  x={cx}
                  y={cy + 8}
                  textAnchor="middle"
                  className="text-2xl font-bold fill-white font-oxanium"
                  aria-label={`${ringLabels[index]}: ${ringValues[index]}`}
                >
                  {ringValues[index]?.toString().padStart(2, '0') || '00'}
                </text>
              ) : showFifthRing && fifthRingContent ? (
                <foreignObject x={cx - 25} y={cy - 25} width="50" height="50">
                  <div className="flex items-center justify-center h-full">
                    {fifthRingContent}
                  </div>
                </foreignObject>
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );

  const CountdownLabels = () => (
    <div className="flex justify-center items-center mb-8 -mt-4">
      <div className="flex space-x-16 sm:space-x-20 md:space-x-24">
        {ringLabels.slice(0, 4).map((label, index) => (
          <div 
            key={index}
            className="text-center transition-all duration-300 ease-in-out"
            style={{ width: '60px' }}
          >
            <span className="text-sm sm:text-base text-gray-300 font-medium">
              {label}
            </span>
          </div>
        ))}
        {showFifthRing && (
          <div className="text-center" style={{ width: '60px' }}>
            <span className="text-sm sm:text-base text-gray-300 font-medium">
              {fifthRingContent ? 'Logo' : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  if (hasStarted) {
    return (
      <section className="py-16 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-2xl">
            <OlympicRingsWithCountdown />
            <div className="flex justify-center mb-6">
              <FiAward className="text-6xl text-yellow-600 animate-bounce" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              🎉 The Olympics Have Begun! 🎉
            </h2>
            <p className="text-xl text-gray-700 mb-6">
              The 2028 Olympic Games are now in full swing! 
              Good luck to all South African athletes competing in target shooting events.
            </p>
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-full inline-block font-semibold text-lg">
              Go Team South Africa! 🇿🇦
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-midnight-steel">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="mb-8">
          <OlympicRingsWithCountdown />
          <CountdownLabels />
          
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 animate-fade-in">
            Countdown to the 2028 Olympics
          </h2>
          
          <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed animate-slide-up">
            The Olympic Games begin on July 21, 2028. Support our South African target shooting athletes as they prepare for glory!
          </p>
        </div>

        <div className="mt-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 inline-block animate-fade-in">
            <p className="text-white text-lg font-medium">
              🎯 Target Shooting Events: July 27 - August 5, 2028
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OlympicCountdown; 