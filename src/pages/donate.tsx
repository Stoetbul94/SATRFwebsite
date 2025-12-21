'use client';

import { useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Layout from '@/components/layout/Layout';
import { FiHeart, FiCreditCard, FiHome, FiMail, FiCopy, FiCheck, FiTarget, FiUsers } from 'react-icons/fi';

const payfastUrl = process.env.NEXT_PUBLIC_PAYFAST_URL || "https://www.payfast.co.za/eng/process";
const merchant_id = process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_ID || "24319614";
const merchant_key = process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_KEY || "sshi091ovn1fa";
const return_url = process.env.NEXT_PUBLIC_PAYFAST_RETURN_URL || (typeof window !== 'undefined' ? `${window.location.origin}/donate/thank-you` : '/donate/thank-you');
const cancel_url = process.env.NEXT_PUBLIC_PAYFAST_CANCEL_URL || (typeof window !== 'undefined' ? `${window.location.origin}/donate` : '/donate');
const notify_url = process.env.NEXT_PUBLIC_PAYFAST_NOTIFY_URL || (typeof window !== 'undefined' ? `${window.location.origin}/api/payfast-notify` : '/api/payfast-notify');

export default function Donate() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(100);
  const [customAmount, setCustomAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'payfast' | 'eft'>('payfast');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const presetAmounts = [100, 250, 500];

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount(null);
  };

  // Always send as integer/float with two decimals (PayFast expects e.g. "250.00")
  const getDonationAmount = () => {
    if (customAmount) return Number(customAmount).toFixed(2);
    if (selectedAmount) return selectedAmount.toFixed(2);
    return "100.00";
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const bankingDetails = {
    accountName: 'South African Target Rifle Federation',
    bank: 'Standard Bank Vereeniging',
    accountType: 'Savings',
    accountNumber: '02 233 062 3',
    branchCode: '014673',
    electronicPaymentsCode: '051001',
    proofOfPayment: 'satrf.shooting@gmail.com',
  };

  return (
    <Layout>
      <Head>
        <title>Donate to Olympic Shooting – SATRF</title>
        <meta name="description" content="Support the South African Target Rifle Federation. Make a donation to help us promote excellence in precision shooting." />
      </Head>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-satrf-navy to-satrf-lightBlue text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
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
            
            <div className="mb-4 text-5xl">🏅🔫</div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Support Olympic Shooting in South Africa
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-gray-200">
              Help the next generation of South African shooters reach the Olympic stage.<br />
              Every donation—big or small—makes a difference!
            </p>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 max-w-2xl mx-auto">
              <p className="text-lg">
                Your donation supports training programs, equipment, competitions, and the development of young shooters across South Africa.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Donation Options */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-satrf-navy mb-4">
              Choose Your Donation Amount
            </h2>
            <p className="text-gray-600 text-lg">
              Every contribution makes a difference in our shooting community
            </p>
          </div>

          {/* Payment Method Selection */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h3 className="text-xl font-semibold text-satrf-navy mb-6">Payment Method</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <button
                onClick={() => setPaymentMethod('payfast')}
                className={`p-4 rounded-lg border-2 flex items-center justify-center space-x-3 transition-all duration-200 ${
                  paymentMethod === 'payfast'
                    ? 'border-satrf-lightBlue bg-satrf-lightBlue text-white'
                    : 'border-gray-300 hover:border-satrf-lightBlue'
                }`}
              >
                <FiCreditCard className="text-xl" />
                <span className="font-semibold">PayFast (Card/PayPal)</span>
              </button>
              <button
                onClick={() => setPaymentMethod('eft')}
                className={`p-4 rounded-lg border-2 flex items-center justify-center space-x-3 transition-all duration-200 ${
                  paymentMethod === 'eft'
                    ? 'border-satrf-lightBlue bg-satrf-lightBlue text-white'
                    : 'border-gray-300 hover:border-satrf-lightBlue'
                }`}
              >
                                 <FiHome className="text-xl" />
                 <span className="font-semibold">EFT Transfer</span>
              </button>
            </div>

            {/* PayFast Form */}
            {paymentMethod === 'payfast' && (
              <div>
                <h3 className="text-xl font-semibold text-satrf-navy mb-6">Select Amount</h3>
                
                <form
                  action={payfastUrl}
                  method="post"
                  target="_blank"
                  className="flex flex-col items-center"
                >
                  {/* Hidden PayFast fields */}
                  <input type="hidden" name="merchant_id" value={merchant_id} />
                  <input type="hidden" name="merchant_key" value={merchant_key} />
                  <input type="hidden" name="return_url" value={return_url} />
                  <input type="hidden" name="cancel_url" value={cancel_url} />
                  <input type="hidden" name="notify_url" value={notify_url} />
                  <input type="hidden" name="item_name" value="SATRF Olympic Shooting Donation" />
                  <input type="hidden" name="email_confirmation" value="1" />
                  <input type="hidden" name="confirmation_address" value="satrf.shooting@gmail.com" />
                  <input type="hidden" name="currency" value="ZAR" />
                  <input type="hidden" name="amount" value={getDonationAmount()} />

                  {/* Preset Amounts */}
                  <div className="flex flex-wrap justify-center gap-2 mb-6">
                    {presetAmounts.map((amount) => (
                      <button
                        type="button"
                        key={amount}
                        className={`px-6 py-3 rounded-lg font-bold border-2 transition-all duration-200 ${
                          selectedAmount === amount && !customAmount
                            ? 'border-satrf-lightBlue bg-satrf-lightBlue text-white'
                            : 'border-gray-300 hover:border-satrf-lightBlue hover:bg-satrf-lightBlue hover:text-white'
                        }`}
                        onClick={() => handleAmountSelect(amount)}
                      >
                        R{amount}
                      </button>
                    ))}
                  </div>

                  {/* Custom Amount */}
                  <div className="mb-6 w-full max-w-md">
                    <label className="form-label">Or enter a custom amount:</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R</span>
                      <input
                        type="number"
                        placeholder="Custom amount"
                        min={10}
                        step={10}
                        value={customAmount}
                        onChange={(e) => handleCustomAmountChange(e.target.value)}
                        onFocus={() => setSelectedAmount(null)}
                        className="input-field pl-8"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full max-w-md btn-primary text-lg py-4"
                  >
                    Donate R{getDonationAmount()} with PayFast
                  </button>
                </form>
                
                <p className="text-xs mt-4 text-gray-500 text-center">
                  Secure payment via PayFast. ZAR only. Confirmation sent by email.
                </p>
              </div>
            )}

            {/* EFT Banking Details */}
            {paymentMethod === 'eft' && (
              <div>
                <h3 className="text-xl font-semibold text-satrf-navy mb-6 flex items-center">
                                   <FiHome className="mr-2" />
                 Banking Details
                </h3>
                
                <div className="space-y-4">
                  {Object.entries(bankingDetails).map(([key, value]) => (
                    <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-700 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}:
                      </span>
                      <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                        <span className="font-mono text-satrf-navy font-semibold">{value}</span>
                        <button
                          onClick={() => copyToClipboard(value, key)}
                          className="p-2 text-gray-500 hover:text-satrf-lightBlue transition-colors"
                          title="Copy to clipboard"
                        >
                          {copiedField === key ? <FiCheck className="text-green-500" /> : <FiCopy />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-satrf-navy mb-3">Proof of Payment Instructions:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-gray-700">
                    <li>Make your EFT payment using the banking details above</li>
                    <li>Use your name as the reference (e.g., "DONATION-JOHN SMITH")</li>
                    <li>Email proof of payment to <a href="mailto:satrf.shooting@gmail.com" className="text-satrf-lightBlue hover:underline">satrf.shooting@gmail.com</a></li>
                    <li>Include your name and contact details in the email</li>
                    <li>You'll receive a confirmation email within 24 hours</li>
                  </ol>
                </div>

                <div className="mt-6 text-center">
                  <a
                    href="mailto:satrf.shooting@gmail.com?subject=SATRF Donation - Proof of Payment"
                    className="btn-primary inline-flex items-center space-x-2"
                  >
                    <FiMail />
                    <span>Email Proof of Payment</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-satrf-navy mb-4">
              Your Donation Makes a Difference
            </h2>
            <p className="text-gray-600 text-lg max-w-3xl mx-auto">
              Every contribution helps us support shooting sports development across South Africa
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-satrf-lightBlue rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <FiTarget className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-satrf-navy mb-2">Training Programs</h3>
              <p className="text-gray-600">
                Support coaching and training programs for young shooters
              </p>
            </div>

            <div className="text-center">
              <div className="bg-satrf-lightBlue rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <FiHeart className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-satrf-navy mb-2">Equipment</h3>
              <p className="text-gray-600">
                Help provide quality equipment for competitions and training
              </p>
            </div>

            <div className="text-center">
              <div className="bg-satrf-lightBlue rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <FiUsers className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-satrf-navy mb-2">Competitions</h3>
              <p className="text-gray-600">
                Fund local and national shooting competitions
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-satrf-navy mb-4">
            Questions About Donating?
          </h2>
          <p className="text-gray-600 text-lg mb-8">
            We're here to help with any questions about your donation
          </p>
          <a
            href="mailto:satrf.shooting@gmail.com"
            className="btn-primary inline-flex items-center space-x-2"
          >
            <FiMail />
            <span>Contact Us</span>
          </a>
        </div>
      </section>
    </Layout>
  );
} 