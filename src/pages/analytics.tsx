import { GetServerSideProps } from 'next';

/** Legacy analytics page — performance charts now live on /dashboard */
export default function AnalyticsRedirect() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/dashboard#performance',
      permanent: false,
    },
  };
};
