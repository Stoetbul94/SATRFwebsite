import React from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { FaTrophy, FaCrosshairs, FaUsers, FaChartLine, FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';
import Layout from '../components/layout/Layout';

// Coach profile data - easily updatable
const coaches = [
  {
    id: 1,
    name: 'Coach Sarah van der Merwe',
    title: 'Head Performance Coach',
    credentials: ['ISSF Level 3 Coach', 'Former National Champion', '15+ Years Experience'],
    bio: 'Sarah is a former South African shooting champion with over 15 years of coaching experience. She specializes in mental preparation and technical precision, having trained numerous national and international competitors.',
    specialties: ['Mental Preparation', 'Technical Precision', 'Competition Strategy'],
    achievements: ['Trained 5 National Champions', 'ISSF Level 3 Certification', 'Sports Science Degree'],
    image: '/images/coaches/coach-sarah.jpg', // Placeholder - add actual image
    contact: {
      email: 'sarah@satrf.co.za',
      phone: '+27 82 123 4567'
    }
  },
  {
    id: 2,
    name: 'Coach Michael Botha',
    title: 'Technical Development Coach',
    credentials: ['ISSF Level 2 Coach', 'Former Olympic Coach', '20+ Years Experience'],
    bio: 'Michael brings two decades of elite coaching experience, having worked with Olympic athletes and national teams. His expertise lies in biomechanics, equipment optimization, and long-term athlete development.',
    specialties: ['Biomechanics', 'Equipment Optimization', 'Youth Development'],
    achievements: ['Olympic Coach 2016', '20+ International Medals', 'Biomechanics Certification'],
    image: '/images/coaches/coach-michael.jpg', // Placeholder - add actual image
    contact: {
      email: 'michael@satrf.co.za',
      phone: '+27 83 987 6543'
    }
  }
];

// Benefits of coaching services
const coachingBenefits = [
  {
    icon: FaCrosshairs,
    title: 'Personalized Training Plans',
    description: 'Custom programs tailored to your skill level, goals, and competition schedule.'
  },
  {
    icon: FaTrophy,
    title: 'Competitive Edge',
    description: 'Learn advanced techniques and strategies used by elite shooters worldwide.'
  },
  {
    icon: FaChartLine,
    title: 'Performance Tracking',
    description: 'Comprehensive progress monitoring with data-driven improvement strategies.'
  },
  {
    icon: FaUsers,
    title: 'Expert Mentorship',
    description: 'One-on-one guidance from certified coaches with proven track records.'
  }
];

const CoachingPage: NextPage = () => {
  return (
    <Layout>
      <Head>
        <title>Elite Coaching Services - SATRF</title>
        <meta name="description" content="Professional shooting coaching services in South Africa. Personalized training from certified coaches to improve your performance and competitive edge." />
        <meta name="keywords" content="shooting coaching, SATRF coaching, South Africa shooting, performance training, ISSF coaching" />
      </Head>

      {/* Hero Section */}
      <section className="relative min-h-screen bg-gradient-to-br from-midnight-steel via-midnight-dark to-midnight-light flex items-center justify-center overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-32 h-32 border border-electric-cyan rounded-full"></div>
          <div className="absolute bottom-20 right-20 w-24 h-24 border border-electric-neon rounded-full"></div>
          <div className="absolute top-1/2 left-1/4 w-16 h-16 border border-electric-cyan rounded-full"></div>
        </div>

        <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-oxanium font-bold text-electric-cyan mb-6 leading-tight">
            Elite Coaching for
            <span className="block text-electric-neon">South African Shooters</span>
          </h1>

          {/* Subheading */}
          <p className="text-xl sm:text-2xl text-gray-300 font-oxanium mb-8 max-w-3xl mx-auto leading-relaxed">
            Transform your shooting performance with personalized training from certified coaches. 
            Master advanced techniques, develop mental resilience, and achieve your competitive goals.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <button 
              onClick={() => window.location.href = '/contact?service=coaching'}
              className="px-8 py-4 bg-electric-cyan text-midnight-steel font-oxanium font-bold text-lg rounded-lg hover:bg-electric-neon transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-electric-cyan/25"
            >
              Book Your Free Consultation
            </button>
            <button 
              onClick={() => document.getElementById('coaches')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-4 border-2 border-electric-cyan text-electric-cyan font-oxanium font-bold text-lg rounded-lg hover:bg-electric-cyan hover:text-midnight-steel transition-all duration-300"
            >
              Meet Our Coaches
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-oxanium font-bold text-electric-cyan">15+</div>
              <div className="text-sm text-gray-400 font-oxanium">Years Experience</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-oxanium font-bold text-electric-cyan">50+</div>
              <div className="text-sm text-gray-400 font-oxanium">National Champions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-oxanium font-bold text-electric-cyan">95%</div>
              <div className="text-sm text-gray-400 font-oxanium">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-oxanium font-bold text-electric-cyan">24/7</div>
              <div className="text-sm text-gray-400 font-oxanium">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-midnight-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-oxanium font-bold text-electric-cyan mb-4">
              Why Choose SATRF Coaching?
            </h2>
            <p className="text-xl text-gray-300 font-oxanium max-w-3xl mx-auto">
              Our comprehensive coaching approach combines technical expertise with proven methodologies 
              to deliver measurable results for shooters at every level.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {coachingBenefits.map((benefit, index) => (
              <div 
                key={index}
                className="bg-midnight-light/30 border border-gray-700 rounded-lg p-6 text-center hover:border-electric-cyan transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className="w-16 h-16 bg-electric-cyan/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-8 h-8 text-electric-cyan" />
                </div>
                <h3 className="text-xl font-oxanium font-bold text-electric-cyan mb-3">
                  {benefit.title}
                </h3>
                <p className="text-gray-300 font-oxanium">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coaches Section */}
      <section id="coaches" className="py-20 bg-gradient-to-br from-midnight-steel to-midnight-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-oxanium font-bold text-electric-cyan mb-4">
              Meet Our Elite Coaches
            </h2>
            <p className="text-xl text-gray-300 font-oxanium max-w-3xl mx-auto">
              Learn from the best in South African shooting. Our certified coaches bring decades of 
              combined experience in competitive shooting and athlete development.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {coaches.map((coach) => (
              <div 
                key={coach.id}
                className="bg-midnight-light/20 border border-gray-700 rounded-xl overflow-hidden hover:border-electric-cyan transition-all duration-300 transform hover:scale-105"
              >
                {/* Coach Image */}
                <div className="relative h-64 bg-gradient-to-br from-electric-cyan/20 to-electric-neon/20">
                  {/* Placeholder for coach image */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-24 h-24 bg-electric-cyan/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaUsers className="w-12 h-12 text-electric-cyan" />
                      </div>
                      <p className="text-electric-cyan font-oxanium">Coach Photo</p>
                      <p className="text-sm text-gray-400 font-oxanium">Add {coach.name.split(' ')[1]}'s photo here</p>
                    </div>
                  </div>
                </div>

                {/* Coach Info */}
                <div className="p-8">
                  <h3 className="text-2xl font-oxanium font-bold text-electric-cyan mb-2">
                    {coach.name}
                  </h3>
                  <p className="text-electric-neon font-oxanium font-medium mb-4">
                    {coach.title}
                  </p>

                  {/* Credentials */}
                  <div className="mb-6">
                    <h4 className="text-lg font-oxanium font-bold text-gray-200 mb-3">Credentials</h4>
                    <ul className="space-y-2">
                      {coach.credentials.map((credential, index) => (
                        <li key={index} className="flex items-center text-gray-300 font-oxanium">
                          <div className="w-2 h-2 bg-electric-cyan rounded-full mr-3"></div>
                          {credential}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Bio */}
                  <p className="text-gray-300 font-oxanium mb-6 leading-relaxed">
                    {coach.bio}
                  </p>

                  {/* Specialties */}
                  <div className="mb-6">
                    <h4 className="text-lg font-oxanium font-bold text-gray-200 mb-3">Specialties</h4>
                    <div className="flex flex-wrap gap-2">
                      {coach.specialties.map((specialty, index) => (
                        <span 
                          key={index}
                          className="px-3 py-1 bg-electric-cyan/20 text-electric-cyan font-oxanium text-sm rounded-full border border-electric-cyan/30"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="border-t border-gray-700 pt-6">
                    <h4 className="text-lg font-oxanium font-bold text-gray-200 mb-3">Contact</h4>
                    <div className="space-y-2">
                      <div className="flex items-center text-gray-300 font-oxanium">
                        <FaEnvelope className="w-4 h-4 text-electric-cyan mr-3" />
                        <a href={`mailto:${coach.contact.email}`} className="hover:text-electric-cyan transition-colors">
                          {coach.contact.email}
                        </a>
                      </div>
                      <div className="flex items-center text-gray-300 font-oxanium">
                        <FaPhone className="w-4 h-4 text-electric-cyan mr-3" />
                        <a href={`tel:${coach.contact.phone}`} className="hover:text-electric-cyan transition-colors">
                          {coach.contact.phone}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-midnight-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-oxanium font-bold text-electric-cyan mb-4">
              Success Stories
            </h2>
            <p className="text-xl text-gray-300 font-oxanium max-w-3xl mx-auto">
              Hear from shooters who have transformed their performance with SATRF coaching.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-midnight-light/30 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-electric-cyan/20 rounded-full flex items-center justify-center mr-4">
                  <FaTrophy className="w-6 h-6 text-electric-cyan" />
                </div>
                <div>
                  <h4 className="font-oxanium font-bold text-electric-cyan">David Mokoena</h4>
                  <p className="text-sm text-gray-400 font-oxanium">National Champion 2023</p>
                </div>
              </div>
              <p className="text-gray-300 font-oxanium italic">
                "Coach Sarah's mental preparation techniques completely changed my approach to competition. 
                I went from struggling under pressure to winning my first national title."
              </p>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-midnight-light/30 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center mb-4">
                                 <div className="w-12 h-12 bg-electric-cyan/20 rounded-full flex items-center justify-center mr-4">
                   <FaCrosshairs className="w-6 h-6 text-electric-cyan" />
                 </div>
                <div>
                  <h4 className="font-oxanium font-bold text-electric-cyan">Lisa Pretorius</h4>
                  <p className="text-sm text-gray-400 font-oxanium">International Competitor</p>
                </div>
              </div>
              <p className="text-gray-300 font-oxanium italic">
                "Michael's technical expertise helped me improve my accuracy by 15% in just 6 months. 
                His equipment optimization advice was game-changing."
              </p>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-midnight-light/30 border border-gray-700 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-electric-cyan/20 rounded-full flex items-center justify-center mr-4">
                  <FaChartLine className="w-6 h-6 text-electric-cyan" />
                </div>
                <div>
                  <h4 className="font-oxanium font-bold text-electric-cyan">Johan van Wyk</h4>
                  <p className="text-sm text-gray-400 font-oxanium">Youth Development</p>
                </div>
              </div>
              <p className="text-gray-300 font-oxanium italic">
                "The personalized training program helped my son develop from a beginner to a competitive 
                shooter in just one year. The coaches are incredibly supportive."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-electric-cyan to-electric-neon">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-oxanium font-bold text-midnight-steel mb-6">
            Ready to Transform Your Shooting?
          </h2>
          <p className="text-xl text-midnight-steel font-oxanium mb-8 max-w-2xl mx-auto">
            Take the first step towards achieving your shooting goals. Book a free consultation 
            and discover how our coaching can elevate your performance.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button 
              onClick={() => window.location.href = '/contact?service=coaching'}
              className="px-8 py-4 bg-midnight-steel text-electric-cyan font-oxanium font-bold text-lg rounded-lg hover:bg-midnight-dark transition-all duration-300 transform hover:scale-105"
            >
              Book Free Consultation
            </button>
            <button 
              onClick={() => window.location.href = 'tel:+27123456789'}
              className="px-8 py-4 border-2 border-midnight-steel text-midnight-steel font-oxanium font-bold text-lg rounded-lg hover:bg-midnight-steel hover:text-electric-cyan transition-all duration-300"
            >
              Call Now: +27 12 345 6789
            </button>
          </div>

          <div className="mt-8 text-midnight-steel font-oxanium">
            <p className="text-lg font-bold mb-2">Limited Time Offer</p>
            <p className="text-sm">First session free • No commitment required • Flexible scheduling</p>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default CoachingPage; 