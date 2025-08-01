'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiCalendar, FiUsers, FiTarget, FiTrendingUp, FiArrowRight } from 'react-icons/fi';
import Layout from '@/components/layout/Layout';
import OlympicCountdown from '@/components/OlympicCountdown';
import { eventsAPI, dashboardAPI } from '@/lib/api';
import type { Event } from '@/lib/api';

export default function Home() {
  const [stats, setStats] = useState({
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
        // Fetch dashboard stats
        const statsData = await dashboardAPI.getStats();
        setStats(statsData);

        // Fetch upcoming events
        const eventsData = await eventsAPI.getAll({ status: 'open' });
        setUpcomingEvents(eventsData.slice(0, 3)); // Show first 3 events
      } catch (error) {
        console.error('Error fetching home page data:', error);
        // Use fallback data if API fails
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-satrf-navy text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* SATRF Logo */}
            <div className="mb-8">
              <Image
                src="/images/affiliates/SATRFLOGO.png"
                alt="SATRF Logo"
                width={200}
                height={80}
                className="mx-auto"
                style={{ height: 'auto', maxWidth: '200px' }}
              />
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              South African Target Rifle Federation
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-gray-300">
              Excellence in Precision Shooting Since 1960
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="btn-primary text-lg px-8 py-4">
                Join SATRF
              </Link>
              <Link href="/events" className="btn-secondary text-lg px-8 py-4">
                View Events
              </Link>
            </div>
          </div>
        </div>
      </section>

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
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Our Partners
            </h2>
            <p className="text-gray-600">
              Working together with leading organizations in target shooting
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-8 items-center">
            {[
              'ISSF-Logo.jpg',
              'SASSCO_Logo.jpeg',
              'TeamSa.jpg',
              'ChatGPT Image May 28, 2025, 02_05_58 AM.png',
              'ChatGPT Image Jun 3, 2025, 08_57_38 PM.png',
              'SATRFLOGO.png'
            ].map((logo, index) => (
              <div key={index} className="flex justify-center">
                <Image
                  src={`/images/affiliates/${logo}`}
                  alt={`Partner logo ${index + 1}`}
                  width={120}
                  height={60}
                  className="h-12 w-auto grayscale hover:grayscale-0 transition-all duration-200"
                />
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