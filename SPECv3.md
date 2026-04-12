# Suignature — Volunteer Dashboard Spec (Wallet-Only)
### Auth: Slush / Sui Wallet via dapp-kit. No Google. No zkLogin.

> **The entire auth story is one sentence:**
> Connect your Slush wallet → we read your address → we show your credentials.
> That's it.

---

## What Gets Cut

| Removed | Why |
|---------|-----|
| `lib/zklogin.ts` | Not needed |
| `lib/useConnectedAddress.ts` | Overkill — just use `useCurrentAccount()` directly |
| `lib/auth-context.tsx` | No session to manage |
| `api/auth/zklogin/*` routes | Not needed |
| `/login` page | Replace with inline connect prompt on `/dashboard` |
| "Sign in with Google" button | Gone |

**You already have everything you need.** `@mysten/dapp-kit` is installed, `WalletProvider` is in `providers.tsx`, and `ConnectButton` works. This feature requires zero new dependencies.

---

## How It Works

```
Volunteer visits /dashboard
        │
        ▼
useCurrentAccount()  ← from @mysten/dapp-kit
        │
   ┌────┴────┐
  null      account.address
   │              │
   ▼              ▼
Show          fetchUserCredentials(address)
ConnectButton         │
                 ┌────┴────┐
              length=0   length>0
                 │              │
                 ▼              ▼
           EmptyState      Credential grid
                           CredentialCard × N
                                 │
                                 ▼
                          /verify/[objectId]
```

---

## `lib/fetchUserCredentials.ts` — Confirm This Is Correct

Make sure the `StructType` filter is present. Without it, the query returns every object
the wallet owns (SUI coins, other NFTs) and the grid will break.

```typescript
// lib/fetchUserCredentials.ts
import { getSuiClient } from './suiClient';
import { PACKAGE_ID } from './constants';

export async function fetchUserCredentials(address: string) {
  const client = getSuiClient();

  const result = await client.getOwnedObjects({
    owner: address,
    filter: {
      StructType: `${PACKAGE_ID}::credential::Credential`,
    },
    options: {
      showContent: true,
      showOwner: true,
    },
  });

  return result.data; // SuiObjectResponse[]
}
```

---

## `app/dashboard/page.tsx` — Full Implementation

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useCurrentAccount, ConnectButton } from '@mysten/dapp-kit';
import { fetchUserCredentials } from '@/lib/fetchUserCredentials';
import { CredentialCard } from '@/components/CredentialCard';
import { shortenAddress } from '@/lib/credential';

interface ParsedCredential {
  objectId: string;
  projectOrEvent: string;
  skillsVerified: string[];
  issuerName: string;
  timestamp: number;
}

type LoadState = 'idle' | 'loading' | 'success' | 'error';

