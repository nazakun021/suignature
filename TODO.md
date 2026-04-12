# suignature — Master TODO

> **Hackathon deadline:** Sunday April 12, 2026 @ 4:00 PM
> **Demo window:** ~3 minutes, live on Sui Testnet
> **Stack:** Sui Move · Next.js · React · @mysten/dapp-kit · @mysten/sui.js · Vercel

---

## PHASE A — Sui Move Smart Contract

### A1. Project Setup

- [x] Verify Sui CLI is installed and updated (`sui --version` → 1.69.3)
- [x] Create new Move package (`sui move new suignature`)
- [x] Confirm `Move.toml` is generated correctly (edition = "2024", implicit deps)
- [x] Set network to Testnet (`sui client switch --env testnet`)
- [x] Confirm active address (`sui client active-address`)
- [x] Request Testnet SUI from faucet (`sui client faucet`)
- [x] Confirm wallet balance (`sui client balance`)

### A2. Write the Move Module

- [x] Create `sources/credential.move`
- [x] Define the `Credential` struct with fields:
  - [x] `id: UID`
  - [x] `volunteer_name: String`
  - [x] `project_or_event: String`
  - [x] `skills_verified: vector<String>`
  - [x] `issuer_name: String`
  - [x] `issuer_address: address`
  - [x] `timestamp: u64`
- [x] Confirm struct has `key` ability only (NO `store` — this enforces soulbound)
- [x] Add required imports (only `std::string::String` — rest implicit in Move 2024)
- [x] Write `issue_credential` entry function:
  - [x] Accept all credential fields as parameters
  - [x] Accept `recipient: address` parameter
  - [x] Use `ctx.epoch_timestamp_ms()` for timestamp (method syntax)
  - [x] Use `transfer::transfer` to send object to recipient
- [x] Add public getter functions for all fields (named after field, no `get_` prefix)
- [x] Use Move 2024 module label syntax (no curly braces)
- [x] Use `entry fun` instead of `public entry fun` (code quality compliance)
- [x] Use method syntax: `ctx.sender()`, `ctx.epoch_timestamp_ms()`
- [x] Add `///` doc comments to module, struct, and all public functions

### A3. Test the Module

- [x] Write test module in `tests/credential_tests.move` (separate file)
- [x] Write `issue_and_verify_credential` test:
  - [x] Use `test_scenario` for multi-party transfer testing
  - [x] Call `issue_credential` with dummy data
  - [x] Assert all credential fields are correct using getter functions
  - [x] Verify volunteer receives the credential object
- [x] Write `credential_is_soulbound` test (documents soulbound invariant)
- [x] Run tests locally (`sui move test`)
- [x] Confirm all tests pass with zero errors (2/2 passed)
- [x] Use `b"...".to_string()` instead of `std::string::utf8()`
- [x] Use method syntax for scenario operations
- [x] No `test_` prefix on test function names
- [x] No abort codes in `assert!`

### A4. Build & Deploy

- [x] Build the package (`sui move build` — succeeds with no errors)
- [x] Publish to Testnet (`sui client publish --gas-budget 50000000`)
- [x] **SAVE the Package ID from the output** → `0x8200046ee3637af5aaf00411789e04770914a3bcf73fb24f0a3ccccf6a8425ed`
- [x] **SAVE the Module name** → `credential`
- [x] Verify the published package on Sui Testnet Explorer
- [x] Do a manual test transaction from CLI to confirm `issue_credential` works end-to-end

---

## PHASE B — Issuer Frontend (Next.js + React)

### B1. Project Setup

- [x] Scaffold Next.js app (`npx create-next-app@latest frontend`)
  - [x] TypeScript: Yes
  - [x] Tailwind CSS: Yes
  - [x] App Router: Yes
- [x] Install Sui SDK dependencies:
  - [x] `npm install @mysten/dapp-kit @mysten/sui @tanstack/react-query`
- [x] Create `.env.local` with:
  - [x] `NEXT_PUBLIC_PACKAGE_ID=<your_package_id>`
  - [x] `NEXT_PUBLIC_MODULE_NAME=credential`
  - [x] `NEXT_PUBLIC_FUNCTION_NAME=issue_credential`
  - [x] `NEXT_PUBLIC_SUI_NETWORK=testnet`
- [x] Add `.env.local` to `.gitignore`
- [x] Confirm dev server runs (`npm run dev`)

### B2. Wallet Provider Setup

- [x] Wrap client with React context providers (`app/providers.tsx`):
  - [x] `QueryClientProvider` from `@tanstack/react-query`
  - [x] `SuiClientProvider` from `@mysten/dapp-kit` pointed at Testnet
  - [x] `WalletProvider` from `@mysten/dapp-kit`
- [x] Import and apply `@mysten/dapp-kit/dist/index.css`
- [x] Confirm wallet provider renders without errors

### B3. Issuer Page (`/` — Homepage)

- [x] Create `app/page.tsx` as the Issuer Dashboard
- [x] Add `ConnectButton` from `@mysten/dapp-kit` in the header
- [x] Gate the form behind wallet connection (show "Connect wallet to issue credentials" if not connected)
- [x] Build the credential form with controlled inputs:
  - [x] Volunteer Wallet Address (text input)
  - [x] Volunteer Full Name (text input)
  - [x] Project or Event Name (text input)
  - [x] Issuer / Organization Name (text input)
  - [x] Skills Verified (multi-select dropdown with predefined tags)
- [x] Add form validation (no empty fields, valid Sui address format)
- [x] Build the `handleSubmit` function:
  - [x] Construct a `Transaction` using recent @mysten/sui APIs
  - [x] Call `moveCall` with package ID, module, function, and typed args
  - [x] Use `useSignAndExecuteTransaction` hook
  - [x] Use `suiClient.waitForTransaction` to handle indexing guarantees
  - [x] On success: extract exact created objectId
  - [x] On error: show readable error message
