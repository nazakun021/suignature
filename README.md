# SuiGnature

### Verifiable Proof of Work on the Sui Blockchain

**Champion — Best Case Presentation** | Sui Builders Program Davao (April 11–12, 2026)

---

## The Award-Winning Vision

**Team Suignature** addressed a critical gap in the digital economy: the difficulty of verifying specialized skills and "invisible" community contributions.

At the Sui Builders Program Davao — a collaboration between YGG Pilipinas, Metaversity, DICT XI, and the ICT Industry Development Bureau (IIDB) — Suignature emerged as the **Champion**, demonstrating how blockchain technology can turn volunteer efforts into professional value.

> _"Our goal is to help local talent turn community work—such as event hosting, management, and logistics—into a verified digital identity that global employers can trust."_

---

## What is Suignature?

Suignature is a decentralized platform that turns community contributions into cryptographically verified, non-transferable credentials on the Sui blockchain.

By utilizing **Soulbound Tokens (SBTs)**, Suignature ensures that achievements are permanent, secure, and tamper-proof. Unlike standard NFTs, these credentials cannot be sold, traded, or faked, creating a foundation for a truly decentralized portfolio.

### Turning Volunteerism into Professional Value

- **Permanent Proof:** Build a portable proof-of-work portfolio that lasts forever.
- **Instant Verification:** Recruiters and employers can verify expertise with a single, immutable link.
- **Empowering Talent:** Bridging the gap between local community work and the global digital workforce.

---

## How It Works

1.  **Connect Wallet** — Volunteers connect their Sui wallet (no account signup needed).
2.  **Organization Issues** — Event organizers issue a soulbound credential via the `/issue` portal.
3.  **Build Portfolio** — Credentials appear automatically in the volunteer's dashboard.
4.  **Share Anywhere** — Use unique `/verify/[objectId]` links or public `/u/[address]` portfolio pages.
5.  **Anyone Verifies** — A clean, professional certificate view allows anyone to verify the claim without needing a wallet.

---

## Technical Implementation

### Smart Contract: Sui Move

The core of Suignature is implemented in Sui Move, leveraging the 2024 edition's safety and performance features.

- **Soulbound by Design:** The `Credential` struct uses the `key` ability but intentionally omits the `store` ability. This enforces non-transferability at the Move VM level.
- **Cryptographic Provenance:** The `issue_credential` function captures the issuer's address directly from the transaction context (`ctx.sender()`), ensuring the source of the credential is authenticated on-chain.
- **On-chain Metadata:** Each credential stores the volunteer's name, the project/event, specific skills verified, and a timestamp.

```rust
// sources/credential.move snippet
public struct Credential has key {
    id: UID,
    volunteer_name: String,
    project_or_event: String,
    skills_verified: vector<String>,
    issuer_name: String,
    issuer_address: address,
    timestamp: u64,
}
```

---

## Developer Resources

- **[SETUP.md](./SETUP.md)**: Full instructions for local environment setup, configuration, and testing.
- **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)**: Detailed design and data flow documentation.

---

## Tech Stack

| Layer              | Technology                      |
| ------------------ | ------------------------------- |
| **Smart Contract** | Sui Move (2024 edition)         |
| **Frontend**       | Next.js 16 + React + TypeScript |
| **Authentication** | Wallet-based (Sui dApp Kit)     |
| **Wallet Sync**    | @mysten/dapp-kit                |
| **Styling**        | Tailwind CSS                    |
| **Network**        | Sui Testnet                     |

---

## Project Structure

```
suignature/
├── sources/
│   └── credential.move        # Soulbound credential logic
├── tests/
│   └── credential_tests.move  # Move unit tests
├── frontend/
│   ├── app/                   # Next.js App Router
│   │   ├── dashboard/         # Volunteer portfolio view
│   │   ├── issue/             # Organization minting portal
│   │   ├── u/[address]/       # Public portfolio pages
│   │   └── verify/[objectId]/ # Public certificate verification
│   ├── lib/                   # Sui utilities & SDK integration
```

---

## Roadmap

- [x] **Core MVP:** Smart contract and basic issuance/verification.
- [x] **Portfolio Layer:** Wallet-based dashboards and public profile pages.
- [ ] **Organization Layer:** Stripe subscriptions and organization profiles.
- [ ] **Scale:** Sponsored transactions (Shinami) and bulk CSV issuance.
- [ ] **Discovery:** Browse and search for verified organizations and events.

---

## Live Demo

- **Frontend:** [suignature.vercel.app](https://suignature.vercel.app/)
- **Network:** Sui Testnet
- **Package ID:** `0x8200046ee3637af5aaf00411789e04770914a3bcf73fb24f0a3ccccf6a8425ed`

---

## Built by

Created by **Naza** and friends for the **Sui Builders Program Davao Hackathon**.

Organized by YGG Pilipinas × Metaversity × DICT × IIDB.
