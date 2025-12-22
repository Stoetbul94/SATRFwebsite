import React, { useState } from 'react';
import Head from 'next/head';
import { FiDownload, FiExternalLink, FiSearch, FiFileText, FiShield, FiTarget } from 'react-icons/fi';
import { FiAlertTriangle } from 'react-icons/fi';
import Layout from '../components/layout/Layout';

interface RuleDocument {
  id: string;
  title: string;
  description: string;
  category: string;
  webUrl?: string;
  pdfUrl?: string;
  icon: React.ReactNode;
}

const RulesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Define all rule documents
  const ruleDocuments: RuleDocument[] = [
    {
      id: 'general-technical',
      title: 'General Technical Rules',
      description: 'Comprehensive technical regulations governing all ISSF shooting sports competitions and equipment standards.',
      category: 'technical',
      webUrl: 'https://www.issf-sports.org/rules/general-technical-rules',
      pdfUrl: 'https://backoffice.issf-sports.org/getfile.aspx?mod=docf&pane=1&inst=458&file=ISSF_-Technical-Rules-Rule_Book_2023_Approved_Version.pdf',
      icon: <FiFileText className="w-6 h-6" />
    },
    {
      id: 'rifle-rules',
      title: 'Rifle Rules',
      description: 'Specific regulations for rifle shooting events, including position requirements, scoring, and competition formats.',
      category: 'rifle',
      webUrl: 'https://www.issf-sports.org/rules/rifle',
      pdfUrl: 'https://backoffice.issf-sports.org/getfile.aspx?mod=docf&pane=1&inst=460&file=ISSF_Rifle-Rules_Book_2023_Approved_Version.pdf',
      icon: <FiTarget className="w-6 h-6" />
    },
    {
      id: 'anti-doping',
      title: 'Anti-Doping Regulations',
      description: 'Official anti-doping policies and procedures to ensure fair competition and athlete health protection.',
      category: 'doping',
      webUrl: 'https://www.issf-sports.org/rules/anti-doping',
      pdfUrl: 'https://backoffice.issf-sports.org/getfile.aspx?mod=docf&pane=1&inst=457&file=ISSF_Doping-Rules-Rule_Book_2023_Approved_Version.pdf',
      icon: <FiShield className="w-6 h-6" />
    },
    {
      id: 'disciplinary',
      title: 'Disciplinary Regulations',
      description: 'Rules and procedures for handling violations, appeals, and disciplinary actions in shooting sports.',
      category: 'disciplinary',
      webUrl: 'https://www.issf-sports.org/rules/disciplinary-regulations',
      icon: <FiAlertTriangle className="w-6 h-6" />
    }
  ];

  // Filter documents based on search term and category
  const filteredDocuments = ruleDocuments.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Categories for filtering
  const categories = [
    { id: 'all', name: 'All Documents', count: ruleDocuments.length },
    { id: 'technical', name: 'Technical Rules', count: ruleDocuments.filter(d => d.category === 'technical').length },
    { id: 'rifle', name: 'Rifle Rules', count: ruleDocuments.filter(d => d.category === 'rifle').length },
    { id: 'doping', name: 'Anti-Doping', count: ruleDocuments.filter(d => d.category === 'doping').length },
    { id: 'disciplinary', name: 'Disciplinary', count: ruleDocuments.filter(d => d.category === 'disciplinary').length }
  ];

  // Handle download all PDFs
  const handleDownloadAll = () => {
    const pdfDocuments = ruleDocuments.filter(doc => doc.pdfUrl);
    if (pdfDocuments.length === 0) {
      alert('No PDF documents available for download.');
      return;
    }
    
    // Open each PDF in a new tab (alternative to ZIP download)
    pdfDocuments.forEach(doc => {
      if (doc.pdfUrl) {
        window.open(doc.pdfUrl, '_blank', 'noopener,noreferrer');
      }
    });
  };

  return (
    <Layout>
      <Head>
        <title>ISSF Rules & Documentation - SATRF</title>
        <meta name="description" content="Access official ISSF shooting sport rules, technical regulations, anti-doping policies, and disciplinary procedures. Essential documentation for competitive shooting in South Africa." />
        <meta name="keywords" content="ISSF rules, shooting regulations, technical rules, anti-doping, disciplinary regulations, SATRF, South African target shooting" />
        <meta property="og:title" content="ISSF Rules & Documentation - SATRF" />
        <meta property="og:description" content="Official ISSF shooting sport rules and documentation for competitive shooting in South Africa." />
        <meta property="og:type" content="website" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-satrf-navy via-blue-900 to-satrf-lightBlue">
        <div className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              ISSF Rules & Documentation
            </h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Access official ISSF shooting sport rules and regulations essential for competitive shooting. 
              These documents ensure fair competition, safety standards, and proper conduct in all shooting events.
            </p>
          </div>

          {/* Search and Filter Section */}
          <div className="mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative max-w-md mx-auto">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search rules and documentation..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                    aria-label="Search rules and documentation"
                  />
                </div>
              </div>

              {/* Category Filters */}
              <div className="flex flex-wrap justify-center gap-2">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      selectedCategory === category.id
                        ? 'bg-white text-satrf-navy shadow-lg'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                    aria-label={`Filter by ${category.name}`}
                  >
                    {category.name} ({category.count})
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Download All Button */}
          <div className="text-center mb-8">
            <button
              onClick={handleDownloadAll}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
              aria-label="Download all available PDF documents"
            >
              <FiDownload className="w-5 h-5" />
              Download All PDFs
            </button>
          </div>

          {/* Rules Documents Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:border-white/40 transition-all duration-300 hover:shadow-xl"
              >
                {/* Document Icon and Title */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-white">
                    {doc.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    {doc.title}
                  </h3>
                </div>

                {/* Description */}
                <p className="text-gray-300 mb-6 leading-relaxed">
                  {doc.description}
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  {doc.webUrl && (
                    <a
                      href={doc.webUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                      aria-label={`View ${doc.title} on ISSF website`}
                    >
                      <FiExternalLink className="w-4 h-4" />
                      View Online
                    </a>
                  )}
                  
                  {doc.pdfUrl && (
                    <a
                      href={doc.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                      aria-label={`Download ${doc.title} PDF`}
                    >
                      <FiDownload className="w-4 h-4" />
                      Download PDF
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* No Results Message */}
          {filteredDocuments.length === 0 && (
            <div className="text-center py-12">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
                <FiSearch className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  No documents found
                </h3>
                <p className="text-gray-300">
                  Try adjusting your search terms or category filter to find the rules you're looking for.
                </p>
              </div>
            </div>
          )}

          {/* Additional Information */}
          <div className="mt-12 bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">
              Important Information
            </h2>
            <div className="grid md:grid-cols-2 gap-6 text-gray-300">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  📋 Rule Updates
                </h3>
                <p>
                  ISSF rules are updated periodically. Always refer to the latest versions available on the official ISSF website for the most current regulations.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  🎯 Competition Requirements
                </h3>
                <p>
                  All SATRF competitions follow ISSF rules. Familiarize yourself with these documents to ensure compliance and fair competition.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  ⚖️ Anti-Doping Compliance
                </h3>
                <p>
                  All athletes must comply with anti-doping regulations. Understanding these rules is essential for participation in any competitive shooting event.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  📞 Contact Support
                </h3>
                <p>
                  For questions about rule interpretation or technical requirements, contact SATRF officials or refer to the official ISSF documentation.
                </p>
              </div>
            </div>
          </div>

          {/* Back to Home */}
          <div className="mt-8 text-center">
            <a
              href="/"
              className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default RulesPage; 