import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { FiCalendar, FiUsers, FiTarget, FiTrendingUp, FiArrowRight } from 'react-icons/fi';
import Layout from '@/components/layout/Layout';
import HeroSection from '@/components/home/HeroSection';
import OlympicCountdown from '@/components/OlympicCountdown';
import { eventsAPI, dashboardAPI } from '@/lib/api';
import type { Event, DashboardStats } from '@/lib/api';

export default function Home() {
  const [stats, setStats] = useState<DashboardStats>({
    members: 1250,
    events: 12,
    scores: 'Updated',
    news: 'Latest'
  });
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Attempting to fetch dashboard stats...');
        // Fetch dashboard stats
        const statsData = await dashboardAPI.getStats();
        console.log('Stats data received:', statsData);
        setStats(statsData);

        // Fetch upcoming events
        const eventsData = await eventsAPI.getAll({ status: 'open' });
        // Handle both array and paginated response formats
        const eventsArray = Array.isArray(eventsData) 
          ? eventsData 
          : (eventsData.data || []);
        setUpcomingEvents(eventsArray.slice(0, 3)); // Show first 3 events
      } catch (error) {
        console.error('Error fetching home page data:', error);
        console.log('Setting fallback data...');
        // Use fallback data if API fails - this allows the page to work without backend
        setStats({
          members: 1250,
          events: 12,
          scores: 'Updated',
          news: 'Latest'
        });
        setUpcomingEvents([]);
        // Small delay to ensure fallback data is visible
        await new Promise(resolve => setTimeout(resolve, 100));
      } finally {
        console.log('Setting loading to false, current stats:', stats);
        setLoading(false);
      }
    };

    // Add a fallback in case the async function fails completely
    fetchData().catch((error) => {
      console.error('Critical error in fetchData:', error);
      // Ensure fallback data is set even if the main try-catch fails
      setStats({
        members: 1250,
        events: 12,
        scores: 'Updated',
        news: 'Latest'
      });
      setUpcomingEvents([]);
      setLoading(false);
    });
  }, []);

  return (
    <Layout>
      <Head>
        <title>South African Target Rifle Federation - SATRF</title>
        <meta name="description" content="The official national governing body for target rifle shooting in South Africa. Join SATRF for competitions, training, and elite shooting sports." />
        <meta property="og:title" content="South African Target Rifle Federation - SATRF" />
        <meta property="og:description" content="The official national governing body for target rifle shooting in South Africa." />
        <meta property="og:type" content="website" />
        <meta name="keywords" content="target rifle, shooting sports, South Africa, SATRF, ISSF, competitive shooting" />
      </Head>
      {/* New Hero Section */}
      <HeroSection />

      {/* Olympic Countdown Section */}
      <OlympicCountdown />

      {/* Dashboard Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-satrf-lightBlue rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <FiUsers className="text-white text-2xl" />
              </div>
              <div className="text-3xl font-bold text-satrf-navy mb-2">
                {loading ? '...' : stats.members.toLocaleString()}
              </div>
              <div className="text-gray-600 font-medium">Active Members</div>
              <div className="text-sm text-gray-500">Growing community</div>
            </div>

            <div className="text-center">
              <div className="bg-satrf-lightBlue rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <FiCalendar className="text-white text-2xl" />
              </div>
              <div className="text-3xl font-bold text-satrf-navy mb-2">
                {loading ? '...' : stats.events}
              </div>
              <div className="text-gray-600 font-medium">Events This Month</div>
              <div className="text-sm text-gray-500">Competitions & training</div>
            </div>

            <div className="text-center">
              <div className="bg-satrf-lightBlue rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <FiTarget className="text-white text-2xl" />
              </div>
              <div className="text-3xl font-bold text-satrf-navy mb-2">
                {loading ? '...' : stats.scores}
              </div>
              <div className="text-gray-600 font-medium">Scores Daily</div>
              <div className="text-sm text-gray-500">Real-time tracking</div>
            </div>

            <div className="text-center">
              <div className="bg-satrf-lightBlue rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <FiTrendingUp className="text-white text-2xl" />
              </div>
              <div className="text-3xl font-bold text-satrf-navy mb-2">
                {loading ? '...' : stats.news}
              </div>
              <div className="text-gray-600 font-medium">News & Updates</div>
              <div className="text-sm text-gray-500">Stay informed</div>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Upcoming Events
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Join our upcoming competitions and training sessions. Register early to secure your spot.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {loading ? (
              // Loading skeleton
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="card animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              ))
            ) : upcomingEvents.length > 0 ? (
              upcomingEvents.map((event) => (
                <div key={event.id} className="card hover:shadow-lg transition-shadow duration-200">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-sm text-gray-500">
                      {new Date(event.date).toLocaleDateString()}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      event.status === 'open' ? 'bg-green-100 text-green-800' :
                      event.status === 'full' ? 'bg-orange-100 text-orange-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {event.title}
                  </h3>
                  
                  <p className="text-gray-600 mb-4">
                    {event.location}
                  </p>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      {event.type}
                    </span>
                    <Link
                      href={`/events/register/${event.id}`}
                      className="text-satrf-lightBlue hover:text-satrf-navy font-medium text-sm flex items-center"
                    >
                      Register
                      <FiArrowRight className="ml-1" />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500">No upcoming events at the moment.</p>
                <Link href="/events" className="text-satrf-lightBlue hover:text-satrf-navy font-medium">
                  View all events
                </Link>
              </div>
            )}
          </div>

          <div className="text-center mt-8">
            <Link href="/events" className="btn-primary">
              View All Events
            </Link>
          </div>
        </div>
      </section>

      {/* Affiliate Logos Section */}
      <section className="py-20 sm:py-24 md:py-28 bg-gradient-to-b from-white via-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section with Better Spacing */}
          <div className="text-center mb-12 sm:mb-16 md:mb-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-oxanium font-bold text-gray-900 mb-4 sm:mb-6">
              Our Partners
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Working together with leading organizations in target shooting
            </p>
          </div>

          {/* Partner Logos Grid with Enhanced Styling */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 md:gap-12 items-center justify-items-center">
            {[
              { name: 'ISSF', logo: 'ISSF-Logo.jpg' },
              { name: 'SASSCO', logo: 'SASSCO_Logo.jpeg' },
              { name: 'Team SA', logo: 'TeamSa.jpg' },
              { name: 'SATRF', logo: 'SATRFLOGO.png' }
            ].map((partner, index) => (
              <div 
                key={index} 
                className="group flex flex-col items-center justify-center w-full max-w-[200px] transition-all duration-300 hover:scale-105"
              >
                <div className="relative w-full h-24 sm:h-28 md:h-32 mb-3 sm:mb-4 flex items-center justify-center p-4 sm:p-6 bg-white rounded-lg shadow-sm hover:shadow-lg border border-gray-100 hover:border-gray-200 transition-all duration-300">
                  <Image
                    src={`/images/affiliates/${partner.logo}`}
                    alt={`${partner.name} logo`}
                    width={150}
                    height={80}
                    className="w-auto h-full object-contain grayscale group-hover:grayscale-0 transition-all duration-300"
                  />
                </div>
                <p className="text-sm sm:text-base font-medium text-gray-700 mt-2 text-center">
                  {partner.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 bg-satrf-navy text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Join the SATRF Community?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Become part of South Africa's premier target rifle shooting federation. 
            Access exclusive events, training programs, and connect with fellow shooters.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="btn-primary text-lg px-8 py-4">
              Register Now
            </Link>
            <Link href="/contact" className="btn-secondary text-lg px-8 py-4">
              Contact Us
            </Link>
            <Link href="/about" className="btn-secondary text-lg px-8 py-4">
              Learn More
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
} 