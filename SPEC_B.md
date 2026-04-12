# Phase B — Issuer Frontend Specification

### suignature | Next.js + React + @mysten/dapp-kit

---

## Overview

Phase B builds the issuer-facing web application. This is the interface a community organizer, school administrator, or guild leader uses to mint a credential directly into a volunteer's wallet. It is a single page with a wallet connect button and a form — deliberately minimal, deliberately professional.

**Goal:** A live, deployed Next.js app where a connected wallet can fill out a form and execute the `issue_credential` Move function on Sui Testnet, receiving back a shareable `/verify/[objectId]` URL on success.

**Prerequisite:** Phase A must be complete. You need your `NEXT_PUBLIC_PACKAGE_ID` before a single line of Phase B code is useful.

**Estimated time:** 90–120 minutes

---

## Directory Structure

After Phase B is complete:

```
suignature/
├── sources/                       ← (Phase A, Move sources)
├── tests/                         ← (Phase A, Move tests)
├── Move.toml                      # (Phase A, Move manifest)
└── frontend/                      # (Phase B — Next.js app)
    ├── app/
    │   ├── layout.tsx             ← Root layout with providers
    │   ├── page.tsx               ← Issuer dashboard (Phase B)
    │   └── verify/
    │       └── [objectId]/
    │           └── page.tsx       ← Recruiter view (Phase C)
    ├── components/
    │   ├── CredentialForm.tsx     ← The main form component
    │   ├── SkillSelector.tsx      ← Multi-select skill tag component
    │   ├── SuccessCard.tsx        ← Post-submission success UI
    │   └── WalletStatus.tsx       ← Wallet connection display
    ├── lib/
    │   ├── constants.ts           ← Package ID, skill tags, network config
    │   └── sui.ts                 ← SuiClient singleton
    ├── .env.local
    ├── .env.example
    ├── next.config.js
    ├── tailwind.config.ts
    └── package.json
```

---

## B1. Project Setup

### Scaffold the Next.js App

```bash
# From the suignature root
cd suignature
npx create-next-app@latest frontend
```

When prompted, select:

```
✔ Would you like to use TypeScript?          → Yes
✔ Would you like to use ESLint?              → Yes
✔ Would you like to use Tailwind CSS?        → Yes
✔ Would you like to use the `src/` dir?     → No
✔ Would you like to use App Router?          → Yes
✔ Would you like to customize import alias? → No
```

### Install Dependencies

```bash
cd frontend
npm install @mysten/dapp-kit @mysten/sui @tanstack/react-query
```

| Package                 | Version | Purpose                                                 |
| ----------------------- | ------- | ------------------------------------------------------- |
| `@mysten/dapp-kit`      | latest  | Wallet connection, transaction hooks, React context     |
| `@mysten/sui`           | latest  | Sui library (v2 API) for data fetching and transactions |
| `@tanstack/react-query` | latest  | Required peer dependency of dapp-kit                    |

### Environment Variables

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_PACKAGE_ID=0x<your_package_id_from_phase_a>
NEXT_PUBLIC_MODULE_NAME=credential
NEXT_PUBLIC_FUNCTION_NAME=issue_credential
NEXT_PUBLIC_SUI_NETWORK=testnet
```

Create `frontend/.env.example` (safe to commit):

```env
NEXT_PUBLIC_PACKAGE_ID=
NEXT_PUBLIC_MODULE_NAME=credential
NEXT_PUBLIC_FUNCTION_NAME=issue_credential
NEXT_PUBLIC_SUI_NETWORK=testnet
```

Confirm `.env.local` is in `.gitignore`:

```bash
echo ".env.local" >> .gitignore
```

---

## B2. Constants & Sui Client

### `lib/constants.ts`

This file is the single source of truth for all configuration values. Never hardcode package IDs or skill lists elsewhere.

```typescript
// lib/constants.ts

export const SUI_CONFIG = {
  packageId: process.env.NEXT_PUBLIC_PACKAGE_ID as string,
  moduleName: process.env.NEXT_PUBLIC_MODULE_NAME as string,
  functionName: process.env.NEXT_PUBLIC_FUNCTION_NAME as string,
  network: (process.env.NEXT_PUBLIC_SUI_NETWORK as string) || "testnet",
} as const;

