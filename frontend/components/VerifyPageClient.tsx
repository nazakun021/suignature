'use client';

import { useEffect, useState, useCallback } from 'react';
import { fetchCredential, CredentialData } from '@/lib/credential';
import { CertificateCard } from './CertificateCard';
import { VerificationTrail } from './VerificationTrail';

type LoadState = 'loading' | 'success' | 'not_found' | 'invalid' | 'error';

interface VerifyPageClientProps {
  objectId: string;
}

export function VerifyPageClient({ objectId }: VerifyPageClientProps) {
  const [state, setState] = useState<LoadState>('loading');
  const [credential, setCredential] = useState<CredentialData | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchCredential(objectId);
        if (!cancelled) {
          setCredential(data);
          setState('success');
        }
      } catch (err: unknown) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'UNKNOWN_ERROR';
        if (message === 'CREDENTIAL_NOT_FOUND') {
          setState('not_found');
        } else if (message === 'NOT_A_CREDENTIAL' || message === 'INVALID_OBJECT_TYPE') {
          setState('invalid');
        } else {
          setState('error');
          setErrorMessage(message);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [objectId]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header — clean, no wallet connection needed */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-gray-900">suignature</h1>
            <p className="text-xs text-gray-400">Verified Credentials Platform</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Live on Sui Testnet
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-3xl mx-auto px-4 py-10">
        {state === 'loading' && <LoadingState />}
        {state === 'not_found' && <NotFoundState objectId={objectId} />}
        {state === 'invalid' && <InvalidState objectId={objectId} />}
        {state === 'error' && <ErrorState message={errorMessage} />}
        {state === 'success' && credential && (
          <SuccessState credential={credential} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 py-5 space-y-3">
          {/* Discovery links — connect verify page to profiles */}
          {state === 'success' && credential && (
            <DiscoveryLinks credential={credential} />
          )}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-gray-400">
              suignature · Verifiable Proof of Work
            </p>
            <p className="text-xs text-gray-400">
              Built on Sui · Sui Builders Program Davao 2026
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── Success state ─────────────────────────────────────────────────────────────
function SuccessState({ credential }: { credential: CredentialData }) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-1 pb-2">
        <h2 className="text-xl font-bold text-gray-900">
          Verified Work Credential
        </h2>
        <p className="text-sm text-gray-500">
          This credential has been independently verified and permanently recorded.
        </p>
      </div>

      <CertificateCard credential={credential} />

      <VerificationTrail
        issuerName={credential.issuerName}
        issuerAddress={credential.issuerAddress}
        volunteerName={credential.volunteerName}
        ownerAddress={credential.ownerAddress}
        objectId={credential.objectId}
        issuedAt={credential.issuedAt}
      />

      {/* Explainer callout */}
      <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4 space-y-1">
        <p className="text-sm font-semibold text-indigo-800">
          Why can you trust this credential?
        </p>
        <p className="text-sm text-indigo-700 leading-relaxed">
          This certificate was issued directly to the recipient&apos;s personal digital identity
          by {credential.issuerName}. It is permanently and publicly recorded —
          it cannot be edited, deleted, or transferred to another person.
          Anyone with this link can verify it independently at any time.
        </p>
      </div>

      {/* Print / share actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <ShareButton objectId={credential.objectId} />
        <PrintButton />
      </div>
    </div>
  );
}

// ── Loading state ─────────────────────────────────────────────────────────────
function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 space-y-4">
      <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-500">Retrieving credential...</p>
      <p className="text-xs text-gray-400">Connecting to the Sui network</p>
    </div>
  );
}

// ── Not found state ───────────────────────────────────────────────────────────
function NotFoundState({ objectId }: { objectId: string }) {
  return (
    <div className="text-center py-24 space-y-4">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-gray-800">Credential Not Found</h2>
      <p className="text-sm text-gray-500 max-w-md mx-auto">
        No credential exists at this address. The link may be incorrect or the credential
        may not have been issued yet.
      </p>
      <p className="text-xs text-gray-400 font-mono bg-gray-100 rounded px-3 py-1.5 inline-block">
        {objectId}
      </p>
    </div>
  );
}

// ── Invalid object state ──────────────────────────────────────────────────────
function InvalidState({ objectId }: { objectId: string }) {
  return (
    <div className="text-center py-24 space-y-4">
      <div className="w-16 h-16 rounded-full bg-yellow-50 flex items-center justify-center mx-auto">
        <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.194-.833-2.964 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-gray-800">Invalid Credential</h2>
      <p className="text-sm text-gray-500 max-w-md mx-auto">
        This link does not point to a valid suignature credential.
        Please check the URL and try again.
      </p>
      <p className="text-xs text-gray-400 font-mono bg-gray-100 rounded px-3 py-1.5 inline-block">
        {objectId}
      </p>
    </div>
  );
}

// ── Generic error state ───────────────────────────────────────────────────────
function ErrorState({ message }: { message: string }) {
  return (
    <div className="text-center py-24 space-y-4">
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto">
        <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-gray-800">Something Went Wrong</h2>
      <p className="text-sm text-gray-500 max-w-md mx-auto">
        We had trouble connecting to the network. Please refresh the page and try again.
      </p>
      <p className="text-xs text-red-400 font-mono bg-red-50 rounded px-3 py-1.5 inline-block">
        {message}
      </p>
    </div>
  );
}

// ── Share button ──────────────────────────────────────────────────────────────
function ShareButton({ objectId }: { objectId: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const url = `${window.location.origin}/verify/${objectId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [objectId]);

  return (
    <button
      onClick={handleCopy}
      className="flex-1 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer flex items-center justify-center gap-2"
    >
      {copied ? (
        <>
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Link Copied
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          Copy Verification Link
        </>
      )}
    </button>
  );
}

// ── Print button ──────────────────────────────────────────────────────────────
function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex-1 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer flex items-center justify-center gap-2"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
      </svg>
      Print Certificate
    </button>
  );
}

// ── Discovery links — connect verify page to profiles ─────────────────────────
function DiscoveryLinks({ credential }: { credential: CredentialData }) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 py-2 border-b border-gray-100">
      <a
        href={`/verify/${credential.objectId}`}
        className="text-xs text-gray-500 hover:text-indigo-600 transition-colors flex items-center gap-1"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        View all credentials from {credential.issuerName} →
      </a>
      <span className="hidden sm:inline text-gray-300">·</span>
      <a
        href="#"
        className="text-xs text-gray-500 hover:text-indigo-600 transition-colors flex items-center gap-1"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        See {credential.volunteerName}&apos;s full portfolio →
      </a>
    </div>
  );
}
