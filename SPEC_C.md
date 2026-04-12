# Phase C — Recruiter Verify Page Specification

### suignature | `/verify/[objectId]` · Public Certificate View

---

## Overview

Phase C is the most important page in the entire product from a **user value perspective**. It is the only thing a recruiter, hiring manager, or employer ever sees. Everything in Phase A and B exists to produce a single shareable URL — and this page is what lives at that URL.

**Design Philosophy:** The verify page must feel like a professional certificate platform — not a blockchain explorer. A recruiter who has never heard of Sui, Move, wallets, or Web3 should open this link and immediately understand: _"This person did real work, and someone credible verified it."_ All blockchain mechanics are completely invisible to them.

**Goal:** A public, read-only Next.js page at `/verify/[objectId]` that fetches a credential object from the Sui Testnet, renders it as a clean professional certificate with a QR code, and provides a human-readable verification trail — all without requiring the visitor to have a wallet, connect anything, or understand any Web3 concepts.

**Prerequisite:** Phase B must be complete. You need at least one real credential Object ID minted on Testnet to test this page.

**Estimated time:** 60–90 minutes

---

## The Web2 UX Principle

Every decision in this phase is filtered through one question:

> _"If my non-tech aunt received this link, would she trust it?"_

This means:

| ❌ Never show          | ✅ Always show               |
| ---------------------- | ---------------------------- |
| Object IDs             | Volunteer's full name        |
| Transaction digests    | Event or project name        |
| Wallet addresses (raw) | Issuer's organization name   |
| "gas", "Move", "BCS"   | Skills as plain English tags |
| Blockchain jargon      | A clean, dated certificate   |
| Hex strings            | A verification badge         |

The **only** technical affordance visible is a small "View blockchain record" link tucked at the bottom for those who want to dig deeper. It is not in the primary visual hierarchy.

---

## Directory Structure

New files added in Phase C:

```
frontend/
├── app/
│   ├── layout.tsx                          ← (Phase B, unchanged)
│   ├── page.tsx                            ← (Phase B, unchanged)
│   └── verify/
│       └── [objectId]/
│           └── page.tsx                    ← NEW: Public certificate page
├── components/
│   ├── CredentialForm.tsx                  ← (Phase B, unchanged)
│   ├── SkillSelector.tsx                   ← (Phase B, unchanged)
│   ├── SuccessCard.tsx                     ← (Phase B, unchanged)
│   ├── WalletStatus.tsx                    ← (Phase B, unchanged)
│   ├── CertificateCard.tsx                 ← NEW: The certificate UI
│   ├── CertificateQR.tsx                   ← NEW: QR code component
│   ├── VerificationTrail.tsx               ← NEW: Issuer + recipient info
│   └── SkillBadge.tsx                      ← NEW: Individual skill tag badge
└── lib/
    ├── constants.ts                        ← (Phase B, unchanged)
    ├── sui.ts                              ← (Phase B, unchanged)
    └── credential.ts                       ← NEW: On-chain fetch + type parser
```

---

## C1. Install QR Code Dependency

```bash
cd frontend
npm install qrcode.react
npm install --save-dev @types/qrcode
```

> `qrcode.react` renders QR codes as pure SVG in React with zero external services.
> No API calls, no tracking, no third-party dependencies at runtime.

---

## C2. Type Definitions & On-Chain Fetcher

### `lib/credential.ts`

This file owns all on-chain data fetching and type parsing for a credential. It is the **only** place in the codebase that talks to the Sui RPC for credential reads.

