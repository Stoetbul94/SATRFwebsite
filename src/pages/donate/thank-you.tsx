'use client';

import { useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '@/components/layout/Layout';
import { FiCheckCircle, FiHeart, FiMail, FiHome, FiUsers, FiCalendar, FiTarget } from 'react-icons/fi';

export default function DonateThankYou() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-800 to-red-700">
      <div className="bg-white rounded-xl shadow-xl p-8 text-center max-w-lg">
        <div className="mb-4 text-5xl">🎉</div>
        <h1 className="text-3xl font-extrabold text-green-700 mb-2">Thank You for Your Donation!</h1>
        <p className="text-lg text-gray-700 mb-6">
          Your support helps build the future of Olympic shooting in South Africa.
        </p>
        <p className="text-base text-gray-500">If you need a receipt or have questions, email <a className="text-blue-700 underline" href="mailto:satrf.shooting@gmail.com">satrf.shooting@gmail.com</a></p>
      </div>
    </div>
  );
} 