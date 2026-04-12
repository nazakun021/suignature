'use client';

import { useState, useCallback } from 'react';

interface SuccessCardProps {
  objectId: string;
  volunteerName: string;
  onIssueAnother: () => void;
}

export function SuccessCard({ objectId, volunteerName, onIssueAnother }: SuccessCardProps) {
  const [copied, setCopied] = useState(false);

  const verifyUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/verify/${objectId}`
      : `/verify/${objectId}`;

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(verifyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [verifyUrl]);

  return (
    <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
          <span className="text-green-400 text-xl">✓</span>
        </div>
        <div>
          <h3 className="text-white font-semibold">Credential Issued Successfully</h3>
          <p className="text-gray-400 text-sm">
            Minted to {volunteerName}&apos;s wallet on Sui Testnet
          </p>
        </div>
      </div>

      {/* Verify URL */}
      <div className="space-y-1">
        <p className="text-xs text-gray-400 uppercase tracking-wide">Shareable Verify Link</p>
        <div className="flex items-center gap-2 bg-gray-900 rounded-lg p-3 border border-gray-700">
          <span className="text-sm text-indigo-400 font-mono truncate flex-1">
            {verifyUrl}
          </span>
          <button
            onClick={handleCopy}
            className="text-xs px-3 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shrink-0 cursor-pointer"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <p className="text-xs text-gray-500">
          Share this link with the volunteer. They can add it to their resume or LinkedIn.
        </p>
      </div>

      {/* Object ID reference */}
      <div className="space-y-1">
        <p className="text-xs text-gray-500">
          Object ID:{' '}
          <a
            href={`https://suiscan.xyz/testnet/object/${objectId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white font-mono underline underline-offset-2"
          >
            {objectId.slice(0, 12)}...{objectId.slice(-8)}
          </a>
        </p>
      </div>

      {/* Issue Another */}
      <button
        onClick={onIssueAnother}
        className="w-full py-2 rounded-lg border border-gray-600 text-gray-400 hover:text-white hover:border-gray-400 text-sm transition-colors cursor-pointer"
      >
        Issue Another Credential
      </button>
    </div>
  );
}
