# Project Overview: Suignature

Suignature is a decentralized application for issuing and verifying **soulbound (non-transferable)** proof-of-work credentials on the Sui blockchain. It bridges the gap between high-trust blockchain records and a Web2-friendly user experience, specifically designed for grassroots talent and community contributors.

---

## 🏗️ Architecture & Core Concepts

The project is split into a **Sui Move Smart Contract** (on-chain), a **Next.js Frontend** (multi-flow app), and a **Supabase Backend** (profiles & metadata).

### 1. On-Chain: Soulbound Credentials (`sources/credential.move`)
- **Move 2024 Edition:** Leverages modern Move features like module label syntax, method syntax (`ctx.sender()`), `assert_eq!`, and `std::unit_test::destroy`.
- **`Credential` Struct:** 
  - Has the `key` ability (for global storage) but **no `store` ability**.
  - **Constraint:** This ensures the object can never be transferred, wrapped, or sold on a marketplace once minted to a recipient, making it truly "soulbound."
- **Implementation:** The `issue_credential` function is an `entry fun` that cryptographically captures the `issuer_address` from the transaction context.
- **Fields:** Includes `volunteer_name`, `project_or_event`, `skills_verified` (vector of strings), `issuer_name`, `issuer_address`, and a `timestamp` (captured via `ctx.epoch_timestamp_ms()`).

### 2. Frontend: Multi-Flow Application (`frontend/`)
- **Tech Stack:** Next.js 16, TypeScript, TailwindCSS, `@mysten/dapp-kit`, `@mysten/sui`, `@supabase/ssr`.
- **Authentication:** Dual-mode auth system:
  - **zkLogin (Google sign-in)** — Volunteers sign in with Google; a Sui address is derived automatically via `@mysten/sui/zklogin`. No wallet needed.
  - **Wallet Connect** — Organizations use direct Sui wallet for credential minting at `/issue`.
- **Primary Flows:**
  - **Landing Page (`/`):** Marketing page with hero, how-it-works, trust section, pricing preview.
  - **Login (`/login`):** zkLogin flow with Google sign-in button + wallet fallback.
  - **Dashboard (`/dashboard`):** Volunteer credential grid, profile setup prompt, portfolio link.
  - **Issuer Form (`/issue`):** For organizations to connect their Sui wallet and mint credentials.
  - **Public Portfolio (`/u/[username]`):** Credly-style portfolio page with credential grid.
  - **Verification Page (`/verify/[objectId]`):** Public, Web2-optimized certificate view (no wallet required).

### 3. Backend: Supabase (Profiles & Metadata)
- **Client Setup:** Browser client, server client, and middleware client — all with graceful null guards when env vars are not configured.
- **Auth Flow:** Supabase session management via Next.js proxy (formerly middleware) for token refresh and route protection.
- **API Routes:** RESTful routes for user profiles (GET/PUT own profile, GET public profile by username).
- **Design Principle:** Supabase is a cache/index layer — the blockchain remains the sole source of truth for all credentials.

---

## 📁 Repository Structure

```text
.
├── sources/               # Sui Move Smart Contracts
│   └── credential.move    # Core soulbound logic (Move 2024)
├── tests/                 # Move Unit Tests
│   └── credential_tests.move
├── frontend/              # Next.js Application
│   ├── app/               # Next.js App Router
│   │   ├── page.tsx       # Marketing Landing Page
│   │   ├── login/         # zkLogin page (Google sign-in)
│   │   ├── dashboard/     # Volunteer dashboard (layout + page)
│   │   ├── issue/         # Issuer form (wallet-based minting)
│   │   ├── u/             # Public portfolio routes ([username])
│   │   ├── verify/        # Public verification routes ([objectId])
│   │   └── api/           # API routes (auth, users)
│   │       ├── auth/      # zkLogin start/complete endpoints
│   │       └── users/     # Profile CRUD endpoints
│   ├── components/        # UI Components
│   │   ├── CertificateCard, VerifyPageClient, VerificationTrail
│   │   ├── ZkLoginButton, PortfolioGrid, VerificationBadge
│   │   └── CredentialForm, WalletStatus, SkillBadge, SuccessCard
│   ├── lib/               # Shared utilities
│   │   ├── supabase/      # Supabase client (browser/server/middleware)
│   │   ├── zklogin.ts     # zkLogin utilities (nonce, address derivation)
│   │   ├── auth-context.tsx # React auth context provider
│   │   ├── fetchUserCredentials.ts # Fetch owned credentials by address
│   │   ├── credential.ts  # On-chain credential parsing
│   │   ├── sui.ts         # SuiClient instance
│   │   └── constants.ts   # Package IDs, config
│   └── proxy.ts           # Next.js 16 proxy (auth guard + session refresh)
├── SPECv2.md              # Phase 2 specification (product evolution)
├── SPEC_A.md              # Phase A: Smart Contract Specification
├── SPEC_B.md              # Phase B: Issuer Frontend Specification
├── SPEC_C.md              # Phase C: Public Verification Specification
├── TODO.md                # Master roadmap and implementation checklist
└── Move.toml              # Move package configuration
```

