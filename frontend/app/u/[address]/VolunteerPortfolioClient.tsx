'use client';

import { useEffect, useState } from 'react';
import { fetchUserCredentials, type OwnedCredential } from '@/lib/fetchUserCredentials';
import { CredentialCard } from '@/components/CredentialCard';
import { shortenAddress, addressExplorerUrl } from '@/lib/credential';
import Link from 'next/link';

interface Props {
  address: string;
}

export function VolunteerPortfolioClient({ address }: Props) {
  const [credentials, setCredentials] = useState<OwnedCredential[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserCredentials(address)
      .then(setCredentials)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [address]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-base font-bold text-gray-900 hover:text-gray-700 transition-colors">
            suignature
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Live on Sui Testnet
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Profile header */}
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
            Verified Portfolio
          </p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">
            {shortenAddress(address)}
          </h1>
          <a
            href={addressExplorerUrl(address)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block text-xs text-gray-400 hover:text-indigo-600 transition-colors"
          >
            View on Sui Explorer ↗
          </a>
        </div>

        {/* Credential grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Loading credentials…</p>
          </div>
        ) : credentials.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 py-20 text-center text-gray-400">
            No credentials found for this address.
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-gray-500">
              {credentials.length} verified credential{credentials.length !== 1 ? 's' : ''}
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-400">suignature · Verifiable Proof of Work</p>
          <p className="text-xs text-gray-400">Built on Sui · Sui Builders Program Davao 2026</p>
        </div>
      </footer>
    </div>
  );
}
