# suignature

### Verifiable Proof of Work on the Sui Blockchain

Built at the **Sui Builders Program — Davao** | April 11–12, 2026

---

## What is this?

suignature turns community contributions into cryptographically verified, non-transferable credentials on the Sui blockchain.

Students and volunteers who organize events, mentor others, or complete programs can receive a **Soulbound Token (SBT)** from a trusted issuer — then share a single public link that any recruiter can verify instantly, no crypto knowledge required.

---

## How it works

1. **Issuer** connects their Sui wallet and fills out a form (volunteer name, event, skills demonstrated)
2. A **Soulbound Token** is minted on Sui Testnet and transferred directly to the volunteer's wallet
3. The volunteer shares `/verify/[objectId]` on their resume
4. **Anyone** can open that link and see a clean, verified certificate — no wallet needed

The credential is non-transferable by design: the Sui Move struct intentionally omits the `store` ability, making it impossible to sell, trade, or fake.

---

## Tech Stack

| Layer              | Technology                      |
| ------------------ | ------------------------------- |
| Smart Contract     | Sui Move (2024 edition)         |
| Frontend           | Next.js 14 + React + TypeScript |
| Wallet Integration | @mysten/dapp-kit                |
| On-chain Reads     | @mysten/sui.js                  |
| Styling            | Tailwind CSS                    |
| Deployment         | Vercel                          |
| Network            | Sui Testnet                     |

---

## Project Structure

```
suignature/
├── Move.toml              # Package manifest (Move 2024 edition)
├── sources/
│   └── credential.move    # Soulbound credential module
├── tests/
│   └── credential_tests.move  # Unit tests
├── README.md
├── SPEC.md                # Phase A technical specification
├── TODO.md                # Master task tracker
└── frontend/              # (Phase B — Next.js app)
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

Follow these steps to set up the development environment and start contributing to suignature.

### 1. Prerequisites

Ensure you have the following installed:

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

# 3. Setup Frontend (Phase B)
cd frontend
npm install

# 4. Environment Configuration
cp .env.example .env.local
# Edit .env.local and add your NEXT_PUBLIC_PACKAGE_ID (from deployment)
```

---

## Development Workflow

### GitHub & Branching Strategy

We follow a structured branching model to keep the codebase clean:

| Branch      | Purpose                                                 |
| :---------- | :------------------------------------------------------ |
| `main`      | Production-ready code. Never push directly here.        |
| `feat/`     | New features or enhancements (e.g., `feat/issue-form`). |
| `fix/`      | Bug fixes (e.g., `fix/styling-issue`).                  |
| `refactor/` | Code refactoring without changing functionality.        |

#### Process:

1. **Pull Latest:** Always start by pulling the latest changes from `main`.
2. **Create Branch:** Create a dedicated branch for your task:
   ```bash
   git checkout -b feat/your-feature-name
   ```
3. **Commit often:** Use descriptive commit messages.
4. **Push & PR:** Push your branch and open a Pull Request (PR) against `main`.
5. **Review:** PRs must be reviewed and pass all Move/Next.js builds before merging.

### Commit Conventions

We use the [Conventional Commits](https://www.conventionalcommits.org/) standard:

- `feat: add skill tagging to credentials`
- `fix: correct timestamp formatting on verify page`
- `docs: update setup instructions in readme`

---

## Smart Contract Details

## Environment Variables

```env
NEXT_PUBLIC_PACKAGE_ID=       # From sui client publish output
NEXT_PUBLIC_MODULE_NAME=credential
NEXT_PUBLIC_FUNCTION_NAME=issue_credential
NEXT_PUBLIC_SUI_NETWORK=testnet
```

---

## Roadmap

- **zkLogin** — let volunteers use Google/Twitch accounts instead of managing seed phrases
- **Sponsored Transactions** — issuers cover gas fees; volunteers experience a fully free Web2-style app
- **Bulk Issuance** — mint credentials to an entire cohort in one transaction
- **Skill Taxonomy** — standardized tags for ATS (applicant tracking system) compatibility

---

## Built by

Built by **Naza** and friends for the Sui Builders Program Davao Hackathon.

Organized by YGG Pilipinas × Metaversity × DICT × IIDB.
