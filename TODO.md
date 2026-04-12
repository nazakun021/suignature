# suignature — Master TODO

> **Stack:** Sui Move · Next.js · React · @mysten/dapp-kit · @mysten/sui · Vercel · Supabase

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
- [x] Write `issue_credential` entry function
- [x] Add public getter functions for all fields
- [x] Use Move 2024 module label syntax, `entry fun`, method syntax
- [x] Add `///` doc comments

### A3. Test the Module

- [x] Write `issue_and_verify_credential` test in `tests/credential_tests.move`
- [x] Write `credential_is_soulbound` test
- [x] All tests pass: `sui move test` (2/2)
- [x] Updated to use `assert_eq!` and `std::unit_test::destroy`

### A4. Build & Deploy

- [x] `sui move build` — succeeds
- [x] `sui client publish --gas-budget 50000000`
- [x] **Package ID:** `0x8200046ee3637af5aaf00411789e04770914a3bcf73fb24f0a3ccccf6a8425ed`
- [x] Manual CLI test transaction confirms `issue_credential` works end-to-end

---

## PHASE B — Issuer Frontend (Next.js + React) ✅ COMPLETE

- [x] Scaffold Next.js app, install Sui SDK deps
- [x] Wallet provider setup (`QueryClientProvider`, `SuiClientProvider`, `WalletProvider`)
- [x] Issuer Dashboard at `/issue` with `ConnectButton`, form, validation
- [x] `handleSubmit` with `Transaction` + `useSignAndExecuteTransaction`
- [x] `suiClient.waitForTransaction` for indexing guarantee
- [x] Success state shows shareable verify URL
- [x] Clean dark mode UI, responsive layout

---

## PHASE C — Recruiter Verify Page ✅ COMPLETE

- [x] `lib/credential.ts` with `fetchCredential`, `formatIssuedDate`, `shortenAddress`, `explorerUrl`, `addressExplorerUrl`
- [x] `components/SkillBadge.tsx`
- [x] `components/CertificateQR.tsx`
- [x] `components/VerificationTrail.tsx`
- [x] `components/CertificateCard.tsx` (with `id="certificate-card"` for print)
- [x] `components/VerifyPageClient.tsx` — full loading/error/success states
- [x] `app/verify/[objectId]/page.tsx` with `generateMetadata`
- [x] Print CSS: `@media print` hides all except `#certificate-card`

---

## PHASE D — Deployment ✅ COMPLETE

- [x] Pushed to GitHub, connected to Vercel
- [x] All env vars set in Vercel
- [x] Live URL: **https://suignature.vercel.app/**
- [x] Full issuer + verify flow tested on live URL
- [x] QR code on certificate links to Vercel domain

---

## PHASE E — Demo Prep 🔄 IN PROGRESS

- [ ] Connect Slush wallet on live Vercel URL
- [ ] Issue demo credential (Sui Builders Program Davao, your name/address)
- [ ] Screenshot certificate as backup
- [ ] Scan QR on phone, test on second device
- [ ] Write 3-minute demo script (see pitch outline in SPEC)
- [ ] Prepare fallback screenshot
- [ ] Lock in rubric answers:
  - [ ] `store` omission = "VM-level non-transferability, not policy"
  - [ ] QR = "URL encodes object ID — scanning IS verification"
  - [ ] zkLogin roadmap = "volunteers use Google, no seed phrases"

---

## PHASE 2A — zkLogin + Auth ~~DROPPED~~

> Auth has been **cut from scope**. Profiles are address-based and fully public.
> No login, no session, no Supabase auth. `lib/zklogin.ts`, `AuthProvider`,
> `ZkLoginButton`, `/login` page, and `/dashboard` are superseded by
> the wallet-address profile system below.
>
> What survives from 2A: `lib/fetchUserCredentials.ts`, Supabase client setup
> (used for future org layer only if needed), and the landing page `/`.

---

