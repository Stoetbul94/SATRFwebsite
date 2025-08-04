import React from 'react';
import Head from 'next/head';
import Layout from '../components/layout/Layout';
import MonitoringDashboard from '../components/monitoring/MonitoringDashboard';

const MonitoringPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>Monitoring Dashboard - SATRF Website</title>
        <meta name="description" content="Real-time monitoring and alerting system for SATRF website" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      
      <Layout>
        <MonitoringDashboard />
      </Layout>
    </>
  );
};

export default MonitoringPage; 