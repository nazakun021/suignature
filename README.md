# suignature

### Verifiable Proof of Work on the Sui Blockchain

Built at the **Sui Builders Program — Davao** | April 11–12, 2026

---

## What is this?

suignature turns community contributions into cryptographically verified, non-transferable credentials on the Sui blockchain.

Organizations issue **Soulbound Tokens (SBTs)** to volunteers who organize events, mentor others, or complete programs. Volunteers build a portable proof-of-work portfolio. Recruiters verify instantly — no crypto knowledge required.

---

## How it works

1. **Sign in with Google** — volunteers use zkLogin (no wallet, no seed phrases)
2. **Organization issues** a soulbound credential via the `/issue` page
3. **Credential appears** in the volunteer's dashboard at `/dashboard`
4. **Share anywhere** — the `/verify/[objectId]` link or `/u/[username]` portfolio page
5. **Anyone verifies** — clean certificate view, no account needed

The credential is non-transferable by design: the Sui Move struct intentionally omits the `store` ability, making it impossible to sell, trade, or fake.

---

## Tech Stack

| Layer              | Technology                                  |
| ------------------ | ------------------------------------------- |
| Smart Contract     | Sui Move (2024 edition)                     |
| Frontend           | Next.js 16 + React + TypeScript             |
| Authentication     | Sui zkLogin (Google OAuth) + Wallet Connect |
| Database           | Supabase (profiles, metadata)               |
| Wallet Integration | @mysten/dapp-kit                            |
| On-chain Reads     | @mysten/sui                                 |
| Styling            | Tailwind CSS                                |
| Deployment         | Vercel                                      |
| Network            | Sui Testnet                                 |

---

## Project Structure

```
suignature/
├── Move.toml                  # Package manifest (Move 2024 edition)
├── sources/
│   └── credential.move        # Soulbound credential module
├── tests/
│   └── credential_tests.move  # Move unit tests (assert_eq!, test_utils)
├── frontend/
│   ├── app/                   # Next.js App Router
│   │   ├── page.tsx           # Marketing landing page
│   │   ├── login/             # zkLogin (Google sign-in)
│   │   ├── dashboard/         # Volunteer credential dashboard
│   │   ├── issue/             # Organization credential minting
│   │   ├── u/[username]/      # Public portfolio pages
│   │   ├── verify/[objectId]/ # Public certificate verification
│   │   └── api/               # Auth + profile API routes
│   ├── components/            # UI components
│   ├── lib/                   # Shared utilities (Sui, Supabase, zkLogin)
│   └── proxy.ts               # Auth guard + session refresh
├── SPECv2.md                  # Phase 2 product specification
├── TODO.md                    # Master roadmap tracker
└── REPOSITORY_OVERVIEW.md     # Detailed architecture overview
```

---

## Smart Contract

The core of suignature is a single Move module (`suignature::credential`) that:

- Defines a `Credential` struct with `key` ability only (no `store` = soulbound)
- Provides an `issue_credential` entry function for minting
- Captures the issuer's address cryptographically via `ctx.sender()`
- Transfers the credential directly to the recipient's wallet

### Build & Test

```bash
# Build the package
sui move build

# Run tests
sui move test
```

### Deploy to Testnet

```bash
# Switch to testnet
sui client switch --env testnet

# Request faucet tokens
sui client faucet

# Publish
sui client publish --gas-budget 50000000
```

---

## Developer Setup

### 1. Prerequisites

- **Sui CLI (>= 1.69.0):** [Installation Guide](https://docs.sui.io/guides/developer/getting-started/sui-install)
- **Node.js (>= 18.x):** [Download](https://nodejs.org/)
- **Wallet:** A Sui wallet (like [Sui Wallet](https://suiwallet.io/) or [Surf](https://surf.tech/)) with Testnet tokens.

### 2. Local Installation

```bash
# 1. Clone the repository
git clone https://github.com/nazakun021/suignature.git
cd suignature

# 2. Build and Test the Smart Contract
sui move build
sui move test

# 3. Setup Frontend
cd frontend
npm install

# 4. Environment Configuration
cp .env.example .env.local
# Fill in your keys (see Environment Variables section)
```

### 3. Environment Variables

```env
# Sui
NEXT_PUBLIC_PACKAGE_ID=           # From sui client publish output
NEXT_PUBLIC_MODULE_NAME=credential
NEXT_PUBLIC_FUNCTION_NAME=issue_credential
NEXT_PUBLIC_SUI_NETWORK=testnet

# Supabase
NEXT_PUBLIC_SUPABASE_URL=         # Your Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Your Supabase anon key
SUPABASE_SERVICE_ROLE_KEY=        # Your Supabase service role key

# zkLogin (Google OAuth)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=     # Google Cloud OAuth 2.0 client ID
```

> **Note:** The app will build and run without Supabase/Google credentials — auth features will be disabled but the issuer form and verification pages will work.

### 4. Run Locally

```bash
cd frontend
npm run dev
```

---

## Development Workflow

### GitHub & Branching Strategy

| Branch      | Purpose                                                 |
| :---------- | :------------------------------------------------------ |
| `main`      | Production-ready code. Never push directly here.        |
| `feat/`     | New features or enhancements (e.g., `feat/issue-form`). |
| `fix/`      | Bug fixes (e.g., `fix/styling-issue`).                  |
| `refactor/` | Code refactoring without changing functionality.        |

### Commit Conventions

We use the [Conventional Commits](https://www.conventionalcommits.org/) standard:

- `feat: add skill tagging to credentials`
- `fix: correct timestamp formatting on verify page`
- `docs: update setup instructions in readme`

---

## Routes

| Route                | Access | Description                          |
| -------------------- | ------ | ------------------------------------ |
| `/`                  | Public | Marketing landing page               |
| `/login`             | Public | Google sign-in (zkLogin)             |
| `/dashboard`         | Auth   | Volunteer credential dashboard       |
| `/issue`             | Wallet | Organization credential minting form |
| `/u/[username]`      | Public | Volunteer portfolio page             |
| `/verify/[objectId]` | Public | Certificate verification page        |

---

## Roadmap

### ✅ Completed

- **Phase A–D:** Smart contract, issuer UI, verifier UI, deployment
- **Phase 2A:** zkLogin auth, Supabase profiles, dashboard, portfolio pages, landing page

### 🔮 Planned

- **Phase 2B:** Organization layer (Stripe subscriptions, org profiles, dashboards)
- **Phase 2C:** Sponsored transactions (Shinami), bulk CSV issuance, event management
- **Phase 2D:** Discovery (org browse/search), SEO, OpenGraph images

---

## Live Demo

- **Frontend:** [suignature.vercel.app](https://suignature.vercel.app/)
- **Network:** Sui Testnet
- **Package ID:** `0x8200046ee3637af5aaf00411789e04770914a3bcf73fb24f0a3ccccf6a8425ed`

---

## Built by

Built by **Naza** and friends for the Sui Builders Program Davao Hackathon.

Organized by YGG Pilipinas × Metaversity × DICT × IIDB.
