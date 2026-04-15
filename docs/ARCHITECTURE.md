# Project Overview: Suignature

Suignature is a decentralized application for issuing and verifying **soulbound (non-transferable)** proof-of-work credentials on the Sui blockchain. It bridges the gap between high-trust blockchain records and a Web2-friendly user experience, specifically designed for grassroots talent and community contributors.

---

## 🏗️ Architecture & Core Concepts

The project is split into a **Sui Move Smart Contract** (on-chain) and a **Next.js Frontend** (multi-flow app).

### 1. On-Chain: Soulbound Credentials (`sources/credential.move`)

- **Move 2024 Edition:** Leverages modern Move features like module label syntax, method syntax (`ctx.sender()`), `assert_eq!`, and `std::unit_test::destroy`.
- **`Credential` Struct:**
  - Has the `key` ability (for global storage) but **no `store` ability**.
  - **Constraint:** This ensures the object can never be transferred, wrapped, or sold on a marketplace once minted to a recipient, making it truly "soulbound."
- **Implementation:** The `issue_credential` function is an `entry fun` that cryptographically captures the `issuer_address` from the transaction context.
- **Fields:** Includes `volunteer_name`, `project_or_event`, `skills_verified` (vector of strings), `issuer_name`, `issuer_address`, and a `timestamp` (captured via `ctx.epoch_timestamp_ms()`).

### 2. Frontend: Multi-Flow Application (`frontend/`)

- **Tech Stack:** Next.js 16, TypeScript, TailwindCSS, `@mysten/dapp-kit`, `@mysten/sui`.
- **Authentication:** Purely wallet-based via `@mysten/dapp-kit`.
- **Primary Flows:**
  - **Landing Page (`/`):** Marketing page with hero, how-it-works, and trust sections.
  - **Dashboard (`/dashboard`):** Volunteer credential grid — reads objects owned by the connected wallet address.
  - **Issuer Form (`/issue`):** For organizations to connect their Sui wallet and mint credentials.
  - **Public Portfolio (`/u/[address]`):** Public portfolio page with a credential grid for any Sui address.
  - **Issuer Portfolio (`/issuer/[address]`):** Public profile showing all credentials issued by a specific address.
  - **Verification Page (`/verify/[objectId]`):** Public, Web2-optimized certificate view (no wallet required).

### 3. Data Strategy

- **Blockchain as Single Source of Truth:** All credential data, issuer records, and ownership are stored directly on the Sui blockchain.
- **No Database:** The application reads directly from the blockchain via Sui RPC, eliminating the need for a separate backend database for core features.

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
│   │   ├── dashboard/     # Volunteer dashboard
│   │   ├── issue/         # Issuer form (wallet-based minting)
│   │   ├── u/             # Public portfolio routes ([address])
│   │   ├── issuer/        # Issuer profile routes ([address])
│   │   ├── verify/        # Public verification routes ([objectId])
│   │   └── api/           # API routes (minimal)
│   ├── components/        # UI Components
│   │   ├── CertificateCard, VerifyPageClient, VerificationTrail
│   │   ├── PortfolioGrid, VerificationBadge
│   │   └── CredentialForm, WalletStatus, SkillBadge, SuccessCard
│   ├── lib/               # Shared utilities
│   │   ├── fetchUserCredentials.ts   # Fetch owned credentials by address
│   │   ├── fetchIssuedCredentials.ts # Fetch issued credentials by address
│   │   ├── credential.ts             # On-chain credential parsing
│   │   ├── sui.ts                    # SuiClient instance
│   │   └── constants.ts              # Package IDs, config
├── docs/                  # Project Documentation
│   ├── ARCHITECTURE.md    # This file
│   └── DEPLOYMENT.md      # Deployment records
├── Move.toml              # Move package configuration
└── .gitignore             # Standard and project-specific ignores
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

### ✅ Phase 2A: Wallet-Based Dashboard & Portfolios

- [x] **Dashboard:** Volunteer credential grid showing owned SBTs.
- [x] **Public Portfolios:** `/u/[address]` and `/issuer/[address]` pages for public sharing.
- [x] **Simplified Stack:** Removed legacy database and auth dependencies.

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
```

---

## 📝 Technical Details & Live Links

- **Network:** Sui **Testnet**.
- **Package ID:** `0x8200046ee3637af5aaf00411789e04770914a3bcf73fb24f0a3ccccf6a8425ed`
- **Live Demo:** [suignature.vercel.app](https://suignature.vercel.app/)
- **Routes:** `/` (landing), `/dashboard`, `/issue`, `/u/[address]`, `/issuer/[address]`, `/verify/[objectId]`
- **Visual Identity:** "Signature" aesthetic — minimalist, high-contrast (dark mode issuer, light mode verification), focused on institutional trust.