```typescript
// lib/credential.ts

import { suiClient } from "./sui";

// ── Parsed credential type ────────────────────────────────────────────────────
export interface CredentialData {
  objectId: string;
  volunteerName: string;
  projectOrEvent: string;
  skillsVerified: string[];
  issuerName: string;
  issuerAddress: string;
  timestamp: number; // ms since epoch (u64 from chain)
  issuedAt: Date; // parsed Date object for display
  ownerAddress: string; // current owner (the volunteer's wallet)
}

// ── Fetch and parse a credential from Sui Testnet ─────────────────────────────
export async function fetchCredential(
  objectId: string,
): Promise<CredentialData> {
  const response = await suiClient.getObject({
    id: objectId,
    options: {
      showContent: true,
      showOwner: true,
    },
  });

  // Object not found
  if (!response.data) {
    throw new Error("CREDENTIAL_NOT_FOUND");
  }

  const content = response.data.content;

  // Object exists but is not a Move struct (e.g., a coin or package)
  if (!content || content.dataType !== "moveObject") {
    throw new Error("INVALID_OBJECT_TYPE");
  }

  // Type guard: confirm this is our credential module
  if (!content.type.includes("::credential::Credential")) {
    throw new Error("NOT_A_CREDENTIAL");
  }

  // Parse the fields
  const fields = content.fields as Record<string, unknown>;

  const timestamp = Number(fields.timestamp);

  // Parse owner address
  const owner = response.data.owner;
  let ownerAddress = "Unknown";
  if (owner && typeof owner === "object" && "AddressOwner" in owner) {
    ownerAddress = owner.AddressOwner as string;
  }

  return {
    objectId,
    volunteerName: fields.volunteer_name as string,
    projectOrEvent: fields.project_or_event as string,
    skillsVerified: fields.skills_verified as string[],
    issuerName: fields.issuer_name as string,
    issuerAddress: fields.issuer_address as string,
    timestamp,
    issuedAt: new Date(timestamp),
    ownerAddress,
  };
}

// ── Format date for display (Web2-friendly, no timestamps) ───────────────────
export function formatIssuedDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ── Shorten a wallet address for display (Web2-friendly) ────────────────────
// Shows "0x1234...5678" — enough to identify, not overwhelming
export function shortenAddress(address: string): string {
  if (address.length < 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// ── Build the Sui explorer URL for the credential object ────────────────────
export function explorerUrl(objectId: string): string {
  return `https://suiscan.xyz/testnet/object/${objectId}`;
}

// ── Build the Sui explorer URL for a wallet address ────────────────────────
export function addressExplorerUrl(address: string): string {
  return `https://suiscan.xyz/testnet/account/${address}`;
}
```

---

## C3. Component Specifications

### Component 1: `components/SkillBadge.tsx`

A single skill tag rendered as a clean pill badge. Used in the certificate.

```typescript
// components/SkillBadge.tsx

interface SkillBadgeProps {
  skill: string;
}

export function SkillBadge({ skill }: SkillBadgeProps) {
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
      {skill}
    </span>
  );
}
```

---

### Component 2: `components/CertificateQR.tsx`

Renders a QR code pointing to the current page's URL. When a recruiter scans it, they land on the same verify page — confirming the credential is real and shareable.

```typescript
// components/CertificateQR.tsx
'use client';

import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface CertificateQRProps {
  objectId: string;
}

export function CertificateQR({ objectId }: CertificateQRProps) {
  const [url, setUrl] = useState('');

  useEffect(() => {
    // Only runs client-side — window is not available during SSR
    setUrl(`${window.location.origin}/verify/${objectId}`);
  }, [objectId]);

  if (!url) return null;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
        <QRCodeSVG
          value={url}
          size={96}
          bgColor="#ffffff"
          fgColor="#1e1b4b"
          level="M"
          includeMargin={false}
        />
      </div>
      <p className="text-xs text-gray-400 text-center max-w-[120px] leading-tight">
        Scan to verify this credential
      </p>
    </div>
  );
}
```

---

### Component 3: `components/VerificationTrail.tsx`

This is the key Web3→Web2 translation component. It shows the **verification trail** — who issued the credential and who received it — in plain, recruiter-readable language. Wallet addresses are shown in shortened form with links to the explorer, but framed as "identities" not "hashes."

```typescript
// components/VerificationTrail.tsx

import { shortenAddress, addressExplorerUrl, explorerUrl } from '@/lib/credential';

interface VerificationTrailProps {
  issuerName: string;
  issuerAddress: string;
  volunteerName: string;
  ownerAddress: string;
  objectId: string;
  issuedAt: Date;
}

export function VerificationTrail({
  issuerName,
  issuerAddress,
  volunteerName,
  ownerAddress,
  objectId,
  issuedAt,
}: VerificationTrailProps) {
  const formattedDate = issuedAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-sm font-semibold text-gray-700">
            Verification Trail
          </span>
          <span className="text-xs text-gray-400 ml-auto">
            Recorded on Sui Blockchain
          </span>
        </div>
      </div>

      {/* Trail Steps */}
      <div className="px-5 py-4 space-y-4">

        {/* Step 1: Issued by */}
        <TrailStep
          step={1}
          label="Issued by"
          name={issuerName}
          address={issuerAddress}
          description="The organization that verified and signed this credential"
        />

        {/* Connector line */}
        <div className="ml-4 w-px h-4 bg-gray-300" />

        {/* Step 2: Issued to */}
        <TrailStep
          step={2}
          label="Issued to"
          name={volunteerName}
          address={ownerAddress}
          description="The individual whose work is being recognized"
        />

        {/* Connector line */}
        <div className="ml-4 w-px h-4 bg-gray-300" />

        {/* Step 3: Timestamp */}
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0 text-xs font-bold text-gray-500">
            3
          </div>
          <div className="space-y-0.5 pt-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Date &amp; Time of Issuance
            </p>
            <p className="text-sm font-medium text-gray-800">{formattedDate}</p>
            <p className="text-xs text-gray-400">
              Timestamp is permanently recorded and cannot be altered
            </p>
          </div>
        </div>
      </div>

      {/* Footer: Blockchain record link (small, non-intrusive) */}
      <div className="px-5 py-3 border-t border-gray-200 bg-white">
        <a
          href={explorerUrl(objectId)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-400 hover:text-indigo-600 transition-colors flex items-center gap-1"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          View original blockchain record
        </a>
      </div>
    </div>
  );
}

