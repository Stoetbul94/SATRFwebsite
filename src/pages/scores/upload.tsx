import Link from 'next/link';
import { FiTarget, FiAward, FiInfo } from 'react-icons/fi';
import Layout from '@/components/layout/Layout';

export default function ScoreUpload() {
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">How scores are published</h1>
            <p className="text-gray-600">
              Match results are entered by SATRF federation administrators — not uploaded directly
              by members.
            </p>
          </div>

          <div className="card space-y-6">
            <div className="flex gap-3">
              <FiInfo className="text-satrf-lightBlue text-xl flex-shrink-0 mt-1" />
              <div>
                <p className="text-gray-700">
                  After each match, officials import scores using the official Excel workbook, PDF
                  match reports, or manual entry in the admin system. Once saved, your results
                  appear on your dashboard and in public rankings.
                </p>
              </div>
            </div>

            <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
              <li>Qualification and finals follow ISSF decimal scoring (with ring counts where recorded).</li>
              <li>You do not need to submit scores yourself after a registered event.</li>
              <li>If a result is missing or incorrect, contact your club delegate or SATRF admin.</li>
            </ul>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link href="/dashboard" className="btn-primary text-center inline-flex items-center justify-center gap-2">
                <FiTarget />
                View my scores
              </Link>
              <Link
                href="/scores"
                className="btn-secondary text-center inline-flex items-center justify-center gap-2"
              >
                <FiAward />
                Season rankings
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
