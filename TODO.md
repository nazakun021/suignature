# vPoW Credentials — Master TODO

> **Hackathon deadline:** Sunday April 12, 2026 @ 4:00 PM
> **Demo window:** ~3 minutes, live on Sui Testnet
> **Stack:** Sui Move · Next.js · React · @mysten/dapp-kit · @mysten/sui.js · Vercel

---

## PHASE A — Sui Move Smart Contract

### A1. Project Setup

- [ ] Verify Sui CLI is installed and updated (`sui --version`)
- [ ] Verify Move is installed (`sui move --version`)
- [ ] Create new Move package (`sui move new vpow_credentials`)
- [ ] Confirm `Move.toml` is generated correctly
- [ ] Set network to Testnet (`sui client switch --env testnet`)
- [ ] Confirm active address (`sui client active-address`)
- [ ] Request Testnet SUI from faucet (`sui client faucet`)
- [ ] Confirm wallet balance (`sui client balance`)

### A2. Write the Move Module

- [ ] Create `sources/credential.move`
- [ ] Define the `Credential` struct with fields:
  - [ ] `id: UID`
  - [ ] `volunteer_name: String`
  - [ ] `project_or_event: String`
  - [ ] `skills_verified: vector<String>`
  - [ ] `issuer_name: String`
  - [ ] `timestamp: u64`
- [ ] Confirm struct has `key` ability only (NO `store` — this enforces soulbound)
- [ ] Add required imports (`sui::object`, `sui::tx_context`, `std::string`)
- [ ] Write `issue_credential` public entry function:
  - [ ] Accept all credential fields as parameters
  - [ ] Accept `recipient: address` parameter
  - [ ] Use `tx_context::epoch_timestamp_ms` for timestamp
  - [ ] Use `transfer::transfer` to send object to recipient
- [ ] Add module-level `use` statements cleanly

### A3. Test the Module

- [ ] Write a test module inside `credential.move` using `#[test_only]`
- [ ] Write `test_issue_credential` test:
  - [ ] Create a mock `TxContext`
  - [ ] Call `issue_credential` with dummy data
  - [ ] Assert object was created (no panic = pass)
- [ ] Run tests locally (`sui move test`)
- [ ] Confirm all tests pass with zero errors

### A4. Build & Deploy

- [ ] Build the package (`sui move build`)
- [ ] Confirm build succeeds with no warnings
- [ ] Publish to Testnet (`sui client publish --gas-budget 50000000`)
- [ ] **SAVE the Package ID from the output** → copy to `.env.local` as `NEXT_PUBLIC_PACKAGE_ID`
- [ ] **SAVE the Module name** → `credential` (or whatever you named it)
- [ ] Verify the published package on Sui Testnet Explorer
- [ ] Do a manual test transaction from CLI to confirm `issue_credential` works end-to-end

---

## PHASE B — Issuer Frontend (Next.js + React)

### B1. Project Setup

- [ ] Scaffold Next.js app (`npx create-next-app@latest vpow-frontend`)
  - [ ] TypeScript: Yes
  - [ ] Tailwind CSS: Yes
  - [ ] App Router: Yes
- [ ] Install Sui SDK dependencies:
  - [ ] `npm install @mysten/dapp-kit @mysten/sui.js @tanstack/react-query`
- [ ] Create `.env.local` with:
  - [ ] `NEXT_PUBLIC_PACKAGE_ID=<your_package_id>`
  - [ ] `NEXT_PUBLIC_MODULE_NAME=credential`
  - [ ] `NEXT_PUBLIC_FUNCTION_NAME=issue_credential`
  - [ ] `NEXT_PUBLIC_SUI_NETWORK=testnet`
- [ ] Add `.env.local` to `.gitignore`
- [ ] Confirm dev server runs (`npm run dev`)

### B2. Wallet Provider Setup

- [ ] Wrap `_app.tsx` (or `layout.tsx`) with:
  - [ ] `QueryClientProvider` from `@tanstack/react-query`
  - [ ] `SuiClientProvider` from `@mysten/dapp-kit` pointed at Testnet
  - [ ] `WalletProvider` from `@mysten/dapp-kit`
- [ ] Import and apply `@mysten/dapp-kit/dist/index.css`
- [ ] Confirm wallet provider renders without errors

### B3. Issuer Page (`/` — Homepage)

- [ ] Create `app/page.tsx` as the Issuer Dashboard
- [ ] Add `ConnectButton` from `@mysten/dapp-kit` in the header
- [ ] Gate the form behind wallet connection (show "Connect wallet to issue credentials" if not connected)
- [ ] Build the credential form with controlled inputs:
  - [ ] Volunteer Wallet Address (text input)
  - [ ] Volunteer Full Name (text input)
  - [ ] Project or Event Name (text input)
  - [ ] Issuer / Organization Name (text input)
  - [ ] Skills Verified (multi-select dropdown with predefined tags):
    - [ ] Event Logistics
    - [ ] Technical Mentoring
    - [ ] Community Management
    - [ ] Frontend Development
    - [ ] Smart Contract Development
    - [ ] B2B Negotiation
    - [ ] Content Creation
    - [ ] Project Management
    - [ ] Public Speaking
    - [ ] UI/UX Design
- [ ] Add form validation (no empty fields, valid Sui address format)
- [ ] Build the `handleSubmit` function:
  - [ ] Construct a `TransactionBlock`
  - [ ] Call `moveCall` with package ID, module, function, and args
  - [ ] Use `useSignAndExecuteTransactionBlock` hook
  - [ ] On success: show transaction digest + generate verify link
  - [ ] On error: show readable error message
- [ ] Show loading state while transaction is pending
- [ ] On success, display:
  - [ ] "Credential issued successfully!"
  - [ ] The Object ID of the new credential
  - [ ] The full `/verify/[objectId]` URL (copyable)

### B4. UI Polish (Issuer Page)

- [ ] Clean, minimal layout — no crypto jargon visible
- [ ] Professional color scheme (dark or light, consistent)
- [ ] Responsive layout (works on laptop screen for demo)
- [ ] Disabled submit button while transaction is pending

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

| Resource                | URL                                      |
| ----------------------- | ---------------------------------------- |
| Sui Move Book           | https://move-book.com                    |
| Sui TypeScript SDK Docs | https://sdk.mystenlabs.com/typescript    |
| dapp-kit Docs           | https://sdk.mystenlabs.com/dapp-kit      |
| Sui Testnet Explorer    | https://suiexplorer.com/?network=testnet |
| Sui Testnet Faucet      | https://faucet.testnet.sui.io            |
| Vercel Deployment       | https://vercel.com                       |
