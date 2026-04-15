# Developer Setup Guide

This guide provides step-by-step instructions for setting up the Suignature project locally for development and testing.

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Sui CLI (>= 1.69.0):** [Installation Guide](https://docs.sui.io/guides/developer/getting-started/sui-install)
- **Node.js (>= 18.x):** [Download](https://nodejs.org/)
- **Sui Wallet:** A wallet like [Sui Wallet](https://suiwallet.io/) or [Surf](https://surf.tech/) with Testnet tokens.

---

## Local Installation

### 1. Clone the Repository

```bash
git clone https://github.com/nazakun021/suignature.git
cd suignature
```

### 2. Build & Test Smart Contracts

```bash
# Build the Move package
sui move build

# Run Move unit tests
sui move test
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

### 4. Environment Configuration

Copy the example environment file and fill in your specific values:

```bash
cp .env.example .env.local
```

---

## Environment Variables

In your `.env.local` file, configure the following:

```env
# Sui Configuration
NEXT_PUBLIC_PACKAGE_ID=           # The ID of your published package
NEXT_PUBLIC_MODULE_NAME=credential
NEXT_PUBLIC_FUNCTION_NAME=issue_credential
NEXT_PUBLIC_SUI_NETWORK=testnet
```

---

## 🚀 Running Locally

Once configured, start the development server:

```bash
cd frontend
npm run dev
```

The application will be available at `http://localhost:3000`.

---

## 🏗 Development Workflow

### GitHub & Branching Strategy

| Branch      | Purpose                                                 |
| :---------- | :------------------------------------------------------ |
| `main`      | Production-ready code. Never push directly here.        |
| `feat/`     | New features or enhancements (e.g., `feat/issue-form`). |
| `fix/`      | Bug fixes (e.g., `fix/styling-issue`).                  |
| `refactor/` | Code refactoring without changing functionality.        |

### Commit Conventions

We follow the [Conventional Commits](https://www.conventionalcommits.org/) standard:

- `feat: add skill tagging to credentials`
- `fix: correct timestamp formatting on verify page`
- `docs: update setup instructions`

---

## 🚢 Deployment

### Smart Contract (Testnet)

```bash
# Switch to testnet
sui client switch --env testnet

# Request faucet tokens if needed
sui client faucet

# Publish
sui client publish --gas-budget 50000000
```