export const SKILL_TAGS = [
  "Event Logistics",
  "Technical Mentoring",
  "Community Management",
  "Frontend Development",
  "Smart Contract Development",
  "Backend Development",
  "B2B Negotiation",
  "Content Creation",
  "Project Management",
  "Public Speaking",
  "UI/UX Design",
  "Social Media Marketing",
  "Workshop Facilitation",
  "Graphic Design",
  "Data Analysis",
] as const;

export type SkillTag = (typeof SKILL_TAGS)[number];

// Validation
export const SUI_ADDRESS_REGEX = /^0x[a-fA-F0-9]{64}$/;
```

### `lib/sui.ts`

A singleton `SuiClient` used for reading on-chain data in Phase C. Define it here so Phase B and C share the same instance.

```typescript
// lib/sui.ts

import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import { SUI_CONFIG } from "./constants";

export const suiClient = new SuiJsonRpcClient({
  url: getJsonRpcFullnodeUrl(SUI_CONFIG.network),
  network: SUI_CONFIG.network,
});
```

---

## B3. Providers — Root Layout

The root layout must wrap the entire app with three providers in the correct order. Without these, no Sui hooks will work.

### `app/layout.tsx` — Full Implementation

```typescript
// app/layout.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SuiClientProvider, WalletProvider, createNetworkConfig } from '@mysten/dapp-kit';
import { getJsonRpcFullnodeUrl } from '@mysten/sui/jsonRpc';
import '@mysten/dapp-kit/dist/index.css';
import './globals.css';
import { useState } from 'react';

