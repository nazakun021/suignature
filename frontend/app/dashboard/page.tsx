'use client';

import { useEffect, useState } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { fetchUserCredentials, type OwnedCredential } from '@/lib/fetchUserCredentials';
import { CredentialCard } from '@/components/CredentialCard';
import { shortenAddress } from '@/lib/credential';
import { SiteHeader } from '@/components/SiteHeader';
import Link from 'next/link';

type LoadState = 'idle' | 'loading' | 'success' | 'error';

export default function DashboardPage() {
  const account = useCurrentAccount();
  const address = account?.address ?? null;

  const [rawCredentials, setRawCredentials] = useState<OwnedCredential[]>([]);
  const [rawLoadState, setRawLoadState] = useState<LoadState>('idle');

  // Derive display state based on address presence
  // If we have an address but rawLoadState is still 'idle', we are effectively 'loading'
  const loadState = (address && rawLoadState === 'idle') ? 'loading' : (address ? rawLoadState : 'idle');
  const credentials = address ? rawCredentials : [];

  useEffect(() => {
    if (!address) return;

    fetchUserCredentials(address)
      .then((data) => {
        setRawCredentials(data);
        setRawLoadState('success');
      })
      .catch((err) => {
        console.error('Dashboard fetch error:', err);
        setRawLoadState('error');
      });
  }, [address]);

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader theme="light" />

      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Not connected */}
        {!address && (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="mb-6 w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-3xl">
              🔐
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              Connect your wallet to see your credentials
            </h2>
            <p className="mt-2 max-w-sm text-sm text-gray-500">
              Use your Slush or Sui Wallet to view verifiable proof-of-work 
              credentials issued to your address.
            </p>
          </div>
        )}

        {/* Connected Content */}
        {address && (
          <>
            {/* Header info */}
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">My Credentials</h1>
                <p className="mt-1.5 text-sm text-gray-500 flex items-center gap-2">
                  <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                    {shortenAddress(address)}
                  </span>
                  {loadState === 'success' && (
                    <>
                      <span>·</span>
                      <span>{credentials.length} credential{credentials.length !== 1 ? 's' : ''} earned</span>
                    </>
                  )}
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(address);
                    // Simple feedback could be added here
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Copy Address
                </button>
                <Link
                  href={`/u/${address}`}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors shadow-sm"
                >
                  View Public Portfolio ↗
                </Link>
              </div>
            </div>

            {/* Main states */}
            {loadState === 'loading' && (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-medium text-gray-500 animate-pulse">
                  Querying Sui blockchain...
                </p>
              </div>
            )}

            {loadState === 'error' && (
              <div className="py-24 text-center bg-red-50 rounded-2xl border border-red-100">
                <p className="font-semibold text-red-600">Failed to load credentials</p>
                <p className="mt-1 text-sm text-red-500 opacity-80">
                  There was a problem querying the Sui network. Please refresh.
                </p>
              </div>
            )}

            {loadState === 'success' && credentials.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white py-24 text-center">
                <div className="mb-4 text-4xl opacity-20">📜</div>
                <h3 className="text-lg font-semibold text-gray-900">No credentials yet</h3>
                <p className="mt-2 max-w-sm text-sm text-gray-500 px-6">
                  Verify your community work by having an organizer issue a 
                  credential to your wallet address.
                </p>
              </div>
            )}

            {loadState === 'success' && credentials.length > 0 && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {credentials.map((cred) => (
                  <CredentialCard
                    key={cred.objectId}
                    objectId={cred.objectId}
                    projectOrEvent={cred.projectOrEvent}
                    issuerName={cred.issuerName}
                    skillsVerified={cred.skillsVerified}
                    timestamp={cred.timestamp}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <footer className="max-w-6xl mx-auto px-4 py-12 border-t border-gray-200 mt-12 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-gray-400">suignature · Verifiable Proof of Work Portfolio</p>
        <p className="text-xs text-gray-400">Built for Sui Builders Program 2026</p>
      </footer>
    </div>
  );
}