## PHASE 2B — Public Profiles (No Auth) ✅ COMPLETE

> **Goal:** Volunteer portfolio page + Issuer profile page, both public,
> both fetched 100% from Sui RPC. No database. No login. 30-minute build.

### 2B1. New Lib

- [x] Create `lib/fetchIssuedCredentials.ts`
  - [x] `queryTransactionBlocks` with `MoveFunction: issue_credential` + `FromAddress: address`
  - [x] For each tx, collect `effects.created` object IDs
  - [x] Batch fetch with `multiGetObjects({ showContent: true, showOwner: true })`
  - [x] Filter to `::credential::Credential` struct type only
  - [x] Return sorted array of `IssuedCredentialSummary` (objectId, volunteerName, projectOrEvent, skillsVerified, recipientAddress, timestamp)
  - [x] Sort descending by timestamp

### 2B2. New Component

- [x] Create `components/CredentialCard.tsx`
  - [x] Props: `objectId`, `projectOrEvent`, `skillsVerified`, `timestamp`, optional `volunteerName`, optional `issuerName`
  - [x] Wraps in `<Link href="/verify/[objectId]">` — entire card is clickable
  - [x] Indigo top accent bar (gradient, 4px tall, 40px wide)
  - [x] Shows `projectOrEvent` as uppercase label in indigo
  - [x] Shows `volunteerName` if provided (issuer-profile context)
  - [x] Shows `issuerName` if provided (volunteer-portfolio context)
  - [x] Skills: first 3 as indigo pill badges, overflow as `+N` gray badge
  - [x] Footer: formatted date (left) + "View →" that fades in on hover (right)
  - [x] Hover state: border turns indigo, subtle shadow increase

### 2B3. Volunteer Portfolio Page

- [x] Create `app/u/[address]/page.tsx` (Server Component)
  - [x] `params: Promise<{ address: string }>` (Next.js 15+ async params)
  - [x] `generateMetadata` → title `"{short}'s Credentials — suignature"`
  - [x] Renders `<VolunteerPortfolioClient address={address} />`

- [x] Create `app/u/[address]/VolunteerPortfolioClient.tsx` (Client Component)
  - [x] `'use client'`
  - [x] `useEffect` → calls `fetchUserCredentials(address)` (already exists)
  - [x] **Loading state:** centered spinner + "Loading credentials…"
  - [x] **Empty state:** dashed border box + "No credentials found for this address."
  - [x] **Success state:**
    - [x] Profile header: "Verified Portfolio" label (indigo, uppercase, xs)
    - [x] `shortenAddress(address)` as h1
    - [x] "View on Sui Explorer ↗" link → `addressExplorerUrl(address)`
    - [x] Credential count line: "{N} verified credential(s)"
    - [x] Responsive grid: `sm:grid-cols-2 lg:grid-cols-3`
    - [x] Each cell: `<CredentialCard>` with `issuerName` from `fields.issuer_name`

### 2B4. Issuer Profile Page

- [x] Create `app/issuer/[address]/page.tsx` (Server Component)
  - [x] Same async params pattern as volunteer page
  - [x] `generateMetadata` → title `"{short} — Credential Issuer on suignature"`
  - [x] Renders `<IssuerProfileClient address={address} />`

- [x] Create `app/issuer/[address]/IssuerProfileClient.tsx` (Client Component)
  - [x] `'use client'`
  - [x] `useEffect` → calls `fetchIssuedCredentials(address)` (new from 2B1)
  - [x] **Loading state:** centered + "Loading issued credentials…"
  - [x] **Empty state:** dashed border + "No credentials issued by this address yet."
  - [x] **Success state:**
    - [x] "Credential Issuer" pill badge (indigo-100 bg, indigo-700 text)
    - [x] `shortenAddress(address)` as h1
    - [x] "View on Sui Explorer ↗" link
    - [x] Credential count line: "{N} credential(s) issued"
    - [x] Responsive grid: `sm:grid-cols-2 lg:grid-cols-3`
    - [x] Each cell: `<CredentialCard>` with `volunteerName` from `cred.volunteerName`

