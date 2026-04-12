'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { fetchUserCredentials, type OwnedCredential } from '@/lib/fetchUserCredentials';
import { PortfolioGrid } from '@/components/PortfolioGrid';
import Link from 'next/link';

export default function DashboardPage() {
  const { profile, loading: authLoading } = useAuth();
  const [credentials, setCredentials] = useState<OwnedCredential[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!profile?.suiAddress) {
        setLoading(false);
        return;
      }

      try {
        const creds = await fetchUserCredentials(profile.suiAddress);
        setCredentials(creds);
      } catch (error) {
        console.error('Failed to fetch credentials:', error);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      load();
    }
  }, [profile, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Loading your credentials...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Your Credentials</h1>
          <p className="text-sm text-gray-400 mt-1">
            {credentials.length} credential{credentials.length !== 1 ? 's' : ''} earned
          </p>
        </div>

        {profile?.username && (
          <Link
            href={`/u/${profile.username}`}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-700 text-sm text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            View Public Profile
          </Link>
        )}
      </div>

      {/* Credential Grid */}
      <PortfolioGrid credentials={credentials} showLinks />

      {/* Setup prompt if no username */}
      {!profile?.username && (
        <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-6 space-y-3">
          <h3 className="text-sm font-semibold text-indigo-300">
            Set up your public portfolio
          </h3>
          <p className="text-sm text-gray-400">
            Choose a username to create your shareable portfolio page at{' '}
            <span className="text-indigo-400 font-mono">suignature.vercel.app/u/your-username</span>
          </p>
          <Link
            href="/dashboard?tab=profile"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
          >
            Set up profile →
          </Link>
        </div>
      )}
    </div>
  );
}
