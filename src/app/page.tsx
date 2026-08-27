'use client';

import React, { useState } from 'react';

export default function Page() {
  // Feature Card Component
  const FeatureCard: React.FC<{
    gradient: string;
    icon: JSX.Element;
    title: string;
    description: string;
  }> = ({ gradient, icon, title, description }) => (
    <div className="group p-8 bg-gray-900/80 backdrop-blur border border-gray-700 rounded-2xl hover:border-gray-600 transition-all duration-300 hover:transform hover:scale-105 shadow-lg hover:shadow-xl">
      <div className={`w-14 h-14 ${gradient} rounded-xl flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform duration-300 shadow-lg`}>
        <div className="text-white">{icon}</div>
      </div>
      <h3 className="text-xl font-semibold text-gray-100 mb-3 group-hover:text-emerald-400 transition-colors">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{description}</p>
    </div>
  );

  // Trusted Partner Component
  const TrustedPartner: React.FC<{
    gradient: string;
    letter: string;
    name: string;
  }> = ({ gradient, letter, name }) => (
    <div className="group flex flex-col items-center space-y-4 p-6 bg-gray-900/80 backdrop-blur border border-gray-700 rounded-2xl hover:border-gray-600 transition-all duration-300 hover:transform hover:scale-105 shadow-lg hover:shadow-xl">
      <div className={`w-16 h-16 ${gradient} rounded-2xl flex items-center justify-center mb-4 group-hover:rotate-6 transition-transform duration-300 shadow-lg`}>
        <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center">
          <div className="w-8 h-8 bg-gray-950 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">{letter}</span>
          </div>
        </div>
      </div>
      <h3 className="text-sm font-semibold text-gray-300 group-hover:text-gray-100 transition-colors text-center">{name}</h3>
    </div>
  );

  // Stats Card Component
  const StatsCard: React.FC<{
    value: string;
    label: string;
  }> = ({ value, label }) => (
    <div className="text-center p-6 bg-gray-900/80 backdrop-blur border border-gray-700 rounded-2xl shadow-lg">
      <div className="text-3xl font-bold text-emerald-400 mb-2">{value}</div>
      <div className="text-gray-300">{label}</div>
    </div>
  );

  // SVG Components
  const CircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle w-4 h-4 text-white fill-current">
      <circle cx="12" cy="12" r="10"></circle>
    </svg>
  );

  const ArrowRightIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right w-5 h-5 group-hover:translate-x-1 transition-transform">
      <path d="M5 12h14"></path>
      <path d="m12 5 7 7-7 7"></path>
    </svg>
  );

  const ShieldIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield w-6 h-6 text-white">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path>
    </svg>
  );

  const CheckCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-circle w-4 h-4 text-emerald-400">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <path d="m9 11 3 3L22 4"></path>
    </svg>
  );

  const NetworkIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-network w-4 h-4 text-blue-400">
      <rect x="16" y="16" width="6" height="6" rx="1"></rect>
      <rect x="2" y="16" width="6" height="6" rx="1"></rect>
      <rect x="9" y="2" width="6" height="6" rx="1"></rect>
      <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"></path>
      <path d="M12 12V8"></path>
    </svg>
  );

  const ZapIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-zap w-4 h-4 text-yellow-400">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
    </svg>
  );

  const SettingsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings w-4 h-4 text-purple-400">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  );

  const RefreshCwIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-refresh-cw w-4 h-4">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
      <path d="M21 3v5h-5"></path>
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
      <path d="M8 16H3v5"></path>
    </svg>
  );

  const GlobeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-globe w-6 h-6">
      <circle cx="12" cy="12" r="10"></circle>
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
      <path d="M2 12h20"></path>
    </svg>
  );

  const LockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-lock w-6 h-6">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 1 0 0"></path>
    </svg>
  );

  const SmartphoneIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-smartphone w-6 h-6">
      <rect width="14" height="20" x="5" y="2" rx="2" ry="2"></rect>
      <path d="M12 18h"></path>
    </svg>
  );

  const CloudIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-cloud w-6 h-6">
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path>
    </svg>
  );

  const EyeIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      width={24}
      height={24}
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );

  const EyeOffIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye-off w-5 h-5">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path>
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path>
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path>
      <line x1="2" x2="22" y1="2" y2="22"></line>
    </svg>
  );

  const CloseIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
    </svg>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 relative">
      <div className="relative z-10">
        <header className="relative z-10">
          <nav className="flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                <CircleIcon />
              </div>
              <span className="text-xl font-semibold text-gray-100">Meta Dapps</span>
            </div>
            <a href="/profile">
              <button
                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors shadow-lg hover:shadow-xl hover:scale-105"
              >
                Connect
              </button>
            </a>
          </nav>
        </header>
        <main className="px-6 py-16">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center px-4 py-2 bg-emerald-900/50 border border-emerald-700 rounded-full mb-8">
                  <span className="text-emerald-400 text-sm font-medium">✨ Web3 Troubleshooting Made Simple</span>
                </div>
                <h1 className="text-5xl md:text-6xl font-bold text-gray-100 mb-6 leading-tight">
                  Fix Web3 Issues <br />
                  <span className="text-emerald-400">in Seconds</span>
                </h1>
                <p className="text-xl text-gray-400 mb-8 leading-relaxed max-w-lg">
                  Your all-in-one tool for solving common Web3 problems. Fast and stress-free.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <a href="/profile">
                    <button
                      className="group px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl hover:scale-105"
                    >
                      <span>Connect Wallet</span>
                      <ArrowRightIcon />
                    </button>
                  </a>
                  <a href="/profile">
                    <button className="px-8 py-4 bg-gray-900 border-2 border-gray-700 hover:border-gray-600 text-gray-300 font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg">
                      Validate Wallet
                    </button>
                  </a>
                </div>
              </div>
              <div className="lg:ml-auto">
                <div className="bg-gray-900/80 backdrop-blur border border-gray-700 rounded-2xl p-8 max-w-md shadow-xl">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                      <ShieldIcon />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-100">Wallet Security Check</h3>
                      <p className="text-gray-500 text-sm">Real-time monitoring</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-emerald-900 rounded-full flex items-center justify-center">
                          <CheckCircleIcon />
                        </div>
                        <span className="text-gray-300 font-medium">Security Status</span>
                      </div>
                      <span className="px-3 py-1 text-sm font-medium rounded-full bg-emerald-900 text-emerald-400">Secure</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-900 rounded-full flex items-center justify-center">
                          <NetworkIcon />
                        </div>
                        <span className="text-gray-300 font-medium">Network</span>
                      </div>
                      <span className="text-blue-400 font-medium">All Chains</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-yellow-900 rounded-full flex items-center justify-center">
                          <ZapIcon />
                        </div>
                        <span className="text-gray-300 font-medium">Gas Optimization</span>
                      </div>
                      <span className="px-3 py-1 bg-yellow-900 text-yellow-400 text-sm font-medium rounded-full">Enabled</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-900 rounded-full flex items-center justify-center">
                          <SettingsIcon />
                        </div>
                        <span className="text-gray-300 font-medium">Transaction History</span>
                      </div>
                      <span className="text-purple-400 font-medium">Clean</span>
                    </div>
                  </div>
                  <button
                    className="w-full mt-8 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                  >
                    <RefreshCwIcon />
                    <span>Run Diagnostics</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
        <div className="mt-24 px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-100 mb-4">Powerful Features to Enhance Your Web3 Experience</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">Our platform provides all the tools you need to navigate the Web3 ecosystem safely and efficiently</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            <FeatureCard
              gradient="bg-gradient-to-r from-emerald-500 to-emerald-400"
              icon={<ShieldIcon />}
              title="Security Audits"
              description="Automatically scan your wallet for security vulnerabilities and get recommendations to improve your protection."
            />
            <FeatureCard
              gradient="bg-gradient-to-r from-purple-500 to-pink-500"
              icon={<ZapIcon />}
              title="Gas Optimization"
              description="Save on transaction fees with our intelligent gas price optimizer that finds the best balance between cost and speed."
            />
            <FeatureCard
              gradient="bg-gradient-to-r from-green-500 to-teal-500"
              icon={<GlobeIcon />}
              title="Transaction Recovery"
              description="Recover stuck or pending transactions with our advanced recovery tools and get your assets moving again."
            />
            <FeatureCard
              gradient="bg-gradient-to-r from-orange-500 to-red-500"
              icon={<LockIcon />}
              title="Private & Secure"
              description="Your keys, your crypto. We never store or access private information."
            />
            <FeatureCard
              gradient="bg-gradient-to-r from-indigo-500 to-purple-500"
              icon={<SmartphoneIcon />}
              title="Performance Analytics"
              description="Get detailed insights into your wallet's performance, transaction history, and asset allocation."
            />
            <FeatureCard
              gradient="bg-gradient-to-r from-cyan-500 to-blue-500"
              icon={<CloudIcon />}
              title="Smart Contract Verification"
              description="Verify the safety of smart contracts before interacting with them to prevent scams and exploits."
            />
          </div>
        </div>
        <div className="mt-24 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-100 mb-4">Trusted by Industry Leaders</h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">Join millions of users who trust our platform for their Web3 security and troubleshooting needs</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center">
              <TrustedPartner gradient="bg-gradient-to-r from-blue-500 to-blue-400" letter="T" name="Trust Wallet" />
              <TrustedPartner gradient="bg-gradient-to-r from-yellow-500 to-yellow-400" letter="B" name="Binance" />
              <TrustedPartner gradient="bg-gradient-to-r from-orange-500 to-orange-400" letter="B" name="Bybit" />
              <TrustedPartner gradient="bg-gradient-to-r from-indigo-500 to-indigo-400" letter="C" name="Coinbase" />
              <TrustedPartner gradient="bg-gradient-to-r from-purple-500 to-purple-400" letter="K" name="Kraken" />
              <TrustedPartner gradient="bg-gradient-to-r from-green-500 to-green-400" letter="K" name="KuCoin" />
            </div>
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
              <StatsCard value="10M+" label="Wallets Protected" />
              <StatsCard value="99.9%" label="Uptime Guarantee" />
              <StatsCard value="24/7" label="Security Monitoring" />
            </div>
          </div>
        </div>
        <footer className="mt-24 py-12 px-6 border-t border-gray-700">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-gray-400">© 2025 Meta Dapps. Built with security and privacy in mind.</p>
            <div className="flex justify-center space-x-6 mt-4">
              <a href="#" className="text-gray-500 hover:text-gray-300 transition-colors">Privacy</a>
              <a href="#" className="text-gray-500 hover:text-gray-300 transition-colors">Terms</a>
              <a href="#" className="text-gray-500 hover:text-gray-300 transition-colors">Security</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};