### 2B5. Verify Page — Footer Discovery Links

- [x] Edit `components/VerifyPageClient.tsx` — inside `SuccessState`, below `<VerificationTrail />`
  - [x] Add a `<div>` with `border-t border-gray-200 pt-6 mt-6`
  - [x] Link 1: `"View all credentials from this issuer →"` → `/issuer/{credential.issuerAddress}`
  - [x] Link 2: `"See {credential.volunteerName}'s full portfolio →"` → `/u/{credential.ownerAddress}`
  - [x] Both links: `text-xs text-gray-500 hover:text-indigo-600`
  - [x] Layout: flex column on mobile, flex row on sm+

### 2B6. Build Verification

- [x] `npm run build` — zero TypeScript errors
- [ ] Test `/u/[your address]` — shows your received credential(s)
- [ ] Test `/issuer/[issuer address]` — shows all credentials that address has issued
- [ ] Test discovery links on `/verify/[objectId]` — both links resolve correctly
- [ ] Test with an address that has no credentials — empty state renders
- [ ] Test on mobile — grid collapses correctly

---

## PHASE 2C — Issuance Pipeline ✅ COMPLETE

- [x] Shinami gas sponsorship integrated
- [x] Sponsored `issue_credential` API route
- [x] `/org/[slug]/events/new` form
- [x] Event detail + batch issuance dashboard
- [x] CSV bulk importer + validation
- [ ] Batch issuance queue + retry on failure (DEFERRED)

---

## PHASE 3 — Volunteer Dashboard ✅ COMPLETE

> **Goal:** Private dashboard for connected users to manage their earned credentials.
> Wallet-only, no auth, no database.

- [x] Shared `SiteHeader` component with "My Credentials" link
- [x] `app/dashboard/page.tsx` with full implementation
- [x] Unified header/footer across all pages
- [x] Disconnected state (Connect prompt)
- [x] Loading/Empty/Success states for connected users
- [x] "View Public Portfolio ↗" discovery link
- [x] Zero TypeScript/Build errors

---

## PHASE 4 — Polish + Discovery 🔮 FUTURE

- [ ] SEO: `generateMetadata` for profile pages (done in 2B above)
- [ ] OpenGraph image generation for certificates
- [ ] Org layer: `/org/new`, `/org/[slug]`, `/org/[slug]/dashboard`
- [ ] Stripe payment gate for org issuance
- [ ] Add credential visibility toggle on portfolio (public/private)
- [ ] Add org search/browse page
- [ ] "Share on LinkedIn" button on verify page
- [ ] Animated entrance on certificate load (Framer Motion)
- [ ] Full end-to-end test on Mainnet

---

## Key References

| Resource                 | URL                                   |
| ------------------------ | ------------------------------------- |
| Sui Move Book            | https://move-book.com                 |
| Sui TypeScript SDK Docs  | https://sdk.mystenlabs.com/typescript |
| dapp-kit Docs            | https://sdk.mystenlabs.com/dapp-kit   |
| Suiscan Testnet Explorer | https://suiscan.xyz/testnet           |
| Sui Testnet Faucet       | https://faucet.testnet.sui.io         |
| qrcode.react Docs        | https://github.com/zpao/qrcode.react  |

---

## Key Numbers

```
Package ID:        0x8200046ee3637af5aaf00411789e04770914a3bcf73fb24f0a3ccccf6a8425ed
Module Name:       credential
Function Name:     issue_credential
Network:           testnet
Deployer Address:  0x392902a8eaf1438139238e73ac4effe9246187b0b6d7d4efc5cfcecaded59420
Test Object ID:    0xd553c291d4a9cd41f8afe531a68a4a7163d00ce556602c92fee925c5f9f2b43c
Live Vercel URL:   https://suignature.vercel.app/
```
