# Suignature — Profiles Spec (No-Auth Edition)

### Scope: 30-minute implementation window

> **Premise:** Drop auth entirely. Profiles are public, wallet-address-based pages
> fetched 100% from Sui RPC. No Supabase writes. No login. No session.
> Works for anyone with a Sui address — paste it in, see the page.

---

## What Gets Built

| Route                | Who Sees It                                | Data Source                                                |
| -------------------- | ------------------------------------------ | ---------------------------------------------------------- |
| `/u/[address]`       | Anyone — volunteer shares this link        | `getOwnedObjects` filtered by `Credential` struct type     |
| `/issuer/[address]`  | Anyone — issuer links on their resume/site | `queryTransactionBlocks` by `MoveFunction` + `FromAddress` |
| `/verify/[objectId]` | Existing — two new links added to footer   | Already built, minor edit only                             |

---

## Architecture

```
Browser
  │
  ├── /u/[address]
  │     └── suiClient.getOwnedObjects(address, { StructType: Credential })
  │           └── for each object → render CredentialCard
  │                 └── click → /verify/[objectId]
  │
  ├── /issuer/[address]
  │     └── suiClient.queryTransactionBlocks({ MoveFunction: issue_credential, FromAddress: address })
  │           └── for each tx → tx.effects.created → getObject → render CredentialCard
  │                 └── click → /verify/[objectId]
  │
  └── /verify/[objectId]  (existing)
        └── [NEW] footer links:
              ├── "View [volunteer]'s portfolio →"  →  /u/[ownerAddress]
              └── "View all credentials from [issuer] →"  →  /issuer/[issuerAddress]
```

**Zero database. Zero auth. Both pages work for any Sui address, instantly.**

---

## 1. New Lib: `lib/fetchIssuedCredentials.ts`

This is the only new data-fetching logic needed. `fetchUserCredentials.ts` already exists for the volunteer side.

```typescript
// lib/fetchIssuedCredentials.ts
import { getSuiClient } from "./suiClient"; // or however you import your client
import { PACKAGE_ID } from "./constants";

export interface IssuedCredentialSummary {
  objectId: string;
  volunteerName: string;
  projectOrEvent: string;
  skillsVerified: string[];
  recipientAddress: string;
  timestamp: number;
}

export async function fetchIssuedCredentials(
  issuerAddress: string,
): Promise<IssuedCredentialSummary[]> {
  const client = getSuiClient();

  // Step 1: Find all txs where this address called issue_credential
  const txBlocks = await client.queryTransactionBlocks({
    filter: {
      MoveFunction: {
        package: PACKAGE_ID,
        module: "credential",
        function: "issue_credential",
      },
      FromAddress: issuerAddress,
    },
    options: {
      showEffects: true,
    },
    limit: 50, // adjust as needed
  });

  // Step 2: From each tx's effects, collect the created Credential object IDs
  const objectIds: string[] = [];
  for (const tx of txBlocks.data) {
    const created = tx.effects?.created ?? [];
    for (const obj of created) {
      if (typeof obj.reference?.objectId === "string") {
        objectIds.push(obj.reference.objectId);
      }
    }
  }

  if (objectIds.length === 0) return [];

  // Step 3: Batch fetch the full objects
  const objects = await client.multiGetObjects({
    ids: objectIds,
    options: { showContent: true, showOwner: true },
  });

  // Step 4: Parse each object into a summary
  const credentials: IssuedCredentialSummary[] = [];
  for (const obj of objects) {
    if (obj.data?.content?.dataType !== "moveObject") continue;

    const type = obj.data.content.type as string;
    if (!type.includes("::credential::Credential")) continue;

    const fields = obj.data.content.fields as Record<string, unknown>;

    credentials.push({
      objectId: obj.data.objectId,
      volunteerName: fields.volunteer_name as string,
      projectOrEvent: fields.project_or_event as string,
      skillsVerified: (fields.skills_verified as string[]) ?? [],
      recipientAddress:
        (obj.data.owner as { AddressOwner?: string })?.AddressOwner ?? "",
      timestamp: Number(fields.timestamp),
    });
  }

  return credentials.sort((a, b) => b.timestamp - a.timestamp);
}
```

---

## 2. New Component: `components/CredentialCard.tsx`

Compact card used in both portfolio grids. Clicking it goes to `/verify/[objectId]`.