const { networkConfig } = createNetworkConfig({
  testnet: { url: getJsonRpcFullnodeUrl('testnet'), network: 'testnet' },
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <html lang="en">
      <body>
        <QueryClientProvider client={queryClient}>
          <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
            <WalletProvider autoConnect>
              {children}
            </WalletProvider>
          </SuiClientProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
```

#### Provider Order Explained

```
QueryClientProvider        ← Must be outermost — dapp-kit uses react-query internally
  └── SuiClientProvider   ← Provides the network connection to all child hooks
        └── WalletProvider ← Manages wallet state, auto-reconnects on page load
              └── {children}
```

> **`autoConnect`** on `WalletProvider` means if the user connected their wallet in a previous session, it reconnects automatically on page load. Critical for demo flow — you don't want to reconnect manually in front of judges.

---

## B4. Component Specifications

### Component 1: `components/WalletStatus.tsx`

Displays connection state in the header. Shows `ConnectButton` when disconnected, shows truncated address when connected.

```typescript
// components/WalletStatus.tsx
'use client';

import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';

export function WalletStatus() {
  const account = useCurrentAccount();

  return (
    <div className="flex items-center gap-3">
      {account ? (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-sm text-gray-300 font-mono">
            {account.address.slice(0, 6)}...{account.address.slice(-4)}
          </span>
          <ConnectButton />
        </div>
      ) : (
        <ConnectButton />
      )}
    </div>
  );
}
```

---

### Component 2: `components/SkillSelector.tsx`

A multi-select tag picker. Renders all skill tags as toggleable buttons. Selected tags are visually highlighted and stored in parent state.

```typescript
// components/SkillSelector.tsx
'use client';

import { SKILL_TAGS, SkillTag } from '@/lib/constants';

interface SkillSelectorProps {
  selected: SkillTag[];
  onChange: (skills: SkillTag[]) => void;
  error?: string;
}

export function SkillSelector({ selected, onChange, error }: SkillSelectorProps) {
  const toggleSkill = (skill: SkillTag) => {
    if (selected.includes(skill)) {
      onChange(selected.filter((s) => s !== skill));
    } else {
      onChange([...selected, skill]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">
        Skills Verified
        <span className="text-red-400 ml-1">*</span>
      </label>
      <div className="flex flex-wrap gap-2">
        {SKILL_TAGS.map((skill) => {
          const isSelected = selected.includes(skill);
          return (
            <button
              key={skill}
              type="button"
              onClick={() => toggleSkill(skill)}
              className={`
                px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150
                ${isSelected
                  ? 'bg-indigo-600 text-white border border-indigo-500'
                  : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-500'
                }
              `}
            >
              {isSelected && <span className="mr-1">✓</span>}
              {skill}
            </button>
          );
        })}
      </div>
      {selected.length > 0 && (
        <p className="text-xs text-gray-500">{selected.length} skill(s) selected</p>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
```

---

### Component 3: `components/SuccessCard.tsx`

Shown after a credential is successfully minted. Displays the Object ID and the shareable verify URL with a copy button.

```typescript
// components/SuccessCard.tsx
'use client';

import { useState } from 'react';

interface SuccessCardProps {
  objectId: string;
  volunteerName: string;
  onIssueAnother: () => void;
}

export function SuccessCard({ objectId, volunteerName, onIssueAnother }: SuccessCardProps) {
  const [copied, setCopied] = useState(false);

  const verifyUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/verify/${objectId}`
    : `/verify/${objectId}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(verifyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
            className="text-xs px-3 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shrink-0"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <p className="text-xs text-gray-500">
          Share this link with the volunteer. They can add it to their resume or LinkedIn.
        </p>
      </div>

      {/* Object ID (small, for technical reference) */}
      <div className="space-y-1">
        <p className="text-xs text-gray-500">
          Object ID:{' '}
          <a
            href={`https://suiexplorer.com/object/${objectId}?network=testnet`}
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
        className="w-full py-2 rounded-lg border border-gray-600 text-gray-400 hover:text-white hover:border-gray-400 text-sm transition-colors"
      >
        Issue Another Credential
      </button>
    </div>
  );
}
```

---

### Component 4: `components/CredentialForm.tsx`

The core form component. Manages all form state, validation, and transaction execution.

#### Form State Shape

```typescript
interface FormState {
  recipientAddress: string; // Volunteer's wallet address
  volunteerName: string; // Volunteer's full name
  projectOrEvent: string; // Project or event name
  issuerName: string; // Organization name (issuer)
  skillsVerified: SkillTag[]; // Selected skill tags
}

interface FormErrors {
  recipientAddress?: string;
  volunteerName?: string;
  projectOrEvent?: string;
  issuerName?: string;
  skillsVerified?: string;
}
```

#### Validation Rules

| Field              | Rule                                                     |
| ------------------ | -------------------------------------------------------- |
| `recipientAddress` | Must match `SUI_ADDRESS_REGEX` (`/^0x[a-fA-F0-9]{64}$/`) |
| `volunteerName`    | Must not be empty, min 2 characters                      |
| `projectOrEvent`   | Must not be empty, min 3 characters                      |
| `issuerName`       | Must not be empty, min 2 characters                      |
| `skillsVerified`   | Must have at least 1 skill selected                      |

#### Full Implementation

```typescript
// components/CredentialForm.tsx
'use client';

import { useState, useCallback } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { SUI_CONFIG, SUI_ADDRESS_REGEX, SkillTag } from '@/lib/constants';
import { SkillSelector } from './SkillSelector';
import { SuccessCard } from './SuccessCard';

interface FormState {
  recipientAddress: string;
  volunteerName: string;
  projectOrEvent: string;
  issuerName: string;
  skillsVerified: SkillTag[];
}

interface FormErrors {
  recipientAddress?: string;
  volunteerName?: string;
  projectOrEvent?: string;
  issuerName?: string;
  skillsVerified?: string;
}

const INITIAL_FORM: FormState = {
  recipientAddress: '',
  volunteerName: '',
  projectOrEvent: '',
  issuerName: '',
  skillsVerified: [],
};

export function CredentialForm() {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction();

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [txError, setTxError] = useState<string | null>(null);
  const [successObjectId, setSuccessObjectId] = useState<string | null>(null);

  // ── Field update handler ──────────────────────────────────────────────────
  const updateField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!SUI_ADDRESS_REGEX.test(form.recipientAddress)) {
      newErrors.recipientAddress = 'Must be a valid Sui address (0x followed by 64 hex characters)';
    }
    if (form.volunteerName.trim().length < 2) {
      newErrors.volunteerName = 'Name must be at least 2 characters';
    }
    if (form.projectOrEvent.trim().length < 3) {
      newErrors.projectOrEvent = 'Project/event name must be at least 3 characters';
    }
    if (form.issuerName.trim().length < 2) {
      newErrors.issuerName = 'Issuer name must be at least 2 characters';
    }
    if (form.skillsVerified.length === 0) {
      newErrors.skillsVerified = 'Select at least one skill';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Transaction builder ───────────────────────────────────────────────────
  const buildTransaction = (): Transaction => {
    const tx = new Transaction();

    tx.moveCall({
      target: `${SUI_CONFIG.packageId}::${SUI_CONFIG.moduleName}::${SUI_CONFIG.functionName}`,
      arguments: [
        tx.pure.string(form.volunteerName.trim()),
        tx.pure.string(form.projectOrEvent.trim()),
        tx.pure('vector<string>', form.skillsVerified.map(s => s)),
        tx.pure.string(form.issuerName.trim()),
        tx.pure.address(form.recipientAddress),
      ],
    });

    return tx;
  };

  // ── Submit handler ────────────────────────────────────────────────────────
  const handleSubmit = useCallback(() => {
    if (!account) return;
    if (!validate()) return;

    setTxError(null);
    const tx = buildTransaction();

    signAndExecute(
      { transaction: tx },
      {
        onSuccess: async (result) => {
          // Wait for transaction to be indexed
          const txResponse = await suiClient.waitForTransaction({
            digest: result.digest,
            options: { showObjectChanges: true },
          });

          // Extract the created object ID from the transaction result
          const createdObject = txResponse.objectChanges?.find(
            (change) => change.type === 'created'
          );

          if (createdObject && 'objectId' in createdObject) {
            setSuccessObjectId(createdObject.objectId);
          }
        },
        onError: (error) => {
          console.error('Transaction failed:', error);
          setTxError(
            error.message.includes('rejected')
              ? 'Transaction was rejected in wallet.'
              : `Transaction failed: ${error.message}`
          );
        },
      }
    );
  }, [account, form, signAndExecute, suiClient]);

  // ── Reset handler ─────────────────────────────────────────────────────────
  const handleReset = () => {
    setForm(INITIAL_FORM);
    setErrors({});
    setTxError(null);
    setSuccessObjectId(null);
  };

  // ── Render: Success state ─────────────────────────────────────────────────
  if (successObjectId) {
    return (
      <SuccessCard
        objectId={successObjectId}
        volunteerName={form.volunteerName}
        onIssueAnother={handleReset}
      />
    );
  }

  // ── Render: Form ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Recipient Address */}
      <FormField
        label="Volunteer Wallet Address"
        required
        error={errors.recipientAddress}
      >
        <input
          type="text"
          placeholder="0x..."
          value={form.recipientAddress}
          onChange={(e) => updateField('recipientAddress', e.target.value)}
          className={inputClass(!!errors.recipientAddress)}
        />
      </FormField>

      {/* Volunteer Name */}
      <FormField label="Volunteer Full Name" required error={errors.volunteerName}>
        <input
          type="text"
          placeholder="e.g. Juan dela Cruz"
          value={form.volunteerName}
          onChange={(e) => updateField('volunteerName', e.target.value)}
          className={inputClass(!!errors.volunteerName)}
        />
      </FormField>

      {/* Project or Event */}
      <FormField label="Project or Event" required error={errors.projectOrEvent}>
        <input
          type="text"
          placeholder="e.g. Sui Builders Program Davao 2026"
          value={form.projectOrEvent}
          onChange={(e) => updateField('projectOrEvent', e.target.value)}
          className={inputClass(!!errors.projectOrEvent)}
        />
      </FormField>

      {/* Issuer Name */}
      <FormField label="Issuer / Organization Name" required error={errors.issuerName}>
        <input
          type="text"
          placeholder="e.g. YGG Pilipinas / Metaversity"
          value={form.issuerName}
          onChange={(e) => updateField('issuerName', e.target.value)}
          className={inputClass(!!errors.issuerName)}
        />
      </FormField>

      {/* Skills Selector */}
      <SkillSelector
        selected={form.skillsVerified}
        onChange={(skills) => {
          setForm((prev) => ({ ...prev, skillsVerified: skills }));
          if (errors.skillsVerified) {
            setErrors((prev) => ({ ...prev, skillsVerified: undefined }));
          }
        }}
        error={errors.skillsVerified}
      />

      {/* Transaction Error */}
      {txError && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3">
          <p className="text-sm text-red-400">{txError}</p>
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={isPending || !account}
        className={`
          w-full py-3 rounded-xl font-semibold text-sm transition-all duration-150
          ${isPending || !account
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
            : 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer'
          }
        `}
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Waiting for wallet confirmation...
          </span>
        ) : (
          'Issue Credential'
        )}
      </button>

      <p className="text-xs text-center text-gray-600">
        The credential will be minted on Sui Testnet and sent to the volunteer&apos;s wallet.
        Gas fees are negligible (&lt;0.001 SUI).
      </p>
    </div>
  );
}

// ── Helper: FormField wrapper ─────────────────────────────────────────────────
function FormField({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-300">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

// ── Helper: input className ───────────────────────────────────────────────────
function inputClass(hasError: boolean): string {
  return `
    w-full px-4 py-2.5 rounded-lg text-sm text-white placeholder-gray-500
    bg-gray-900 border transition-colors duration-150 outline-none
    focus:ring-2 focus:ring-indigo-500 focus:border-transparent
    ${hasError
      ? 'border-red-500/60 bg-red-500/5'
      : 'border-gray-700 hover:border-gray-600'
    }
  `;
}
```

---

## B5. Main Page — `app/page.tsx`

The issuer dashboard. Composes all components. Gates the form behind wallet connection.

```typescript
// app/page.tsx
'use client';

import { useCurrentAccount } from '@mysten/dapp-kit';
import { WalletStatus } from '@/components/WalletStatus';
import { CredentialForm } from '@/components/CredentialForm';

export default function IssuerPage() {
  const account = useCurrentAccount();

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">suignature</h1>
            <p className="text-xs text-gray-500">Verifiable Proof of Work · Sui Testnet</p>
          </div>
          <WalletStatus />
        </div>
      </header>

      {/* Main */}
      <main className="max-w-2xl mx-auto px-4 py-10">
        {!account ? (
          // ── Not connected ──────────────────────────────────────────────────
          <div className="text-center space-y-4 py-20">
            <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto">
              <span className="text-3xl">🔐</span>
            </div>
            <h2 className="text-xl font-semibold text-white">Connect your wallet to issue credentials</h2>
            <p className="text-gray-400 text-sm max-w-md mx-auto">
              Connect your Sui wallet to start issuing verifiable proof of work credentials
              to students and community volunteers.
            </p>
          </div>
        ) : (
          // ── Connected ──────────────────────────────────────────────────────
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-white">Issue a Credential</h2>
              <p className="text-gray-400 text-sm mt-1">
                Fill in the details below. The credential will be minted as a
                non-transferable token directly to the volunteer&apos;s wallet.
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
```

---

## B6. Transaction Deep Dive

Understanding this section will help you debug and also answer judge questions confidently.

### How `Transaction` Works

```typescript
const tx = new Transaction();

tx.moveCall({
  target: `${packageId}::${moduleName}::${functionName}`,
  // target format: "0xPACKAGE_ID::module_name::function_name"

  arguments: [
    tx.pure.string(volunteerName), // Maps to: volunteer_name: String
    tx.pure.string(projectOrEvent), // Maps to: project_or_event: String
    tx.pure("vector<string>", skillsVerified), // Maps to: skills_verified: vector<String>
    tx.pure.string(issuerName), // Maps to: issuer_name: String
    tx.pure.address(recipientAddress), // Maps to: recipient: address
    // ctx is NOT passed — Sui runtime injects it automatically
  ],
});
```

**Important:** `tx.pure()` with typed helpers serializes JavaScript values into BCS (Binary Canonical Serialization) format that the Move VM understands. You never manually BCS-encode anything — the SDK handles it.

### How to Extract the Object ID from the Result

The `signAndExecuteTransaction` result returns a digest. You should use `waitForTransaction` on the `suiClient` with `showObjectChanges: true` to get the executed changes. You want the object with `type: 'created'`:

```typescript
const txResponse = await suiClient.waitForTransaction({
  digest: result.digest,
  options: { showObjectChanges: true },
});

const createdObject = txResponse.objectChanges?.find(
  (change) => change.type === "created",
);

if (createdObject && "objectId" in createdObject) {
  const objectId = createdObject.objectId;
  // Use this as the verify URL: /verify/${objectId}
}
```

This is the same Object ID that appears in Phase C's URL. It uniquely identifies the credential on-chain forever.

---

## B7. Common Errors & Fixes

| Error                                                       | Cause                                                     | Fix                                                                 |
| ----------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------- |
| `Cannot read properties of undefined (reading 'packageId')` | `.env.local` not created or `NEXT_PUBLIC_` prefix missing | Check `.env.local` exists and all vars have `NEXT_PUBLIC_` prefix   |
| `WalletProvider is not wrapping this component`             | Hooks used outside provider tree                          | Confirm `layout.tsx` has all three providers in correct order       |
| `Error: Move call failed`                                   | Wrong package ID or function signature mismatch           | Double-check `NEXT_PUBLIC_PACKAGE_ID` matches published contract    |
| `Invalid address format`                                    | Volunteer wallet address doesn't match SUI_ADDRESS_REGEX  | Ensure address is 66 chars: `0x` + 64 hex chars                     |
| `Transaction rejected`                                      | User clicked reject in wallet                             | Show a friendly error — this is normal user behavior                |
| `TypeError: Cannot read 'objectChanges'`                    | `showObjectChanges: true` not passed to execute options   | Add `options: { showObjectChanges: true }` to `signAndExecute` call |
| `hydration mismatch`                                        | Server/client render mismatch on wallet state             | Add `'use client'` to any component using dapp-kit hooks            |
| Wallet modal doesn't open                                   | dapp-kit CSS not imported                                 | Add `import '@mysten/dapp-kit/dist/index.css'` to `layout.tsx`      |
| `Module not found: @mysten/...`                             | Dependencies not installed                                | Run `npm install` from the `frontend/` directory                    |

---

## B8. UI Checklist (Before Moving to Phase C)

Run through this before declaring Phase B done:

```
[x] ConnectButton appears in header on page load
[x] Disconnected state shows the "Connect your wallet" screen
[x] Connected state shows the form
[x] All 5 form fields render correctly
[x] Skill tags render and toggle on/off correctly
[x] Validation fires on submit with empty fields
[x] Invalid Sui address shows correct error message
[x] Submit button is disabled while transaction is pending
[x] Spinner shows during pending transaction
[x] Wallet popup opens when Submit is clicked (connected)
[x] Successful transaction shows SuccessCard
[x] Verify URL is correct and copyable
[x] Copy button works and shows "Copied!" feedback
[x] "Issue Another Credential" resets the form
[x] Transaction error (rejected) shows readable message
[x] Page is usable on a laptop screen at 1280px width
```

---

## Phase B — Completion Checklist

```
[x] Next.js app scaffolded with correct options
[x] All dependencies installed
[x] .env.local created with correct Package ID
[x] .env.example created and committed
[x] lib/constants.ts created with SUI_CONFIG and SKILL_TAGS
[x] lib/sui.ts created with SuiClient singleton
[x] layout.tsx has all three providers in correct order
[x] dapp-kit CSS imported in layout.tsx
[x] WalletStatus component built and working
[x] SkillSelector component built and working
[x] SuccessCard component built and working
[x] CredentialForm component built with validation
[x] Transaction executes and confirms on Sui Testnet
[x] Object ID extracted from transaction result
[x] Success state shows shareable verify URL
[x] All UI checklist items passing
[x] npm run build passes with no TypeScript errors
```

**When all boxes are checked, Phase B is done. Move to Phase C.**

---

## Key Values From This Phase

```
Live Dev URL:        http://localhost:3000
Issuer Page Route:   /
Verify Page Route:   /verify/[objectId]      ← built in Phase C
Package ID:          (from Phase A .env.local)
Test Credential ID:  0x________________________________  (save after first test tx)
```
