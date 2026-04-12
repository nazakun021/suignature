# suignature — Master TODO

> **Hackathon deadline:** Sunday April 12, 2026 @ 4:00 PM
> **Demo window:** ~3 minutes, live on Sui Testnet
> **Stack:** Sui Move · Next.js · React · @mysten/dapp-kit · @mysten/sui · Vercel

---

## PHASE A — Sui Move Smart Contract ✅ COMPLETE

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
- [x] **Package ID:** `0x8200046ee3637af5aaf00411789e04770914a3bcf73fb24f0a3ccccf6a8425ed`
- [x] **Module name:** `credential`
- [x] Verify the published package on Sui Testnet Explorer
- [x] Manual test transaction from CLI confirms `issue_credential` works end-to-end

---

## PHASE B — Issuer Frontend (Next.js + React) ✅ COMPLETE

### B1. Project Setup

- [x] Scaffold Next.js app (`npx create-next-app@latest frontend`)
  - [x] TypeScript: Yes / Tailwind CSS: Yes / App Router: Yes
- [x] Install Sui SDK dependencies:
  - [x] `npm install @mysten/dapp-kit @mysten/sui @tanstack/react-query`
- [x] Create `.env.local` with all required variables
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
- [x] Gate the form behind wallet connection
- [x] Build the credential form with all controlled inputs
- [x] Add form validation (no empty fields, valid Sui address format)
- [x] Build the `handleSubmit` function with `Transaction` + `useSignAndExecuteTransaction`
- [x] Use `suiClient.waitForTransaction` for indexing guarantee
- [x] Show loading state while transaction is pending
- [x] On success: extract Object ID and display shareable verify URL

### B4. UI Polish

- [x] Clean, minimal layout — no crypto jargon visible
- [x] Professional dark mode color scheme
- [x] Responsive layout
- [x] Disabled submit button while transaction is pending

---

## PHASE C — Recruiter Verify Page ✅ COMPLETE

### C1. Dependency Setup

- [x] Install QR code library: `npm install qrcode.react`
- [x] Install types: `npm install --save-dev @types/qrcode`

### C2. Data Layer

- [x] Create `lib/credential.ts`:
  - [x] Define `CredentialData` TypeScript interface with all fields
  - [x] Write `fetchCredential(objectId)` async function using `suiClient.getObject`
  - [x] Pass `showContent: true` and `showOwner: true` in options
  - [x] Type-guard object as `::credential::Credential` — reject other object types
  - [x] Parse `issuer_address` field
  - [x] Parse `owner` field as `AddressOwner` → `ownerAddress`
  - [x] Parse `timestamp` (u64 ms) into JS `Date` object
  - [x] Handle `CREDENTIAL_NOT_FOUND` error
  - [x] Handle `NOT_A_CREDENTIAL` error
  - [x] Handle `INVALID_OBJECT_TYPE` error
  - [x] Write `formatIssuedDate(date)` helper → human-readable string
  - [x] Write `shortenAddress(address)` helper → `0x1234...5678`
  - [x] Write `explorerUrl(objectId)` → suiscan.xyz object URL
  - [x] Write `addressExplorerUrl(address)` → suiscan.xyz account URL

### C3. Components

- [x] Create `components/SkillBadge.tsx`:
  - [x] Renders a single skill as an indigo pill badge
  - [x] No props other than `skill: string`

- [x] Create `components/CertificateQR.tsx`:
  - [x] Use `QRCodeSVG` from `qrcode.react`
  - [x] QR value = `window.location.origin + /verify/ + objectId`
  - [x] URL assigned inside `useEffect` (client-side only — avoids SSR hydration error)
  - [x] Returns `null` until URL is set
  - [x] White background, indigo foreground, 96px size, level "M"
  - [x] Wrapped in white rounded card with caption: "Scan to verify this credential"