---

## 🚀 Key Features & Implementation Status

### ✅ Phase A: The Soulbound Contract
- [x] Defined non-transferable `Credential` struct (No `store` ability).
- [x] Implemented `issue_credential` entry function with automated timestamping.
- [x] Built public getter functions for all fields.
- [x] Verified via Move unit tests (Multi-party scenario testing with `assert_eq!`).

### ✅ Phase B: Issuer UI
- [x] Integrated Sui Wallet via `@mysten/dapp-kit`.
- [x] Built `CredentialForm` for on-chain minting with skill tagging.
- [x] Implemented transaction signing and `waitForTransaction` indexing guarantee.

### ✅ Phase C: Verifier UI
- [x] Dynamic routing based on Object ID (`/verify/[objectId]`).
- [x] Professional **Certificate Card** layout with indigo-violet gradient accents.
- [x] **Verification Trail:** A step-by-step cryptographic proof showing Issuer → Recipient.
- [x] **QR Code Generation:** Integrated for easy mobile verification.
- [x] **Print Support:** Optimized CSS for high-quality certificate printing.
- [x] **Discovery Links:** Links to org page and volunteer portfolio in footer.

### ✅ Phase D: Deployment
- [x] Published to **Sui Testnet**.
- [x] Frontend deployed on **Vercel** with full environment variable parity.

### ✅ Phase 2A: Foundation (Auth + Profiles)
- [x] **zkLogin Integration:** Google sign-in → Sui address derivation (ephemeral keypair, nonce, salt).
- [x] **Supabase Setup:** Browser/server/middleware clients with graceful null guards.
- [x] **Auth API Routes:** `/api/auth/zklogin/start` and `/api/auth/zklogin/complete`.
- [x] **User Profile API:** `/api/users/me` (GET/PUT) and `/api/users/[username]` (GET).
- [x] **Dashboard:** Volunteer credential grid with sidebar navigation.
- [x] **Public Portfolio:** `/u/[username]` Credly-style portfolio page.
- [x] **Landing Page:** Marketing page with hero, how-it-works, trust section, pricing.
- [x] **Move Tests:** Upgraded to `assert_eq!` and `std::unit_test::destroy`.

### 🔮 Phase 2B: Organization Layer (Planned)
### 🔮 Phase 2C: Issuance Pipeline (Planned)
### 🔮 Phase 2D: Polish + Discovery (Planned)

---

## 🛠️ Development Setup

### Smart Contract
```bash
sui move build
sui move test
sui client publish --gas-budget 50000000
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local  # Fill in your keys
npm run dev
```

### Required Environment Variables
```env
NEXT_PUBLIC_PACKAGE_ID=...          # Sui package ID
NEXT_PUBLIC_MODULE_NAME=credential
NEXT_PUBLIC_FUNCTION_NAME=issue_credential
NEXT_PUBLIC_SUI_NETWORK=testnet
NEXT_PUBLIC_SUPABASE_URL=...        # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=...   # Supabase anon key
SUPABASE_SERVICE_ROLE_KEY=...       # Supabase service role key
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...    # Google OAuth client ID
```

---

## 📝 Technical Details & Live Links
- **Network:** Sui **Testnet**.
- **Package ID:** `0x8200046ee3637af5aaf00411789e04770914a3bcf73fb24f0a3ccccf6a8425ed`
- **Live Demo:** [suignature.vercel.app](https://suignature.vercel.app/)
- **Routes:** `/` (landing), `/login`, `/dashboard`, `/issue`, `/u/[username]`, `/verify/[objectId]`
- **Visual Identity:** "Signature" aesthetic — minimalist, high-contrast (dark mode issuer, light mode verification), focused on institutional trust.
