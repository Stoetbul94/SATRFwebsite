import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const HeroSection = () => {
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <section className="relative h-screen w-full overflow-hidden bg-gradient-to-br from-midnight-steel via-midnight-dark to-midnight-light">
      {/* Background SATRF Logo */}
      <div 
        className="absolute inset-0 flex items-center justify-center opacity-10"
        style={{
          backgroundImage: 'url(/SATRFLOGO.png)',
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* Dark overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-midnight-steel/80 via-midnight-dark/70 to-midnight-light/60" />

      {/* Infinite scrolling marquee behind headline */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        <div className="animate-marquee whitespace-nowrap text-6xl md:text-8xl lg:text-9xl font-oxanium font-bold text-electric-cyan/20 select-none">
          SATRF SATRF SATRF SATRF SATRF SATRF SATRF SATRF SATRF SATRF SATRF SATRF SATRF SATRF SATRF SATRF
        </div>
        <div className="absolute animate-marquee whitespace-nowrap text-6xl md:text-8xl lg:text-9xl font-oxanium font-bold text-electric-cyan/20 select-none" style={{ animationDelay: '-60s' }}>
          SATRF SATRF SATRF SATRF SATRF SATRF SATRF SATRF SATRF SATRF SATRF SATRF SATRF SATRF SATRF SATRF
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 sm:px-6 md:px-8 text-center">
        {/* Main headline with neon glow and 3D tilt */}
        <h1 
          className={`font-oxanium font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl text-white mb-6 sm:mb-8 md:mb-10 lg:mb-12 animate-glow-pulse animate-float transform-gpu select-none transition-all duration-700 leading-tight ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
          style={{
            textShadow: `
              0 0 5px #00ffff,
              0 0 10px #00ffff,
              0 0 15px #00ffff,
              0 0 20px #00ffff,
              0 0 25px #00ffff,
              0 0 30px #00ffff,
              0 0 35px #00ffff,
              0 0 40px #00ffff,
              0 0 45px #00ffff,
              0 0 50px #00ffff,
              0 0 55px #00ffff,
              0 0 60px #00ffff,
              0 0 65px #00ffff,
              0 0 70px #00ffff,
              0 0 75px #00ffff,
              0 0 80px #00ffff,
              0 0 85px #00ffff,
              0 0 90px #00ffff,
              0 0 95px #00ffff,
              0 0 100px #00ffff,
              2px 2px 4px rgba(0, 0, 0, 0.8),
              4px 4px 8px rgba(0, 0, 0, 0.6),
              6px 6px 12px rgba(0, 0, 0, 0.4),
              8px 8px 16px rgba(0, 0, 0, 0.2)
            `,
            transform: 'rotate3d(1, 1, 0, 2deg)',
            filter: 'drop-shadow(0 0 20px rgba(0, 255, 255, 0.5))',
          }}
        >
          South African Target Rifle Federation
        </h1>

        {/* Subtitle with subtle glow - split into two lines for better readability */}
        <div 
          className={`max-w-4xl mx-auto mb-8 sm:mb-10 md:mb-12 lg:mb-16 transition-all duration-700 delay-200 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <p 
            className="text-base sm:text-lg md:text-xl lg:text-2xl text-electric-cyan/90 font-light leading-relaxed mb-4"
            style={{
              textShadow: '0 0 10px rgba(0, 255, 255, 0.3), 0 0 20px rgba(0, 255, 255, 0.2)',
            }}
          >
            Promoting excellence in target rifle shooting across South Africa.
          </p>
          <p 
            className="text-base sm:text-lg md:text-xl lg:text-2xl text-electric-cyan/90 font-light leading-relaxed"
            style={{
              textShadow: '0 0 10px rgba(0, 255, 255, 0.3), 0 0 20px rgba(0, 255, 255, 0.2)',
            }}
          >
            Join us in our mission to develop and support competitive shooting sports.
          </p>
        </div>

        {/* CTA Buttons */}
        <div 
          className={`flex flex-col sm:flex-row gap-4 sm:gap-6 transition-all duration-700 delay-300 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <button
            onClick={() => router.push('/register')}
            className="group relative px-8 py-4 bg-gradient-to-r from-electric-cyan to-electric-blue text-midnight-steel font-oxanium font-bold text-lg rounded-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-electric-cyan/50 focus:outline-none focus:ring-4 focus:ring-electric-cyan/50"
            style={{
              boxShadow: '0 0 20px rgba(0, 255, 255, 0.3), inset 0 0 20px rgba(0, 255, 255, 0.1)',
            }}
          >
            <span className="relative z-10">Join SATRF</span>
            <div className="absolute inset-0 bg-gradient-to-r from-electric-neon to-electric-cyan opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>

          <button
            onClick={() => router.push('/events')}
            className="group relative px-8 py-4 border-2 border-electric-cyan text-electric-cyan font-oxanium font-bold text-lg rounded-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:bg-electric-cyan/10 hover:shadow-2xl hover:shadow-electric-cyan/30 focus:outline-none focus:ring-4 focus:ring-electric-cyan/50"
            style={{
              boxShadow: '0 0 15px rgba(0, 255, 255, 0.2)',
            }}
          >
            <span className="relative z-10">View Events</span>
            <div className="absolute inset-0 bg-electric-cyan opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
          </button>
        </div>

        {/* Scroll indicator */}
        <div 
          className={`absolute bottom-8 left-1/2 transform -translate-x-1/2 transition-all duration-700 delay-400 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="w-6 h-10 border-2 border-electric-cyan/50 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-electric-cyan/70 rounded-full mt-2 animate-bounce" />
          </div>
        </div>
      </div>

      {/* Additional ambient effects */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-electric-cyan/30 rounded-full animate-pulse" style={{ animationDelay: '0s' }} />
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-electric-blue/40 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-electric-neon/20 rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-1 h-1 bg-electric-cyan/25 rounded-full animate-pulse" style={{ animationDelay: '3s' }} />
      </div>
    </section>
  );
};

export default HeroSection; 