// ── Sub-component: individual trail step ─────────────────────────────────────
function TrailStep({
  step,
  label,
  name,
  address,
  description,
}: {
  step: number;
  label: string;
  name: string;
  address: string;
  description: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 text-xs font-bold text-indigo-600">
        {step}
      </div>
      <div className="space-y-0.5 pt-1 min-w-0">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {label}
        </p>
        <p className="text-sm font-semibold text-gray-900">{name}</p>
        <a
          href={addressExplorerUrl(address)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-400 hover:text-indigo-600 font-mono transition-colors"
        >
          {shortenAddress(address)} ↗
        </a>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
    </div>
  );
}
```

---

### Component 4: `components/CertificateCard.tsx`

The main certificate. This is the primary visual — what a recruiter screenshots, prints, or shares. It must look premium and trustworthy with zero technical jargon in the primary visual hierarchy.

```typescript
// components/CertificateCard.tsx
'use client';

import { CredentialData, formatIssuedDate } from '@/lib/credential';
import { SkillBadge } from './SkillBadge';
import { CertificateQR } from './CertificateQR';

interface CertificateCardProps {
  credential: CredentialData;
}

export function CertificateCard({ credential }: CertificateCardProps) {
  const {
    objectId,
    volunteerName,
    projectOrEvent,
    skillsVerified,
    issuerName,
    issuedAt,
  } = credential;

  return (
    <div
      id="certificate-card"
      className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden"
    >
      {/* Certificate top accent bar */}
      <div className="h-1.5 w-full bg-linear-to-r from-indigo-600 via-violet-600 to-indigo-400" />

      <div className="p-8 space-y-6">
        {/* Header: Logo + Verified badge */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest mb-1">
              Certificate of Verified Work
            </p>
            <h1 className="text-2xl font-bold text-gray-900">suignature</h1>
          </div>
          <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-3 py-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs font-semibold text-green-700">Verified</span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100" />

        {/* Main content + QR code side by side */}
        <div className="flex gap-6 items-start">
          {/* Left: Credential details */}
          <div className="flex-1 space-y-5">
            {/* Issued To */}
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">
                This certifies that
              </p>
              <p className="text-2xl font-bold text-gray-900">{volunteerName}</p>
            </div>

            {/* Issued For */}
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">
                Demonstrated verified contributions to
              </p>
              <p className="text-base font-semibold text-gray-800">{projectOrEvent}</p>
            </div>

            {/* Issued By */}
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">
                Verified and issued by
              </p>
              <p className="text-base font-semibold text-gray-800">{issuerName}</p>
            </div>

            {/* Date */}
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">
                Date of issuance
              </p>
              <p className="text-sm text-gray-700">{formatIssuedDate(issuedAt)}</p>
            </div>
          </div>

          {/* Right: QR Code */}
          <div className="shrink-0">
            <CertificateQR objectId={objectId} />
          </div>
        </div>

        {/* Skills */}
        {skillsVerified.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-gray-400 uppercase tracking-wide">
              Skills Verified
            </p>
            <div className="flex flex-wrap gap-2">
              {skillsVerified.map((skill) => (
                <SkillBadge key={skill} skill={skill} />
              ))}
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-gray-100" />

        {/* Certificate footer */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
            This credential is cryptographically verified and permanently recorded.
            It cannot be forged, transferred, or revoked by anyone other than the original issuer.
          </p>
          {/* Sui verification mark — small, tasteful */}
          <div className="flex items-center gap-1.5 shrink-0">
            <svg
              className="w-4 h-4 text-indigo-400"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
            <span className="text-xs text-gray-400">Verified on Sui</span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## C4. Main Verify Page — `app/verify/[objectId]/page.tsx`

This is a **Server Component** for the outer shell (enabling proper `<title>` meta tags and SSR), with client-side data fetching handled via a child `'use client'` component.

### Page Architecture

```
app/verify/[objectId]/page.tsx     ← Server Component: sets metadata, renders shell
         └── VerifyPageClient.tsx  ← Client Component: fetches data, renders UI states
```

### `app/verify/[objectId]/page.tsx` — Server Shell

```typescript
// app/verify/[objectId]/page.tsx

import { VerifyPageClient } from '@/components/VerifyPageClient';

interface VerifyPageProps {
  params: { objectId: string };
}

export async function generateMetadata({ params }: VerifyPageProps) {
  return {
    title: `Verified Credential · suignature`,
    description: `This credential has been cryptographically verified and recorded on the Sui blockchain.`,
    openGraph: {
      title: 'Verified Proof of Work · suignature',
      description: 'Cryptographically verified community contribution credential.',
    },
  };
}

export default function VerifyPage({ params }: VerifyPageProps) {
  return <VerifyPageClient objectId={params.objectId} />;
}
```

### `components/VerifyPageClient.tsx` — Full Client Implementation

```typescript
// components/VerifyPageClient.tsx
'use client';

import { useEffect, useState } from 'react';
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
        <div className="max-w-3xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-400">
            suignature · Verifiable Proof of Work
          </p>
          <p className="text-xs text-gray-400">
            Built on Sui · Sui Builders Program Davao 2026
          </p>
        </div>
      </footer>
    </div>
  );
}

// ── Success state ─────────────────────────────────────────────────────────────
function SuccessState({ credential }: { credential: CredentialData }) {
  return (
    <div className="space-y-6">
      {/* Page intro — Web2 language */}
      <div className="text-center space-y-1 pb-2">
        <h2 className="text-xl font-bold text-gray-900">
          Verified Work Credential
        </h2>
        <p className="text-sm text-gray-500">
          This credential has been independently verified and permanently recorded.
        </p>
      </div>

      {/* Certificate (the visual artifact) */}
      <CertificateCard credential={credential} />

      {/* Verification trail (the trust layer) */}
      <VerificationTrail
        issuerName={credential.issuerName}
        issuerAddress={credential.issuerAddress}
        volunteerName={credential.volunteerName}
        ownerAddress={credential.ownerAddress}
        objectId={credential.objectId}
        issuedAt={credential.issuedAt}
      />

      {/* Explainer callout — educates recruiters without overwhelming */}
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
        <span className="text-3xl">🔍</span>
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
        <span className="text-3xl">⚠️</span>
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
        <span className="text-3xl">⚡</span>
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

  const url = typeof window !== 'undefined'
    ? `${window.location.origin}/verify/${objectId}`
    : '';

  const handleCopy = async () => {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex-1 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
    >
      {copied ? '✓ Link Copied' : '🔗 Copy Verification Link'}
    </button>
  );
}

// ── Print button ──────────────────────────────────────────────────────────────
function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex-1 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
    >
      🖨️ Print Certificate
    </button>
  );
}
```

---

## C5. Print Styles

Add these global print styles to `app/globals.css` so the certificate prints cleanly on paper — no headers, footers, or UI chrome. Only the certificate card prints.

```css
/* app/globals.css — append to existing styles */

@media print {
  /* Hide everything except the certificate */
  body * {
    visibility: hidden;
  }

  /* Show only the certificate card */
  #certificate-card,
  #certificate-card * {
    visibility: visible;
  }

  /* Position certificate at top of page */
  #certificate-card {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    margin: 0;
    box-shadow: none;
    border: 1px solid #e5e7eb;
  }

  /* Remove page margins */
  @page {
    margin: 1cm;
  }
}
```

---

## C6. The Complete User Journey

Understanding the end-to-end flow is critical for the demo. Here is every step a user takes, with zero Web3 knowledge required on the recruiter's side.

```
ISSUER (Web3-aware)                    VOLUNTEER               RECRUITER (Web2)
─────────────────────                  ─────────────           ──────────────────────
1. Opens suignature.vercel.app
2. Clicks "Connect Wallet"
3. Approves in Slush wallet
4. Fills out credential form:
   • Volunteer wallet address
   • Volunteer name
   • Event: "Sui Builders Program"
   • Skills: ["Smart Contract Dev"]
   • Issuer: "YGG Pilipinas"
5. Clicks "Issue Credential"
6. Approves in Slush wallet
7. Transaction confirms (~2s)
8. Receives:
   ✓ "Credential issued!"
   ✓ Verify URL: /verify/0x1234...
9. Shares URL with volunteer ──────► Receives URL
                                     Adds to resume/LinkedIn
                                                               ──► Opens URL in browser
                                                               ──► Sees certificate:
                                                                   • Name: Juan dela Cruz
                                                                   • Event: Sui Builders
                                                                   • Skills: badges
                                                                   • Issuer: YGG Pilipinas
                                                                   • Date: April 12, 2026
                                                                   • QR code to re-verify
                                                               ──► Sees verification trail:
                                                                   • Issued BY: YGG Pilipinas
                                                                   • Issued TO: Juan dela Cruz
                                                                   • Timestamp: immutable
                                                               ──► Clicks "View blockchain record"
                                                                   (optional, for the curious)
                                                               ──► Trusted ✓
```

---

## C7. Common Errors & Fixes

| Error                              | Cause                                   | Fix                                                                              |
| ---------------------------------- | --------------------------------------- | -------------------------------------------------------------------------------- |
| `CREDENTIAL_NOT_FOUND` on valid ID | RPC indexing lag after mint             | Wait 5–10 seconds and refresh — Testnet indexing is not instant                  |
| `NOT_A_CREDENTIAL` on valid tx     | Object is a different type (e.g., coin) | Confirm you're passing a Credential object ID, not a tx digest                   |
| QR code renders blank              | `window` not available during SSR       | Confirm `useEffect` wraps `window.location.origin` assignment                    |
| `qrcode.react` import error        | Wrong named export                      | Use `{ QRCodeSVG }` not `QRCode` as the named import                             |
| Certificate looks broken on print  | Print CSS not added                     | Add `@media print` block to `globals.css` as specified                           |
| `fields` is undefined              | `showContent: true` not passed          | Check `getObject` options include `showContent: true`                            |
| `ownerAddress` shows "Unknown"     | Owner is wrapped / shared object        | Credential is `key`-only so owner is always `AddressOwner` — check parsing logic |
| TypeError on `content.fields`      | Type assertion needed                   | Cast `content.fields as Record<string, unknown>`                                 |
| Hydration error on QR              | QR rendered in server pass              | Confirm `CertificateQR` is `'use client'` and uses `useEffect` for URL           |

---

## C8. UI Checklist (Before Moving to Phase D)

```
[x] /verify/[objectId] route renders without errors
[x] Loading spinner shows while fetching
[x] Certificate renders with real on-chain data
[x] Volunteer name is correct
[x] Project/event name is correct
[x] Issuer name is correct
[x] Skills render as colored badges
[x] Date is human-readable (not a Unix timestamp)
[x] QR code renders and is scannable
[x] QR code links back to the same /verify/[objectId] URL
[x] Verification trail shows issuer name + shortened address
[x] Verification trail shows volunteer name + shortened address
[x] Verification trail timestamp is correct
[x] "View blockchain record" link opens suiscan.xyz
[x] "Copy Verification Link" copies correct URL
[x] "Print Certificate" triggers print dialog
[x] Print output shows only the certificate (no nav/footer)
[x] Not-found state renders for invalid object ID
[x] Invalid state renders for non-credential object ID
[x] Page works on mobile (phone screen)
[x] Zero crypto jargon visible in the primary UI
[x] npm run build passes with no TypeScript errors
```

---

## Phase C — Completion Checklist

```
[x] qrcode.react installed
[x] lib/credential.ts written with fetchCredential, formatters
[x] SkillBadge component built
[x] CertificateQR component built (client-side only, useEffect for URL)
[x] VerificationTrail component built with issuer + recipient + timestamp
[x] CertificateCard component built with QR code embedded
[x] app/verify/[objectId]/page.tsx (server shell) created
[x] VerifyPageClient component with all 4 states (loading/success/not_found/error)
[x] Print CSS added to globals.css
[x] All UI checklist items passing
[x] Tested with a real credential Object ID from Phase B
[x] Tested on mobile screen
[x] npm run build passes clean
```

**When all boxes are checked, Phase C is done. Move to Phase D (Deployment).**

---

## Key Values From This Phase

```
Verify Route:          /verify/[objectId]
Test Object ID:        0xd553c291d4a9cd41f8afe531a68a4a7163d00ce556602c92fee925c5f9f2b43c
Suiscan URL pattern:   https://suiscan.xyz/testnet/object/[objectId]
Print target element:  #certificate-card
QR code links to:      https://[your-domain]/verify/[objectId]
```
