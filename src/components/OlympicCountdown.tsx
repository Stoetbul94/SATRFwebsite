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
    <div className="flex justify-center items-center mb-8 sm:mb-10 md:mb-12">
      <svg 
        width="450" 
        height="160" 
        viewBox="0 0 450 160" 
        className="w-full max-w-2xl mx-auto"
        aria-label="Olympic rings countdown timer"
      >
        {/* Olympic rings with countdown numbers */}
        {ringColors.map((color, index) => {
          const cx = 45 + (index * 90); // Better horizontal spacing
          const cy = 60; // Vertical center for rings
          const r = 38; // Slightly larger ring radius for better visibility
          
          return (
            <g key={index} className="transition-all duration-300 ease-in-out hover:scale-110">
              {/* Ring with enhanced shadow */}
              <circle 
                cx={cx} 
                cy={cy} 
                r={r} 
                fill="none" 
                stroke={color} 
                strokeWidth="5"
                className="drop-shadow-2xl"
                style={{
                  filter: `drop-shadow(0 0 8px ${color}80) drop-shadow(0 0 15px ${color}40)`,
                }}
              />
              
              {/* Countdown number or content inside ring */}
              {index < 4 ? (
                <>
                  <text
                    x={cx}
                    y={cy + 8}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-3xl font-bold fill-white font-oxanium"
                    style={{
                      textShadow: '0 0 10px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 0, 0, 0.5)',
                    }}
                    aria-label={`${ringLabels[index]}: ${ringValues[index]}`}
                  >
                    {ringValues[index]?.toString().padStart(2, '0') || '00'}
                  </text>
                </>
              ) : showFifthRing && fifthRingContent ? (
                <foreignObject x={cx - 30} y={cy - 30} width="60" height="60">
                  <div className="flex items-center justify-center h-full">
                    {fifthRingContent}
                  </div>
                </foreignObject>
              ) : null}
              
              {/* Label below ring with better styling */}
              {index < 4 && (
                <text
                  x={cx}
                  y={cy + 85}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-sm sm:text-base md:text-lg font-semibold fill-gray-200 font-oxanium uppercase tracking-wide"
                  style={{
                    textShadow: '0 0 5px rgba(0, 0, 0, 0.5)',
                  }}
                >
                  {ringLabels[index]}
                </text>
              )}
              {showFifthRing && index === 4 && (
                <text
                  x={cx}
                  y={cy + 85}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-sm sm:text-base md:text-lg font-semibold fill-gray-200 font-oxanium uppercase tracking-wide"
                  style={{
                    textShadow: '0 0 5px rgba(0, 0, 0, 0.5)',
                  }}
                >
                  {fifthRingContent ? 'Logo' : ''}
                </text>
              )}
            </g>
          );
        })}
      </svg>
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
    <section className="relative py-20 sm:py-24 md:py-28 bg-gradient-to-br from-midnight-steel via-midnight-dark to-midnight-light overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(0, 255, 255, 0.3) 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }} />
      </div>

      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-midnight-steel/50 to-transparent" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Olympic Rings Countdown */}
          <div className="mb-10 sm:mb-12 md:mb-16">
            <OlympicRingsWithCountdown />
          </div>
          
          {/* Title with better spacing and styling */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-oxanium font-bold text-white mb-6 sm:mb-8 md:mb-10 leading-tight">
            <span className="block mb-2 bg-gradient-to-r from-electric-cyan via-electric-blue to-electric-cyan bg-clip-text text-transparent animate-gradient-x">
              Countdown to the 2028 Olympics
            </span>
          </h2>
          
          {/* Description with improved readability */}
          <div className="max-w-3xl mx-auto space-y-4">
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-200 leading-relaxed font-light">
              The Olympic Games begin on <span className="font-semibold text-electric-cyan">July 21, 2028</span>.
            </p>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 leading-relaxed font-light">
              Support our <span className="font-semibold text-white">South African target shooting athletes</span> as they prepare for glory!
            </p>
          </div>

          {/* Decorative elements */}
          <div className="mt-12 sm:mt-16 flex justify-center items-center gap-4">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-electric-cyan" />
            <div className="w-2 h-2 rounded-full bg-electric-cyan animate-pulse" />
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-electric-cyan" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default OlympicCountdown; 