'use client';

import { useCurrentAccount } from '@mysten/dapp-kit';
import { WalletStatus } from '@/components/WalletStatus';
import { CredentialForm } from '@/components/CredentialForm';
import Link from 'next/link';

export default function IssuePage() {
  const account = useCurrentAccount();

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <Link href="/" className="text-lg font-bold text-white hover:text-gray-200 transition-colors">
              suignature
            </Link>
            <p className="text-xs text-gray-500">Verifiable Proof of Work · Sui Testnet</p>
          </div>
          <WalletStatus />
        </div>
      </header>

      {/* Main */}
      <main className="max-w-2xl mx-auto px-4 py-10">
        {!account ? (
          <div className="text-center space-y-4 py-20">
            <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white">
              Connect your wallet to issue credentials
            </h2>
            <p className="text-gray-400 text-sm max-w-md mx-auto">
              Connect your Sui wallet to start issuing verifiable proof of work credentials to
              students and community volunteers.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-white">Issue a Credential</h2>
              <p className="text-gray-400 text-sm mt-1">
                Fill in the details below. The credential will be minted as a non-transferable
                token directly to the volunteer&apos;s wallet.
              </p>
            </div>
            <CredentialForm />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-20">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <p className="text-xs text-gray-600 text-center">
            Built on Sui · Sui Builders Program Davao 2026 · YGG Pilipinas × Metaversity
          </p>
        </div>
      </footer>
    </div>
  );
}