export default function DashboardPage() {
  const account = useCurrentAccount();
  const address = account?.address ?? null;

  const [credentials, setCredentials] = useState<ParsedCredential[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('idle');

  useEffect(() => {
    if (!address) {
      setCredentials([]);
      setLoadState('idle');
      return;
    }

    setLoadState('loading');

    fetchUserCredentials(address)
      .then((raw) => {
        const parsed: ParsedCredential[] = raw
          .filter((obj) => obj.data?.content?.dataType === 'moveObject')
          .map((obj) => {
            const fields = (obj.data!.content as any).fields as Record<string, unknown>;
            return {
              objectId: obj.data!.objectId,
              projectOrEvent: fields.project_or_event as string,
              skillsVerified: (fields.skills_verified as string[]) ?? [],
              issuerName: fields.issuer_name as string,
              timestamp: Number(fields.timestamp ?? 0),
            };
          })
          .sort((a, b) => b.timestamp - a.timestamp);

        setCredentials(parsed);
        setLoadState('success');
      })
      .catch(() => setLoadState('error'));
  }, [address]);

  // ── Not connected ──────────────────────────────────────────────
  if (!address) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-4 text-4xl">🔐</div>
        <h2 className="text-xl font-semibold text-gray-900">
          Connect your wallet to see your credentials
        </h2>
        <p className="mt-2 max-w-sm text-sm text-gray-500">
          Use your Slush or Sui Wallet to view credentials issued to your address.
        </p>
        <div className="mt-6">
          <ConnectButton />
        </div>
      </div>
    );
  }

  // ── Loading ────────────────────────────────────────────────────
  if (loadState === 'loading') {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        <svg className="mr-3 h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10"
            stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        Loading your credentials…
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────
  if (loadState === 'error') {
    return (
      <div className="py-24 text-center">
        <p className="font-medium text-red-500">Failed to load credentials</p>
        <p className="mt-1 text-sm text-gray-500">
          Check your connection and try refreshing.
        </p>
      </div>
    );
  }

  // ── Empty ──────────────────────────────────────────────────────
  if (credentials.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl
                      border border-dashed border-gray-300 py-24 text-center">
        <p className="text-lg font-medium text-gray-700">No credentials yet</p>
        <p className="mt-2 max-w-sm text-sm text-gray-500">
          Credentials issued to your wallet will appear here.
          Share your address with an event organizer to receive one.
        </p>
        <button
          onClick={() => navigator.clipboard.writeText(address)}
          className="mt-4 rounded-lg bg-indigo-50 px-4 py-2 text-sm
                     font-medium text-indigo-700 hover:bg-indigo-100"
        >
          Copy my address
        </button>
      </div>
    );
  }

  // ── Credentials grid ───────────────────────────────────────────
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Credentials</h1>
          <p className="mt-1 text-sm text-gray-500">
            {shortenAddress(address)} ·{' '}
            {credentials.length} credential{credentials.length !== 1 ? 's' : ''}
          </p>
        </div>
        <a
          href={`/u/${address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm
                     font-medium text-gray-600 hover:border-indigo-300 hover:text-indigo-600"
        >
          View public portfolio ↗
        </a>
      </div>

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
    </div>
  );
}
```

---

## Nav: "My Credentials" Link

In your site header, show a dashboard link when a wallet is connected:

```typescript
// In your Header component
'use client';
import { useCurrentAccount, ConnectButton } from '@mysten/dapp-kit';
import Link from 'next/link';

export function Header() {
  const account = useCurrentAccount();

  return (
    <header className="...">
      <div className="flex items-center gap-4">
        {account && (
          <Link href="/dashboard" className="text-sm font-medium text-indigo-600">
            My Credentials
          </Link>
        )}
        <ConnectButton />
      </div>
    </header>
  );
}
```

When connected: the wallet button (already shows address + disconnect) sits next to "My Credentials". When disconnected: just the wallet button. No redundancy.

---

## Files to Touch

| Action | File | Change |
|--------|------|--------|
| **CONFIRM** | `lib/fetchUserCredentials.ts` | `StructType` filter is present |
| **EDIT** | `app/dashboard/page.tsx` | Replace shell with full implementation above |
| **EDIT** | `components/Header.tsx` | Add "My Credentials" link when `account !== null` |
| **DEPENDS ON** | `components/CredentialCard.tsx` | Build this first if not done yet |

---

## Testing Checklist

- [ ] Visit `/dashboard` with no wallet connected → `ConnectButton` shown, nothing else
- [ ] Connect Slush wallet → credentials load automatically, no page refresh
- [ ] Disconnect wallet → page drops back to connect prompt instantly
- [ ] Address with no credentials → empty state + "Copy my address" button
- [ ] "Copy my address" copies to clipboard
- [ ] "View public portfolio ↗" opens `/u/[address]` in new tab
- [ ] Each `CredentialCard` click navigates to `/verify/[objectId]`
- [ ] "My Credentials" appears in nav only when wallet is connected
- [ ] `npm run build` — zero TypeScript errors