```typescript
// components/CredentialCard.tsx
'use client';

import Link from 'next/link';
import { formatIssuedDate } from '@/lib/credential'; // already exists

interface CredentialCardProps {
  objectId: string;
  volunteerName?: string;       // shown on issuer profile (who received it)
  projectOrEvent: string;
  skillsVerified: string[];
  issuerName?: string;           // shown on volunteer profile (who issued it)
  timestamp: number;
}

export function CredentialCard({
  objectId,
  volunteerName,
  projectOrEvent,
  skillsVerified,
  issuerName,
  timestamp,
}: CredentialCardProps) {
  const date = formatIssuedDate(new Date(timestamp));

  return (
    <Link
      href={`/verify/${objectId}`}
      className="group block rounded-xl border border-gray-200 bg-white p-5 shadow-sm
                 transition hover:border-indigo-300 hover:shadow-md"
    >
      {/* Top accent */}
      <div className="mb-3 h-1 w-10 rounded-full bg-linear-to-r from-indigo-500 to-violet-500" />

      {/* Event name */}
      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
        {projectOrEvent}
      </p>

      {/* Who received / who issued — depends on context */}
      {volunteerName && (
        <p className="mt-1 text-sm font-medium text-gray-900">{volunteerName}</p>
      )}
      {issuerName && (
        <p className="mt-1 text-xs text-gray-500">Issued by {issuerName}</p>
      )}

      {/* Skills */}
      {skillsVerified.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {skillsVerified.slice(0, 3).map((skill) => (
            <span
              key={skill}
              className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700"
            >
              {skill}
            </span>
          ))}
          {skillsVerified.length > 3 && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
              +{skillsVerified.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Date + arrow */}
      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-gray-400">{date}</p>
        <span className="text-xs text-indigo-500 opacity-0 transition group-hover:opacity-100">
          View →
        </span>
      </div>
    </Link>
  );
}
```

---

## 3. New Page: `/u/[address]/page.tsx` — Volunteer Portfolio

```
app/
  u/
    [address]/
      page.tsx        ← Server Component (generateMetadata + renders client)
      VolunteerPortfolioClient.tsx  ← 'use client', fetches + renders grid
```

### `page.tsx` (Server Component)

```typescript
// app/u/[address]/page.tsx
import { Metadata } from 'next';
import { VolunteerPortfolioClient } from './VolunteerPortfolioClient';

interface Props {
  params: Promise<{ address: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { address } = await params;
  const short = `${address.slice(0, 6)}...${address.slice(-4)}`;
  return {
    title: `${short}'s Credentials — suignature`,
    description: `Verified proof-of-work credentials for ${short} on Sui.`,
  };
}

export default async function VolunteerPortfolioPage({ params }: Props) {
  const { address } = await params;
  return <VolunteerPortfolioClient address={address} />;
}
```

### `VolunteerPortfolioClient.tsx`

```typescript
// app/u/[address]/VolunteerPortfolioClient.tsx
'use client';

import { useEffect, useState } from 'react';
import { fetchUserCredentials } from '@/lib/fetchUserCredentials'; // already exists
import { CredentialCard } from '@/components/CredentialCard';
import { shortenAddress, addressExplorerUrl } from '@/lib/credential'; // already exists

interface Props { address: string; }