- [x] Create `components/VerificationTrail.tsx`:
  - [x] Step 1 — Issued By: issuerName + shortened issuerAddress (links to suiscan)
  - [x] Step 2 — Issued To: volunteerName + shortened ownerAddress (links to suiscan)
  - [x] Step 3 — Date & Time: full timestamp with timezone
  - [x] Description text under each step (Web2-friendly, no jargon)
  - [x] Footer: "View original blockchain record" link → suiscan object URL
  - [x] Entire component uses light mode styling (bg-gray-50, borders)

- [x] Create `components/CertificateCard.tsx`:
  - [x] Top accent gradient bar (indigo → violet)
  - [x] Header: "Certificate of Verified Work" label + "suignature" title + green "Verified" badge
  - [x] Two-column layout: credential details (left) + QR code (right)
  - [x] "This certifies that [volunteerName]" — large, prominent
  - [x] "Demonstrated verified contributions to [projectOrEvent]"
  - [x] "Verified and issued by [issuerName]"
  - [x] "Date of issuance [formatted date]"
  - [x] Skills section: all `skillsVerified` as `SkillBadge` components
  - [x] Certificate footer: trust statement + "Verified on Sui" badge
  - [x] Element has `id="certificate-card"` for print targeting
  - [x] Light mode (white background) — prints cleanly

- [x] Create `components/VerifyPageClient.tsx`:
  - [x] `'use client'` component
  - [x] Fetches credential via `fetchCredential` in `useEffect`
  - [x] Manages `LoadState`: `loading | success | not_found | invalid | error`
  - [x] `LoadingState`: spinner + "Retrieving credential..." text
  - [x] `NotFoundState`: SVG icon + plain English message + objectId displayed
  - [x] `InvalidState`: SVG icon + plain English message
  - [x] `ErrorState`: SVG icon + technical message for debugging
  - [x] `SuccessState`:
    - [x] `CertificateCard` component
    - [x] `VerificationTrail` component
    - [x] "Why can you trust this credential?" explainer callout
    - [x] `ShareButton`: copies verify URL, shows "✓ Link Copied" feedback
    - [x] `PrintButton`: triggers `window.print()`
  - [x] Header: no wallet connect — purely public page
  - [x] Light mode UI throughout (bg-gray-50 base)

### C4. Route Setup

- [x] Create `app/verify/[objectId]/page.tsx` (Server Component):
  - [x] Accepts `params: Promise<{ objectId: string }>` (Next.js 15+ async params)
  - [x] Exports `generateMetadata` for page title + Open Graph tags
  - [x] Renders `<VerifyPageClient objectId={params.objectId} />`

### C5. Print Support

- [x] Add `@media print` block to `app/globals.css`:
  - [x] Hide all elements except `#certificate-card`
  - [x] Position certificate at top of page
  - [x] Remove box-shadow on print
  - [x] Set `@page { margin: 1cm }`

### C6. End-to-End Test

- [x] Use a real Object ID from a Phase B test mint
- [x] Confirm all credential fields render correctly
- [x] Confirm QR code scans and links back to the same verify page
- [x] Confirm verification trail shows correct issuer + recipient info
- [x] Confirm "View blockchain record" link opens suiscan.xyz correctly
- [x] Confirm "Copy Verification Link" copies the correct URL
- [x] Test print output — only certificate card should print
- [x] Test on mobile (phone screen) — must be fully readable
- [x] Test with an invalid/random object ID — error state renders
- [x] Run `npm run build` — passes with zero TypeScript errors

---

## PHASE D — Deployment

### D1. Vercel Setup

- [ ] Push project to GitHub (`git init`, `git remote add origin`, `git push`)
- [ ] Connect GitHub repo to Vercel
- [ ] Add all `.env.local` variables to Vercel Environment Variables:
  - [ ] `NEXT_PUBLIC_PACKAGE_ID`
  - [ ] `NEXT_PUBLIC_MODULE_NAME`
  - [ ] `NEXT_PUBLIC_FUNCTION_NAME`
  - [ ] `NEXT_PUBLIC_SUI_NETWORK`
- [ ] Trigger first deploy
- [ ] Confirm live URL resolves
- [ ] Test full issuer flow on the live Vercel URL (not localhost)
- [ ] Test `/verify/[objectId]` on live URL with a real credential
- [ ] Confirm QR code on live certificate links to the Vercel domain (not localhost)
- [ ] Copy the live Vercel URL — this goes in the demo

