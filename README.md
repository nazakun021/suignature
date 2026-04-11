# SuiGnature

### Verifiable Proof of Work on the Sui Blockchain

Built at the **Sui Builders Program — Davao** | April 11–12, 2026

---

## What is this?

vPoW turns community contributions into cryptographically verified, non-transferable credentials on the Sui blockchain.

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
| Smart Contract     | Sui Move                        |
| Frontend           | Next.js 14 + React + TypeScript |
| Wallet Integration | @mysten/dapp-kit                |
| On-chain Reads     | @mysten/sui.js                  |
| Styling            | Tailwind CSS                    |
| Deployment         | Vercel                          |
| Network            | Sui Testnet                     |

---

## Getting Started

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/vpow-credentials
cd vpow-credentials

# Install frontend dependencies
cd frontend
npm install

# Add environment variables
cp .env.example .env.local
# Fill in NEXT_PUBLIC_PACKAGE_ID with your deployed contract

# Run dev server
npm run dev
```

---

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

Solo build by **[Your Name]** for the Sui Builders Program Davao Hackathon.

Organized by YGG Pilipinas × Metaversity × DICT × IIDB.
