# Suignature — Phase 2 Specification

### "Credly, but on Sui"

> **Vision:** A platform where community organizations mint verified credentials and volunteers build a public, portable proof-of-work portfolio — all on Sui.

---

## Table of Contents

1. [What Changed and Why](#1-what-changed-and-why)
2. [Architecture Overview](#2-architecture-overview)
3. [User Roles & Flows](#3-user-roles--flows)
4. [Authentication Strategy (zkLogin)](#4-authentication-strategy-zklogin)
5. [Payment Model](#5-payment-model)
6. [On-Chain: Move Contract Changes](#6-on-chain-move-contract-changes)
7. [Off-Chain: Database Schema](#7-off-chain-database-schema)
8. [Sponsored Transactions](#8-sponsored-transactions)
9. [Frontend: Page Map & Component Plan](#9-frontend-page-map--component-plan)
10. [API Routes](#10-api-routes)
11. [Tech Stack Delta](#11-tech-stack-delta)
12. [Implementation Phases](#12-implementation-phases)

---

## 1. What Changed and Why

### Phase 1 Model (Hackathon MVP)

- **Who pays gas?** The issuer (host) paid gas directly from their own Sui wallet.
- **Auth:** Issuers needed a Sui wallet (high friction for non-crypto users).
- **No profiles:** No persistent identity for volunteers or organizations.
- **No discovery:** Credentials only existed at a direct `/verify/[objectId]` link.

### Phase 2 Model (Product)

- **Who pays gas?** The **platform** sponsors all transactions. Hosts pay a flat platform subscription fee. Volunteers transact for free.
- **Auth:** Google/Apple sign-in via **zkLogin** — creates a Sui address silently in the background. No wallets, no seed phrases.
- **Profiles:** Both volunteers and hosts have persistent profile pages.
- **Discovery:** Volunteers build a public portfolio at `/u/[username]`. Organizations have a page at `/org/[slug]`.

### The Core Shift

The platform transitions from a **tool** (you bring your wallet, you pay) into a **product** (you sign in with Google, we handle everything). This is exactly what separated Credly from raw blockchain explorers.

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                             │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────────────┐    │
│  │ zkLogin  │  │ Next.js App  │  │   Public Verify Page   │    │
│  │ (Google) │  │ (Auth'd UX)  │  │   (No auth needed)     │    │
│  └────┬─────┘  └──────┬───────┘  └──────────┬─────────────┘    │
└───────┼───────────────┼──────────────────────┼─────────────────┘
        │               │                      │
        ▼               ▼                      ▼
┌───────────────┐  ┌─────────────────────────────────────────────┐
│  Sui Network  │  │              Next.js API Routes              │
│  (Testnet →   │  │  /api/auth  /api/orgs  /api/events          │
│   Mainnet)    │  │  /api/credentials  /api/sponsor-tx           │
│               │  └────────────────────┬────────────────────────┘
│  Sponsored    │                       │
│  Transactions │◄──────────────────────┤
│  via Shinami  │                       │
└───────────────┘              ┌────────▼──────────┐
                               │     Supabase      │
                               │  (Postgres + Auth)│
                               │                   │
                               │  users            │
                               │  organizations    │
                               │  events           │
                               │  credentials_meta │
                               └───────────────────┘
```

**Rule:** The Sui blockchain is the **source of truth** for credential authenticity. Supabase is the **source of convenience** for search, profiles, and metadata. Nothing in Supabase overrides what's on-chain.

---

## 3. User Roles & Flows

### 3.1 Volunteer (Recipient)

```
Sign In with Google
        │
        ▼
Dashboard (/dashboard)
  └── "Your Credentials" tab
        └── List of all credentials owned by their zkLogin address
              └── Click credential → View Certificate (/verify/[objectId])
                    └── Share Link / Download PDF / Print
        │
        └── "Your Profile" tab
              └── Edit display name, bio, social links
              └── Toggle credential visibility (public/private)
              └── Preview public portfolio → /u/[username]
```

**Key pages:**

- `/dashboard` — Private credential inbox
- `/u/[username]` — Public portfolio (Credly-style)
- `/verify/[objectId]` — Single certificate view (existing, no changes)

---

### 3.2 Host / Issuer (Organization)

```
Sign In with Google
        │
        ▼
Onboarding: Is this for an Organization?
        │
        └── Yes → Create Organization Profile
                        │
                        ▼
                  Payment Gate (/org/upgrade)
                  "Unlock Credential Issuance — $X/mo or Y SUI"
                        │
                  [Pay] ─────────────────────────────────────────
                                                                  │
                        ▼                                         ▼
                  Host Dashboard (/org/[slug]/dashboard)     Payment fails
                  ├── "Your Events" tab                           │
                  │     └── Create New Event → /org/events/new   └── Show error
                  │     └── List of past events
                  │           └── Click event → /org/events/[id]
                  │                 └── "Issue Certificates" button
                  │                       └── Bulk or individual issuance form
                  │                             └── Platform submits sponsored tx
                  │                                   └── Credential minted to volunteer
                  │
                  └── "Issued Credentials" tab
                        └── List of all credentials issued by this org
                              └── Click → View Certificate
```

**Key pages:**

- `/org/new` — Org creation form
- `/org/upgrade` — Payment / subscription page
- `/org/[slug]/dashboard` — Org control panel
- `/org/[slug]/events/new` — Create event
- `/org/[slug]/events/[id]` — Event detail + issue certificates
- `/org/[slug]` — Public organization page (like a Credly issuer page)

---

### 3.3 General / Public (No Account)

```
Scan QR Code or Open Link
        │
        ▼
/verify/[objectId]
  └── Full certificate view (existing Phase 1 page — no changes needed)
  └── "See all credentials from [Org]" → /org/[slug]
  └── "See [Volunteer]'s portfolio" → /u/[username]  (if volunteer made profile public)
```

No changes to the verification page itself. The public just gets two new discovery links added to the footer.

---

## 4. Authentication Strategy (zkLogin)

zkLogin allows users to sign in with **Google, Apple, or Twitch** and silently receive a deterministic Sui address — no seed phrase, no wallet extension.

### How It Works (Simplified)

1. User clicks "Sign in with Google"
2. Google returns an OpenID Connect JWT
3. The JWT is processed through Sui's zkLogin circuit
4. A **unique Sui address** is derived from the JWT (deterministic per Google account)
5. The platform stores `{ supabase_user_id ↔ sui_address }` mapping

From the user's perspective: they just signed in with Google. From the blockchain's perspective: they have a real Sui address that can own objects.

### Implementation Libraries

```bash
npm install @mysten/zklogin @mysten/sui
```

### Key Integration Points

```typescript
// lib/zklogin.ts

// 1. Generate login URL
const { nonce, randomness } = generateNonce(maxEpoch);
const loginUrl = buildZkLoginUrl({ provider: "google", nonce });

// 2. After redirect, derive address
const zkLoginAddress = jwtToAddress(jwt, userSalt);

// 3. Prove + sign transactions (backend)
const zkProof = await fetchZkProof(jwt, randomness, maxEpoch, userSalt);
const signature = getZkLoginSignature({
  inputs: zkProof,
  maxEpoch,
  userSignature,
});
```

### Session Storage

```
Supabase Auth (email/OAuth) handles the session.
The derived Sui address is stored in the `users` table.
The ephemeral keypair + ZK proof is stored in sessionStorage (client-side only, never persisted to DB).
```

### User Salt Management

Each user needs a consistent `userSalt` to always derive the same Sui address. Options:

- **Simple:** Generate once on first login, store in Supabase `users.salt` column (platform-managed — easiest)
- **Self-sovereign:** User holds their own salt (more decentralized — harder UX)

**Recommendation for Phase 2:** Platform-managed salt. Store in `users.salt`. This is what Mysten Labs' own demos do.

---

## 5. Payment Model

### Philosophy

Hosts (organizations) pay to **unlock issuance capability**. Volunteers always use the platform for free. The platform uses subscription revenue to cover all gas fees across the network.

### Pricing Options (Pick One for Launch)

| Option                    | Model                           | Implementation                         |
| ------------------------- | ------------------------------- | -------------------------------------- |
| **A — Flat Subscription** | $29/mo per org                  | Stripe → webhook → unlock DB flag      |
| **B — Per-Event Fee**     | $5 per event created            | Stripe → webhook → event credit ledger |
| **C — SUI Token Payment** | Y SUI per event                 | On-chain Move call → access object     |
| **D — Freemium**          | Free up to 10 creds, paid after | DB counter → gate at 10                |

**Recommendation for Phase 2:** Start with **Option A (Stripe flat subscription)**. It's the fastest to implement, easiest to reason about, and Stripe handles failed payments, trials, and invoicing. You can layer SUI token payments later as a "pay with crypto" option.

### Implementation (Stripe)

```
Host clicks "Upgrade"
    → POST /api/payments/create-checkout-session
    → Stripe Checkout page
    → Stripe webhook: checkout.session.completed
    → Set organizations.subscription_status = 'active' in Supabase
    → Redirect to /org/[slug]/dashboard
```

```typescript
// app/api/payments/create-checkout-session/route.ts
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const { orgId, orgSlug } = await req.json();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_URL}/org/${orgSlug}/dashboard?upgraded=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/org/upgrade`,
    metadata: { orgId },
  });

  return Response.json({ url: session.url });
}
```

### Webhook Handler

```typescript
// app/api/payments/webhook/route.ts
// Listens for Stripe events, updates organizations.subscription_status
```

### Gating Issuance

```typescript
// middleware check before any issuance action
const org = await supabase
  .from("organizations")
  .select("subscription_status")
  .eq("id", orgId)
  .single();

if (org.data?.subscription_status !== "active") {
  redirect("/org/upgrade");
}
```

---

## 6. On-Chain: Move Contract Changes

### What Stays the Same

The core `Credential` struct and `issue_credential` function remain **unchanged**. They are already deployed and battle-tested.

### What Gets Added

#### Option A — Minimal (Recommended for Phase 2)

Don't change the Move contract at all. Use the existing `issue_credential` function, but call it from the **platform's sponsored transaction infrastructure** instead of from the user's wallet directly.

```
Phase 1: Host wallet → issue_credential → volunteer gets credential
Phase 2: Platform wallet (sponsor) → issue_credential → volunteer gets credential
                ↑
         Platform pays gas
         Host's zkLogin address is passed as `issuer_address` parameter
```

The credential still shows the host's address as `issuer_address` — cryptographic authenticity is preserved. Only the gas payer changes.

#### Option B — Enhanced (Phase 3, Optional)

Add two new Move modules for richer on-chain org/event tracking:

```move
// sources/organization.move
module suignature::organization;

/// An on-chain identity object for a verified issuing organization.
/// Has `key` only — org identity cannot be transferred.
public struct Organization has key {
    id: UID,
    name: String,
    slug: String,
    owner: address,
    verified: bool,
    credential_count: u64,
}
```

```move
// sources/event.move
module suignature::event;

/// Links a batch of credentials to a named event.
public struct Event has key {
    id: UID,
    org_id: ID,       // references Organization object
    name: String,
    date: u64,
    credential_ids: vector<ID>,
}
```

> **Phase 2 Recommendation:** Stay with Option A. Ship the product, validate with users, then add on-chain org/event objects in Phase 3.

---

## 7. Off-Chain: Database Schema (Supabase)

The database provides search, profiles, and metadata. **It never overrides on-chain truth.**

```sql
-- Users (both volunteers and hosts)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sui_address TEXT UNIQUE NOT NULL,      -- derived from zkLogin
  salt TEXT NOT NULL,                    -- platform-managed zkLogin salt
  username TEXT UNIQUE,                  -- chosen handle, e.g. "nazakun"
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  social_links JSONB DEFAULT '{}',       -- { linkedin, twitter, github }
  role TEXT DEFAULT 'volunteer',         -- 'volunteer' | 'host' | 'admin'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,             -- url-safe, e.g. "ygg-pilipinas"
  description TEXT,
  logo_url TEXT,
  website TEXT,
  subscription_status TEXT DEFAULT 'free', -- 'free' | 'active' | 'cancelled'
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  description TEXT,
  date DATE,
  location TEXT,
  banner_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credentials metadata (mirrors on-chain data for search/indexing)
-- Source of truth is always the chain — this is a cache/index
CREATE TABLE credentials_meta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  object_id TEXT UNIQUE NOT NULL,        -- Sui object ID (the real ID)
  event_id UUID REFERENCES events(id),
  org_id UUID REFERENCES organizations(id),
  recipient_address TEXT NOT NULL,       -- volunteer's Sui address
  volunteer_name TEXT,
  skills JSONB,
  issued_at TIMESTAMPTZ,
  is_public BOOLEAN DEFAULT TRUE,        -- volunteer can toggle this
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Org members (if orgs want multiple admin users)
CREATE TABLE org_members (
  org_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES users(id),
  role TEXT DEFAULT 'member',            -- 'owner' | 'admin' | 'member'
  PRIMARY KEY (org_id, user_id)
);
```

### Row Level Security

```sql
-- Users can only edit their own profile
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_data" ON users
  USING (auth.uid() = id);

-- Only org owners/admins can edit org data
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_admin_access" ON organizations
  USING (owner_id = auth.uid());

-- Credentials are public by default
ALTER TABLE credentials_meta ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_credentials" ON credentials_meta
  FOR SELECT USING (is_public = TRUE);
CREATE POLICY "recipient_own_creds" ON credentials_meta
  FOR UPDATE USING (recipient_address = (
    SELECT sui_address FROM users WHERE id = auth.uid()
  ));
```

---

## 8. Sponsored Transactions

The platform removes all gas friction using **Shinami** (the leading Sui transaction sponsorship service).

### How It Works

```
1. Frontend builds the Transaction Block (no gas budget set)
2. POST /api/sponsor-tx with { txBytes, senderAddress }
3. Backend calls Shinami API to get gas sponsorship
4. Shinami adds gas payment to the tx
5. Backend signs with platform's service keypair (for sponsorship proof)
6. Frontend gets back sponsored tx bytes
7. zkLogin user signs with their ephemeral key
8. Transaction submitted: user's address appears as sender, platform pays gas
```

### Shinami Integration

```bash
npm install @shinami/clients
```

```typescript
// lib/sponsor.ts
import {
  GasStationClient,
  buildGaslessTransaction,
} from "@shinami/clients/sui";

const gasStation = new GasStationClient(process.env.SHINAMI_GAS_KEY!);

export async function sponsorTransaction(
  txBytes: string,
  senderAddress: string,
) {
  const sponsoredTx = await gasStation.sponsorTransactionBlock(
    txBytes,
    senderAddress,
    5_000_000, // gas budget in MIST
  );
  return sponsoredTx;
}
```

### Alternative (Self-Hosted Sponsorship)

If Shinami is too expensive for your scale, maintain a **platform hot wallet** with pre-funded SUI and use it as the gas payer in PTBs (Programmable Transaction Blocks):

```typescript
// The platform keypair pays for gas
const tx = new Transaction();
tx.setSender(userAddress); // User is sender (their address on credential)
tx.setGasOwner(platformAddress); // Platform pays gas
tx.setGasBudget(5_000_000);
// ... add move calls
// Two signers required: user (zkLogin sig) + platform (gas sig)
```

---

## 9. Frontend: Page Map & Component Plan

### Full Route Map

```
/                               → Landing page (marketing, login CTA)
/login                          → zkLogin flow (Google/Apple)
/dashboard                      → Volunteer dashboard (private, auth required)
/u/[username]                   → Public volunteer portfolio
/org/new                        → Create organization form (auth required)
/org/upgrade                    → Stripe payment page
/org/[slug]                     → Public org page (issuer profile)
/org/[slug]/dashboard           → Org control panel (auth + paid)
/org/[slug]/events/new          → Create event form
/org/[slug]/events/[id]         → Event detail + issue credentials
/verify/[objectId]              → Public certificate (existing, minor updates)
```

---

### New Page Specs

#### `/` — Landing Page

**Purpose:** Convert visitors into users. Zero crypto jargon.

**Sections:**

1. Hero: "Your community work, verified forever." + two CTAs: "I want to earn credentials" / "I represent an organization"
2. How It Works: 3-step visual (Org issues → You receive → Anyone verifies)
3. Trust section: "Why blockchain?" — explain soulbound in plain English
4. Pricing section: Free for earners / Paid for issuers
5. Footer with links

---

#### `/dashboard` — Volunteer Dashboard

**Layout:** Sidebar nav (Profile, Credentials, Settings)

**Credentials Tab:**

```
┌──────────────────────────────────────────────┐
│  Your Credentials                    [Share Profile ↗] │
├──────────────────────────────────────────────┤
│  ┌────────────────┐  ┌────────────────┐      │
│  │ [Cert Card]    │  │ [Cert Card]    │      │
│  │ Sui Builders   │  │ DevFest CDO    │      │
│  │ Apr 2026       │  │ Mar 2026       │      │
│  │ [View] [Share] │  │ [View] [Share] │      │
│  └────────────────┘  └────────────────┘      │
└──────────────────────────────────────────────┘
```

**Data:** Fetch all Sui objects at user's zkLogin address where `objectType` contains `::credential::Credential`. Cross-reference with `credentials_meta` for event/org context.

```typescript
// lib/fetchUserCredentials.ts
export async function fetchUserCredentials(address: string) {
  const objects = await suiClient.getOwnedObjects({
    owner: address,
    filter: { StructType: `${PACKAGE_ID}::credential::Credential` },
    options: { showContent: true },
  });
  return objects.data;
}
```

---

#### `/u/[username]` — Public Portfolio

**Purpose:** The shareable Credly-style profile. Add this URL to your LinkedIn.

**Layout:**

```
┌───────────────────────────────────────────────┐
│  [Avatar]  Juan dela Cruz                     │
│  @nazakun  ·  Davao City                      │
│  "Smart contract dev and community organizer" │
│  [LinkedIn ↗] [GitHub ↗]                      │
├───────────────────────────────────────────────┤
│  Verified Credentials (4)                     │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐         │
│  │Cert 1│ │Cert 2│ │Cert 3│ │Cert 4│         │
│  └──────┘ └──────┘ └──────┘ └──────┘         │
└───────────────────────────────────────────────┘
```

---

#### `/org/[slug]/dashboard` — Org Dashboard

**Tabs:** Events | Issued Credentials | Members | Settings

**Events Tab:**

```
┌─────────────────────────────────────────────────┐
│  Events                          [+ New Event]  │
├─────────────────────────────────────────────────┤
│  Sui Builders Program Davao · Apr 11–12, 2026   │
│  47 credentials issued                [Manage →]│
├─────────────────────────────────────────────────┤
│  DevFest CDO 2025 · Nov 2025                    │
│  112 credentials issued               [Manage →]│
└─────────────────────────────────────────────────┘
```

**Event Detail / Issue Certificates:**

Two modes:

1. **Individual:** Form with volunteer name, wallet address, skills — issues one credential
2. **Bulk (CSV):** Upload a CSV with `name,address,skills` columns — platform processes in batches

---

#### `/verify/[objectId]` — Updates to Existing Page

Minimal changes — add two new links to the footer:

```
"View all credentials from [Org Name] →"  →  /org/[slug]
"See [Volunteer]'s full portfolio →"       →  /u/[username]
```

These links only appear if both the org and volunteer have profiles in the database.

---

### New Components

| Component               | Description                                            |
| ----------------------- | ------------------------------------------------------ |
| `<ZkLoginButton />`     | "Sign in with Google" — handles full zkLogin flow      |
| `<CredentialCard />`    | Compact card for grid views (portfolio, event list)    |
| `<OrgBadge />`          | Small org logo + name, links to org page               |
| `<SubscriptionGate />`  | Wraps any host-only feature, redirects to /org/upgrade |
| `<BulkIssueUploader />` | CSV drag-and-drop for batch issuance                   |
| `<EventForm />`         | Create/edit event form                                 |
| `<PortfolioGrid />`     | Responsive grid of CredentialCards                     |
| `<VerificationBadge />` | The "Verified on Sui" badge, embeddable anywhere       |

---

## 10. API Routes

```
POST /api/auth/zklogin/start      → Returns nonce + OAuth redirect URL
POST /api/auth/zklogin/complete   → Validates JWT, derives sui_address, creates session
GET  /api/users/[username]        → Public user profile
PUT  /api/users/me                → Update own profile

POST /api/orgs                    → Create organization
GET  /api/orgs/[slug]             → Public org page data
PUT  /api/orgs/[slug]             → Update org (admin only)

POST /api/orgs/[slug]/events      → Create event (paid org only)
GET  /api/orgs/[slug]/events      → List events
GET  /api/orgs/[slug]/events/[id] → Single event + issued credentials

POST /api/credentials/issue       → Issue single credential (builds + sponsors tx)
POST /api/credentials/issue-bulk  → Issue batch from CSV
GET  /api/credentials/[objectId]  → Get on-chain credential data (proxies Sui RPC)

POST /api/payments/create-checkout-session → Stripe checkout
POST /api/payments/webhook        → Stripe webhook handler
GET  /api/payments/status         → Check org subscription status

POST /api/sponsor-tx              → Platform sponsors a transaction (internal)
```

---

## 11. Tech Stack Delta

| Category    | Phase 1            | Phase 2 Addition                            |
| ----------- | ------------------ | ------------------------------------------- |
| Auth        | Sui Wallet (Slush) | zkLogin via `@mysten/zklogin`               |
| Database    | None               | Supabase (Postgres + Auth + Storage)        |
| Payments    | None               | Stripe                                      |
| Gas         | Host-paid          | Platform-sponsored via Shinami              |
| File Upload | None               | Supabase Storage (avatars, logos, CSV)      |
| Email       | None               | Resend or Supabase Email (confirm receipts) |
| Image CDN   | None               | Supabase Storage CDN                        |

### New Dependencies

```bash
# Auth & Blockchain
npm install @mysten/zklogin

# Database
npm install @supabase/supabase-js @supabase/ssr

# Payments
npm install stripe @stripe/stripe-js

# Gas Sponsorship
npm install @shinami/clients

# Utilities
npm install papaparse        # CSV parsing for bulk import
npm install @types/papaparse

# Email (optional)
npm install resend
```

### New Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID=

# Shinami (Gas Sponsorship)
SHINAMI_GAS_KEY=

# zkLogin
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
ZKLOGIN_SALT_SERVICE_URL=    # if using external salt service

# Platform Wallet (for self-hosted sponsorship fallback)
PLATFORM_WALLET_PRIVATE_KEY=
```

---

## 12. Implementation Phases

### Phase 2A — Foundation (Week 1–2)

**Goal:** Authentication + Profiles

- [x] Set up Supabase project, apply schema migrations (client/server/middleware setup complete)
- [x] Implement zkLogin flow (Google sign-in → Sui address derivation)
- [x] Build `/login` page with Google button
- [x] Create `users` table + profile CRUD API routes
- [x] Build `/dashboard` shell (layout, sidebar, auth guard)
- [x] Build volunteer profile edit form
- [x] Build `/u/[username]` public portfolio page
- [x] Fetch owned credentials for volunteer dashboard

---

### Phase 2B — Organization Layer (Week 2–3)

**Goal:** Org creation + payment gate

- [ ] Build `/org/new` creation form
- [ ] Create `organizations` table + API routes
- [ ] Build `/org/[slug]` public page
- [ ] Integrate Stripe (checkout session + webhook)
- [ ] Build `/org/upgrade` payment page
- [ ] Implement `SubscriptionGate` middleware
- [ ] Build `/org/[slug]/dashboard` control panel

---

### Phase 2C — Issuance Pipeline (Week 3–4)

**Goal:** Hosts can issue credentials with zero volunteer friction

- [x] Integrate Shinami gas sponsorship
- [x] Build sponsored `issue_credential` API route
- [x] Build `/org/[slug]/events/new` form
- [x] Build event detail + individual issuance form
- [x] Build CSV bulk importer + validation
- [ ] Build batch issuance pipeline (queue + retry on failure)
- [ ] Email volunteer receipt on credential issuance

---

### Phase 2D — Polish + Discovery (Week 4)

**Goal:** Product-quality UX

- [x] Add org/portfolio links to `/verify/[objectId]` footer
- [x] Build landing page (`/`)
- [ ] Add credential visibility toggle (public/private) on dashboard
- [ ] Add org search/browse page
- [ ] SEO: `generateMetadata` for portfolio + org pages
- [ ] OpenGraph image generation for certificates
- [ ] Test full flow end-to-end on Mainnet

---

## Key Principles for Phase 2

**1. Blockchain is the trust layer, not the UX layer.**
Every user interaction should feel like a normal web app. The blockchain is invisible until someone asks "how do I know this is real?" — that's when you show them the Sui explorer link.

**2. Never break the verify page.**
`/verify/[objectId]` is the product's core value. It must always work, for anyone, with no account, forever.

**3. Volunteer experience is always free.**
Volunteers should never see a paywall, a gas prompt, or a wallet modal. Zero friction.

**4. The database is a cache, not the source.**
If Supabase disagrees with the blockchain, the blockchain wins. Build your credential display to always fetch from Sui RPC as the final source.

---

## Rubric Alignment: Why This Scales

| Concern              | Answer                                                                      |
| -------------------- | --------------------------------------------------------------------------- |
| Non-crypto users?    | zkLogin = Google sign-in. No wallets.                                       |
| Gas costs at scale?  | Subscription revenue covers Shinami sponsorship. Margin widens with volume. |
| Recruiter UX?        | `/verify/[objectId]` still works with zero crypto knowledge.                |
| Volunteer adoption?  | Free forever. Portfolio page is shareable on LinkedIn like Credly.          |
| Org adoption?        | Stripe billing = familiar. Bulk CSV import = zero technical barrier.        |
| Soulbound integrity? | Contract unchanged. Non-transferability still enforced at VM level.         |