---

## PHASE E — Demo Preparation

### E1. End-to-End Run-Through

- [ ] Connect Slush wallet on live Vercel URL
- [ ] Fill out form with realistic demo data:
  - [ ] Volunteer: your own name + your own wallet address
  - [ ] Event: "Sui Builders Program Davao"
  - [ ] Skills: "Smart Contract Development", "Public Speaking"
  - [ ] Issuer: "YGG Pilipinas / Metaversity"
- [ ] Submit → confirm transaction on Testnet
- [ ] Navigate to `/verify/[objectId]`
- [ ] Screenshot the certificate — use as backup if live demo fails
- [ ] Scan the QR code with your phone to confirm it works
- [ ] Test the URL on a second device (phone or someone else's laptop)

### E2. Pitch Preparation

- [ ] Write your 3-minute demo script:
  - [ ] 30s — Problem (the 6-second recruiter screen, grassroots talent invisible to employers)
  - [ ] 30s — Solution overview (SBT, non-transferable, issuer → volunteer → recruiter)
  - [ ] 60s — Live demo (issue → verify URL → show certificate + QR + verification trail)
  - [ ] 30s — Why Sui (non-transferability enforced at protocol level, not policy)
  - [ ] 30s — Roadmap (zkLogin, Sponsored Transactions, bulk issuance)
- [ ] Prepare a fallback: screenshot of working certificate in case of network issues
- [ ] Know your rubric answers:
  - [ ] Can explain the `store` ability omission: "physically impossible to transfer at VM level"
  - [ ] Can explain the QR code value: "the URL encodes the object ID — scanning it is verification"
  - [ ] Can explain the verification trail: "cryptographic chain from issuer to recipient"
  - [ ] Can explain why zkLogin solves adoption: "volunteers use Google login, no seed phrases"
  - [ ] Can explain the recruiter UX decision: "zero crypto jargon — for someone who has never heard of blockchain"

---

## STRETCH GOALS (Only if everything above is done early)

- [ ] Add a "Share on LinkedIn" button on the verify page
- [ ] Add a landing page at `/` explaining the product to visitors
- [ ] Add a `/profile/[address]` page listing all credentials owned by a wallet
- [ ] Add animated entrance on certificate load (Framer Motion)
- [ ] Add a QR code download button ("Save QR as PNG")

---

## HARD STOPS — Do NOT touch these unless full MVP is working

- [ ] ~~zkLogin integration~~
- [ ] ~~Sponsored transactions~~
- [ ] ~~Mainnet deployment~~
- [ ] ~~User authentication system~~
- [ ] ~~Database / off-chain storage~~

---

## Key References

| Resource                 | URL                                                  |
| ------------------------ | ---------------------------------------------------- |
| Sui Move Book            | https://move-book.com                                |
| Move Code Quality        | https://move-book.com/guides/code-quality-checklist/ |
| Sui TypeScript SDK Docs  | https://sdk.mystenlabs.com/typescript                |
| dapp-kit Docs            | https://sdk.mystenlabs.com/dapp-kit                  |
| Suiscan Testnet Explorer | https://suiscan.xyz/testnet                          |
| Sui Testnet Faucet       | https://faucet.testnet.sui.io                        |
| qrcode.react Docs        | https://github.com/zpao/qrcode.react                 |
| Vercel Deployment        | https://vercel.com                                   |

---

## Key Numbers

```
Package ID:        0x8200046ee3637af5aaf00411789e04770914a3bcf73fb24f0a3ccccf6a8425ed
Module Name:       credential
Function Name:     issue_credential
Network:           testnet
Deployer Address:  0x392902a8eaf1438139238e73ac4effe9246187b0b6d7d4efc5cfcecaded59420
Test Object ID:    0xd553c291d4a9cd41f8afe531a68a4a7163d00ce556602c92fee925c5f9f2b43c
Live Vercel URL:   (fill in after Phase D)
```