export function VolunteerPortfolioClient({ address }: Props) {
  const [credentials, setCredentials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserCredentials(address)
      .then(setCredentials)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [address]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-12">

        {/* Header */}
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
            className="mt-1 text-xs text-gray-400 hover:text-indigo-600"
          >
            View on Sui Explorer ↗
          </a>
        </div>

        {/* Credential grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            Loading credentials…
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
              {credentials.map((cred) => {
                const fields = cred.data?.content?.fields ?? {};
                const objectId = cred.data?.objectId ?? '';
                return (
                  <CredentialCard
                    key={objectId}
                    objectId={objectId}
                    projectOrEvent={fields.project_or_event ?? ''}
                    issuerName={fields.issuer_name ?? ''}
                    skillsVerified={fields.skills_verified ?? []}
                    timestamp={Number(fields.timestamp ?? 0)}
                  />
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

---

## 4. New Page: `/issuer/[address]/page.tsx` — Issuer Profile

```
app/
  issuer/
    [address]/
      page.tsx
      IssuerProfileClient.tsx
```

### `page.tsx` (Server Component)

```typescript
// app/issuer/[address]/page.tsx
import { Metadata } from 'next';
import { IssuerProfileClient } from './IssuerProfileClient';

interface Props {
  params: Promise<{ address: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { address } = await params;
  const short = `${address.slice(0, 6)}...${address.slice(-4)}`;
  return {
    title: `${short} — Credential Issuer on suignature`,
    description: `All credentials issued by ${short} on Sui.`,
  };
}

export default async function IssuerProfilePage({ params }: Props) {
  const { address } = await params;
  return <IssuerProfileClient address={address} />;
}
```

### `IssuerProfileClient.tsx`

```typescript
// app/issuer/[address]/IssuerProfileClient.tsx
'use client';

import { useEffect, useState } from 'react';
import { fetchIssuedCredentials, IssuedCredentialSummary } from '@/lib/fetchIssuedCredentials';
import { CredentialCard } from '@/components/CredentialCard';
import { shortenAddress, addressExplorerUrl } from '@/lib/credential';

interface Props { address: string; }

export function IssuerProfileClient({ address }: Props) {
  const [credentials, setCredentials] = useState<IssuedCredentialSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIssuedCredentials(address)
      .then(setCredentials)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [address]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-12">

        {/* Header */}
        <div className="mb-8">
          <span className="inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
            Credential Issuer
          </span>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">
            {shortenAddress(address)}
          </h1>
          <a
            href={addressExplorerUrl(address)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 text-xs text-gray-400 hover:text-indigo-600"
          >
            View on Sui Explorer ↗
          </a>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            Loading issued credentials…
          </div>
        ) : credentials.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 py-20 text-center text-gray-400">
            No credentials issued by this address yet.
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-gray-500">
              {credentials.length} credential{credentials.length !== 1 ? 's' : ''} issued
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {credentials.map((cred) => (
                <CredentialCard
                  key={cred.objectId}
                  objectId={cred.objectId}
                  volunteerName={cred.volunteerName}
                  projectOrEvent={cred.projectOrEvent}
                  skillsVerified={cred.skillsVerified}
                  timestamp={cred.timestamp}
                />
              ))}
            </div>
          </>
        )}

      </div>
    </div>
  );
}
```

---

## 5. Update: `/verify/[objectId]` Footer

In `components/VerifyPageClient.tsx` (or wherever the success state renders), add two links inside the `SuccessState` — below the `VerificationTrail` component:

```typescript
// Add this block below <VerificationTrail /> inside SuccessState
{credential && (
  <div className="mt-6 flex flex-col gap-2 border-t border-gray-200 pt-6 text-center sm:flex-row sm:justify-center sm:gap-6">
    <a
      href={`/u/${credential.ownerAddress}`}
      className="text-sm text-indigo-600 hover:underline"
    >
      View {credential.volunteerName}'s full portfolio →
    </a>
    <a
      href={`/issuer/${credential.issuerAddress}`}
      className="text-sm text-indigo-600 hover:underline"
    >
      View all credentials from this issuer →
    </a>
  </div>
)}
```

---

## What You Do NOT Need to Build

| Thing                        | Why Skip                                    |
| ---------------------------- | ------------------------------------------- |
| Supabase schema / migrations | No database needed — pure on-chain          |
| Auth guards / middleware     | No login, pages are fully public            |
| Username registration        | Address IS the username — no picker needed  |
| `/dashboard`                 | Volunteer just goes to `/u/[their address]` |
| Org CRUD / payment gate      | Out of scope for this session               |
| Edit profile form            | No editable profile — address-based         |

---

## Implementation Order (30 minutes)

```
1. [x] Create lib/fetchIssuedCredentials.ts           (~5 min)
2. [x] Create components/CredentialCard.tsx            (~5 min)
3. [x] Create app/u/[address]/page.tsx                 (~3 min)
4. [x] Create app/u/[address]/VolunteerPortfolioClient.tsx  (~5 min)
5. [x] Create app/issuer/[address]/page.tsx            (~3 min)
6. [x] Create app/issuer/[address]/IssuerProfileClient.tsx (~5 min)
7. [x] Edit VerifyPageClient.tsx — fix footer links    (~2 min)
8. [x] npm run build — confirm zero TypeScript errors  (~2 min)
```

**Total: ~30 minutes.**

---

## Sharing Profile Links

After implementation, profile links are constructed like this:

| Who         | URL                                        | Where to share                |
| ----------- | ------------------------------------------ | ----------------------------- |
| Volunteer   | `suignature.vercel.app/u/0x392902...`      | LinkedIn, resume, bio         |
| Issuer      | `suignature.vercel.app/issuer/0x392902...` | Org website, event recap post |
| Single cert | `suignature.vercel.app/verify/0xd553c2...` | Already works — no change     |

---

## Key Principle

> The profile pages are **permanent, public, and require nothing** from the user.
> A volunteer's portfolio exists the moment they receive their first credential.
> An issuer's page exists the moment they call `issue_credential`.
> No signup. No configuration. It just works.
