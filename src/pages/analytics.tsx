import React from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { useAuth, useProtectedRoute } from '../contexts/AuthContext';
import AnalyticsDashboard from '../components/analytics/AnalyticsDashboard';

const AnalyticsPage: NextPage = () => {
  const { user } = useAuth();
  
  // Protect this route
  useProtectedRoute();

  return (
    <>
      <Head>
        <title>Analytics - SATRF</title>
        <meta name="description" content="Your SATRF shooting performance analytics and statistics" />
      </Head>

      <AnalyticsDashboard userId={user?.id} />
    </>
  );
};

export default AnalyticsPage; 