- [x] Show loading state while transaction is pending
- [x] On success, display:
  - [x] "Credential issued successfully!"
  - [x] The Object ID of the new credential (linking to suiscan.xyz)
  - [x] The full `/verify/[objectId]` URL (copyable)

### B4. UI Polish (Issuer Page)

- [x] Clean, minimal layout — no crypto jargon visible
- [x] Professional color scheme (dark mode, styling handled consistently)
- [x] Responsive layout (works on laptop screen for demo)
- [x] Disabled submit button while transaction is pending

---

## PHASE C — Recruiter Verify Page

### C1. Route Setup

- [ ] Create `app/verify/[objectId]/page.tsx`
- [ ] Accept `objectId` from route params

### C2. On-Chain Data Fetching

- [ ] Use `@mysten/sui.js` `SuiClient` to call `getObject`
- [ ] Pass `objectId` from URL param
- [ ] Request `showContent: true` in options to get fields
- [ ] Handle loading state
- [ ] Handle error state (invalid ID, object not found)
- [ ] Parse the returned object fields into typed variables:
  - [ ] `volunteer_name`
  - [ ] `project_or_event`
  - [ ] `skills_verified` (array)
  - [ ] `issuer_name`
  - [ ] `timestamp` (convert ms to readable date)

### C3. Certificate UI

- [ ] Design a clean, professional certificate card:
  - [ ] Title: "Verified Proof of Work"
  - [ ] Issued to: [Volunteer Name]
  - [ ] Issued by: [Issuer Name]
  - [ ] Project / Event: [Project Name]
  - [ ] Skills Verified: [Skill tags as badges]
  - [ ] Date: [Human-readable timestamp]
  - [ ] Footer: "This credential is cryptographically verified on the Sui blockchain."
- [ ] **Zero crypto jargon** — no mentions of "hashes", "gas", "Move", "object ID" in the visible UI
- [ ] Add a subtle "Verified on Sui" badge/logo for credibility
- [ ] Add a "View on Sui Explorer" link (hidden or small — for technical users)

### C4. UI Polish (Verify Page)

- [ ] Page should look like something you'd proudly share with an employer
- [ ] Works cleanly when printed or screenshotted
- [ ] Mobile-readable (recruiter might open link on phone)

---

## PHASE D — Deployment

### D1. Vercel Setup

- [ ] Push project to GitHub (`git init`, `git remote add origin`, `git push`)
- [ ] Connect GitHub repo to Vercel
- [ ] Add all `.env.local` variables to Vercel Environment Variables
- [ ] Trigger first deploy
- [ ] Confirm live URL works
- [ ] Test full issuer → verify flow on the live Vercel URL (not localhost)
- [ ] Copy the live Vercel URL — this is what goes in the demo

---

## PHASE E — Demo Preparation

### E1. End-to-End Run-Through

- [ ] Connect Slush wallet on live Vercel URL
- [ ] Fill out form with realistic dummy data:
  - [ ] Volunteer: your own name
  - [ ] Event: "Sui Builders Program Davao"
  - [ ] Skills: "Smart Contract Development", "Public Speaking"
  - [ ] Issuer: "YGG Pilipinas / Metaversity"
- [ ] Submit → confirm transaction on Testnet
- [ ] Navigate to `/verify/[objectId]`
- [ ] Screenshot the certificate — use as a backup if live demo fails
- [ ] Test the URL on a different device (phone or someone else's laptop)

### E2. Pitch Preparation

- [ ] Write your 3-minute demo script:
  - [ ] 30s — Problem (the 6-second recruiter screen)
  - [ ] 30s — Solution overview (SBT, non-transferable, issuer → volunteer → recruiter)
  - [ ] 60s — Live demo (issue → verify URL)
  - [ ] 30s — Why Sui (non-transferability enforced at protocol level)
  - [ ] 30s — Roadmap (zkLogin, Sponsored Transactions, bulk issuance)
- [ ] Prepare a fallback: screenshot of working certificate in case of network issues
- [ ] Know your rubric:
  - [ ] Can explain the `store` ability omission clearly
  - [ ] Can explain why zkLogin solves adoption
  - [ ] Can explain the recruiter UX decision

---

## STRETCH GOALS (Only if everything above is done early)

- [ ] Add a "Copy Link" button on the issuer success screen
- [ ] Add a "Share on LinkedIn" button on the verify page
- [ ] Add a simple homepage explaining the product (for judges browsing the URL)
- [ ] Add multiple credentials per wallet (list view on `/profile/[address]`)
- [ ] Add QR code generation on the verify page

---

## HARD STOPS — Do NOT touch these unless MVP is fully working

- [ ] ~~zkLogin integration~~
- [ ] ~~Sponsored transactions~~
- [ ] ~~Mainnet deployment~~
- [ ] ~~User authentication system~~
- [ ] ~~Database / off-chain storage~~

---

## Key References

| Resource                | URL                                                  |
| ----------------------- | ---------------------------------------------------- |
| Sui Move Book           | https://move-book.com                                |
| Move Code Quality       | https://move-book.com/guides/code-quality-checklist/ |
| Sui TypeScript SDK Docs | https://sdk.mystenlabs.com/typescript                |
| dapp-kit Docs           | https://sdk.mystenlabs.com/dapp-kit                  |
| Sui Testnet Explorer    | https://suiexplorer.com/?network=testnet             |
| Sui Testnet Faucet      | https://faucet.testnet.sui.io                        |
| Vercel Deployment       | https://vercel.com                                   |
