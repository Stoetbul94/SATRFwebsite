'use client';

import { useState, useEffect } from 'react';
import { FiClock, FiAward } from 'react-icons/fi';

const OlympicCountdown = () => {
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

  if (hasStarted) {
    return (
      <section className="py-16 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-2xl">
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
    <section className="py-16 bg-gradient-to-br from-satrf-navy via-blue-900 to-satrf-lightBlue">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="mb-8">
          <div className="flex justify-center mb-4">
            <FiClock className="text-5xl text-white" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Countdown to the 2028 Olympics
          </h2>
          <p className="text-xl text-gray-200 max-w-2xl mx-auto">
            The Olympic Games begin on July 21, 2028. 
            Support our South African target shooting athletes as they prepare for glory!
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-3xl md:text-4xl font-bold text-white mb-2">
              {timeLeft.days.toString().padStart(2, '0')}
            </div>
            <div className="text-sm md:text-base text-gray-200 font-medium">
              Days
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-3xl md:text-4xl font-bold text-white mb-2">
              {timeLeft.hours.toString().padStart(2, '0')}
            </div>
            <div className="text-sm md:text-base text-gray-200 font-medium">
              Hours
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-3xl md:text-4xl font-bold text-white mb-2">
              {timeLeft.minutes.toString().padStart(2, '0')}
            </div>
            <div className="text-sm md:text-base text-gray-200 font-medium">
              Minutes
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-3xl md:text-4xl font-bold text-white mb-2">
              {timeLeft.seconds.toString().padStart(2, '0')}
            </div>
            <div className="text-sm md:text-base text-gray-200 font-medium">
              Seconds
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 inline-block">
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