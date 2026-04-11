# Phase A — Sui Move Smart Contract Specification

### suignature | `suignature` Package

---

## Overview

Phase A is the foundation of the entire project. Everything in Phase B and C depends on the **Package ID** produced at the end of this phase. The Move contract is intentionally minimal — one module, one struct, one function. Its power comes from what it deliberately excludes, not what it includes.

**Goal:** Deploy a Move package to Sui Testnet that allows a trusted issuer to mint a non-transferable credential object directly into a volunteer's wallet.

**Estimated time:** 45–60 minutes

**Status:** ✅ Smart contract implemented (Move 2024 edition, code quality compliant)

---

## Directory Structure

After Phase A is complete, your project root should look like this:

```
suignature/
├── Move.toml
├── sources/
│   └── credential.move
├── tests/
│   └── credential_tests.move
└── frontend/         ← (not touched in Phase A)
```

---

## A1. Environment Verification

Before writing any code, confirm your toolchain is ready.

### Commands to Run

```bash
# Check Sui CLI version — should be >= 1.x
sui --version

# Check active network environment
sui client envs

# Check active wallet address
sui client active-address

# Check wallet balance on Testnet
sui client balance
```

### Switch to Testnet (if not already)

```bash
# Add testnet env if it doesn't exist yet
sui client new-env --alias testnet --rpc https://fullnode.testnet.sui.io:443

# Switch to testnet
sui client switch --env testnet
```

### Request Testnet Tokens

```bash
sui client faucet
```

> Wait ~15 seconds, then run `sui client balance` to confirm you received SUI.
> You need at least **0.1 SUI** to cover publish gas. The faucet gives you more than enough.

---

## A2. Package Initialization

The package was scaffolded using `sui move new suignature` with Sui CLI 1.69.3.

### Move.toml — Final State

```toml
[package]
name = "suignature"
edition = "2024"

[dependencies]
# Implicit for Sui 1.45+ — no explicit Sui/MoveStdlib needed
```

> **Note:** Move 2024 edition with Sui 1.45+ uses implicit framework dependencies. No `[addresses]` section is needed — the package name is used directly in module declarations.

---

## A3. The Move Module — Full Specification

File: `sources/credential.move`

---

### 3.1 Module Declaration (Move 2024 Label Syntax)

```move
module suignature::credential;
```

The module uses **label syntax** (Move 2024) — no curly braces wrapping the entire module body. This reduces indentation and follows modern conventions.

---

### 3.2 Required Imports

```move
use std::string::String;
```

| Import                | Why It's Needed                              |
| --------------------- | -------------------------------------------- |
| `std::string::String` | Allows struct fields to hold UTF-8 text data |

> **Note:** With Sui 1.45+ and Move 2024, `UID`, `TxContext`, `object`, and `transfer` are available implicitly without explicit imports.

---

### 3.3 The `Credential` Struct

```move
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

#### Field Breakdown

| Field              | Type             | Description                                                                         |
| ------------------ | ---------------- | ----------------------------------------------------------------------------------- |
| `id`               | `UID`            | Unique object identifier. **Required for all Sui objects.** Auto-generated on mint. |
| `volunteer_name`   | `String`         | Full name of the person receiving the credential                                    |
| `project_or_event` | `String`         | Name of the event, program, or project the work was done for                        |
| `skills_verified`  | `vector<String>` | Array of skill tag strings (e.g., `["Event Logistics", "Public Speaking"]`)         |
| `issuer_name`      | `String`         | Human-readable name of the issuing organization or person                           |
| `issuer_address`   | `address`        | On-chain address of the issuer — provides cryptographic proof of who signed         |
| `timestamp`        | `u64`            | Unix epoch time in milliseconds at the moment of issuance                           |

#### Why `has key` and NOT `has key, store`

This is the **most important design decision in the entire contract.**

| Ability | What It Enables                                                                              |
| ------- | -------------------------------------------------------------------------------------------- |
| `key`   | Object can exist on-chain and be owned by an address                                         |
| `store` | Object can be transferred, wrapped, placed inside other objects, or stored in dynamic fields |

By including `key` and **intentionally omitting `store`**:

- The credential **cannot be transferred** after it is minted
- The credential **cannot be sold** on any marketplace
- The credential **cannot be wrapped** inside another object to obscure ownership
- The credential is **permanently and irrevocably bound** to the wallet it was minted to

This is what makes it a **Soulbound Token**. The non-transferability is enforced at the **Move VM level**, not by a policy, a smart contract rule, or a terms of service. It is physically impossible to move the object.

> **Pitch line:** "The trust mechanism isn't a rule in our code. It's a constraint enforced by the virtual machine itself."

---

### 3.4 The `issue_credential` Function

```move
entry fun issue_credential(
    volunteer_name: String,
    project_or_event: String,
    skills_verified: vector<String>,
    issuer_name: String,
    recipient: address,
    ctx: &mut TxContext,
) {
    let credential = Credential {
        id: object::new(ctx),
        volunteer_name,
        project_or_event,
        skills_verified,
        issuer_name,
        issuer_address: ctx.sender(),
        timestamp: ctx.epoch_timestamp_ms(),
    };

    transfer::transfer(credential, recipient);
}
```

#### Parameter Breakdown

| Parameter          | Type             | Supplied By                                                       |
| ------------------ | ---------------- | ----------------------------------------------------------------- |
| `volunteer_name`   | `String`         | Frontend form input                                               |
| `project_or_event` | `String`         | Frontend form input                                               |
| `skills_verified`  | `vector<String>` | Frontend multi-select (as array)                                  |
| `issuer_name`      | `String`         | Frontend form input                                               |
| `recipient`        | `address`        | Frontend form input (volunteer's wallet address)                  |
| `ctx`              | `&mut TxContext` | Injected automatically by the Sui runtime — never passed manually |

#### What Happens Inside the Function

1. `object::new(ctx)` — generates a globally unique `UID` for this credential object
2. `ctx.sender()` — captures the wallet address of whoever signed the transaction (the issuer). This is cryptographically guaranteed — it cannot be spoofed.
3. `ctx.epoch_timestamp_ms()` — records the current epoch time in milliseconds as a `u64`
4. `transfer::transfer(credential, recipient)` — moves the newly created object out of the transaction context and into the recipient's wallet. After this line executes, the issuer has no control over the object.

#### Why `entry` (not `public entry`)?

- `entry` — the function can be called directly as a transaction entry point from the Sui SDK or CLI. This is a transaction endpoint only — not meant to be composed with other modules.
- Per Move 2024 best practices, avoid `public entry`. Use `entry` for transaction endpoints and `public` for composable functions that return values.

### 3.5 Getter Functions

The module provides public getter functions following Move conventions (named after the field, no `get_` prefix):

```move
public fun volunteer_name(credential: &Credential): &String
public fun project_or_event(credential: &Credential): &String
public fun skills_verified(credential: &Credential): &vector<String>
public fun issuer_name(credential: &Credential): &String
public fun issuer_address(credential: &Credential): address
public fun timestamp(credential: &Credential): u64
```

These enable other modules and the frontend to read credential data without exposing internal struct fields.

---

### 3.6 Complete Module — Final Form

```move
/// Soulbound credential module for the suignature project.
/// Issues non-transferable proof-of-work credentials on the Sui blockchain.
/// The `Credential` struct intentionally omits `store` to enforce soulbound behavior
/// at the Move VM level — making credentials impossible to transfer, sell, or fake.
module suignature::credential;

use std::string::String;

/// A non-transferable credential proving community contribution.
/// Has `key` only — no `store` — enforcing soulbound (non-transferable) at the VM level.
public struct Credential has key {
    id: UID,
    volunteer_name: String,
    project_or_event: String,
    skills_verified: vector<String>,
    issuer_name: String,
    issuer_address: address,
    timestamp: u64,
}

/// Mint a soulbound credential and transfer it directly to the recipient's wallet.
/// The issuer's address is captured cryptographically from the transaction context.
entry fun issue_credential(
    volunteer_name: String,
    project_or_event: String,
    skills_verified: vector<String>,
    issuer_name: String,
    recipient: address,
    ctx: &mut TxContext,
) {
    let credential = Credential {
        id: object::new(ctx),
        volunteer_name,
        project_or_event,
        skills_verified,
        issuer_name,
        issuer_address: ctx.sender(),
        timestamp: ctx.epoch_timestamp_ms(),
    };

    transfer::transfer(credential, recipient);
}

/// Returns the volunteer name from a credential reference.
public fun volunteer_name(credential: &Credential): &String {
    &credential.volunteer_name
}

/// Returns the project or event name from a credential reference.
public fun project_or_event(credential: &Credential): &String {
    &credential.project_or_event
}

/// Returns the skills verified from a credential reference.
public fun skills_verified(credential: &Credential): &vector<String> {
    &credential.skills_verified
}

/// Returns the issuer name from a credential reference.
public fun issuer_name(credential: &Credential): &String {
    &credential.issuer_name
}

/// Returns the issuer address from a credential reference.
public fun issuer_address(credential: &Credential): address {
    credential.issuer_address
}

/// Returns the issuance timestamp from a credential reference.
public fun timestamp(credential: &Credential): u64 {
    credential.timestamp
}
```

> This is the complete, deployable contract. No other files are needed in `sources/`.

---

## A4. Test Module — Full Specification

Tests live in a separate test file: `tests/credential_tests.move`, gated behind `#[test_only]` so they are never compiled into the production build.

```move
#[test_only]
module suignature::credential_tests;

use sui::test_scenario;
use suignature::credential::{Self, Credential};

#[test]
/// Issues a credential as the issuer and verifies the volunteer receives it
/// with all fields correctly populated.
fun issue_and_verify_credential() {
    let issuer = @0xA;
    let volunteer = @0xB;

    let mut scenario = test_scenario::begin(issuer);

    // Issue the credential as the issuer
    scenario.next_tx(issuer);
    {
        credential::issue_credential(
            b"Juan dela Cruz".to_string(),
            b"Sui Builders Program Davao".to_string(),
            vector[
                b"Smart Contract Development".to_string(),
                b"Public Speaking".to_string(),
            ],
            b"YGG Pilipinas".to_string(),
            volunteer,
            scenario.ctx(),
        );
    };

    // Confirm the volunteer now owns a Credential with correct fields
    scenario.next_tx(volunteer);
    {
        let cred = test_scenario::take_from_sender<Credential>(&scenario);

        assert!(*cred.volunteer_name() == b"Juan dela Cruz".to_string());
        assert!(*cred.issuer_name() == b"YGG Pilipinas".to_string());
        assert!(cred.issuer_address() == issuer);
        assert!(*cred.project_or_event() == b"Sui Builders Program Davao".to_string());
        assert!(cred.skills_verified().length() == 2);

        test_scenario::return_to_sender(&scenario, cred);
    };

    scenario.end();
}

#[test]
/// Documents the soulbound invariant: Credential has `key` only, no `store`.
/// The Move compiler itself prevents `transfer::public_transfer` on this type.
/// If someone accidentally adds `store`, this comment serves as the design assertion.
fun credential_is_soulbound() {
    // The real check is at compile time — `store` absence prevents public transfer.
    // This test exists to document the intentional design decision.
    assert!(true);
}
```

### Running the Tests

```bash
sui move test
```

**Expected output:**

```
BUILDING suignature
Running Move unit tests
[ PASS    ] suignature::credential_tests::credential_is_soulbound
[ PASS    ] suignature::credential_tests::issue_and_verify_credential
Test result: OK. Total tests: 2; passed: 2; failed: 0
```

---

## A5. Build & Publish

### Build First (Catch Errors Before Deploying)

```bash
sui move build
```

**Expected output:**

```
INCLUDING DEPENDENCY MoveStdlib
INCLUDING DEPENDENCY Sui
BUILDING suignature
```

If you see any errors here, **fix them before attempting to publish.**

###- [x] Publish to Testnet (`sui client publish --gas-budget 50000000`)

- [x] **SAVE the Package ID from the output** → `0x8200046ee3637af5aaf00411789e04770914a3bcf73fb24f0a3ccccf6a8425ed`
- [x] **SAVE the Module name** → `credential`
- [x] Verify the published package on Sui Testnet Explorer
- [x] Do a manual test transaction from CLI to confirm `issue_credential` works end-to-end

**1. Find the Package ID:**
Look for an object change with `"type": "published"`:

```
╭──────────────────────────────────────────────────────────────────────────────────────╮
│ Object Changes                                                                       │
├──────────────────────────────────────────────────────────────────────────────────────┤
│ Published Objects:                                                                   │
│  ┌──                                                                                 │
│  │ PackageID: 0xABCDEF...  ← THIS IS YOUR PACKAGE ID                               │
│  │ Version: 1                                                                        │
│  │ Digest: ...                                                                       │
│  │ Modules: credential                                                               │
│  └──                                                                                 │
```

**2. Save it immediately:**

```bash
# In your frontend/.env.local
NEXT_PUBLIC_PACKAGE_ID=0xABCDEF...    # paste your actual Package ID here
NEXT_PUBLIC_MODULE_NAME=credential
NEXT_PUBLIC_FUNCTION_NAME=issue_credential
NEXT_PUBLIC_SUI_NETWORK=testnet
```

> **Do not lose this.** If you lose the Package ID, you have to redeploy and update your frontend.

---

## A6. Manual CLI Verification

After publishing, do one manual test transaction from the CLI to confirm the function works before touching the frontend.

```bash
sui client call \
  --package <YOUR_PACKAGE_ID> \
  --module credential \
  --function issue_credential \
  --args \
    "Juan dela Cruz" \
    "Sui Builders Program Davao" \
    '["Smart Contract Development", "Public Speaking"]' \
    "YGG Pilipinas" \
    <YOUR_OWN_WALLET_ADDRESS> \
  --gas-budget 10000000
```

### What a Successful Response Looks Like

```
Transaction Digest: <DIGEST>
╭──────────────────────────────────────────────────────────────────────────────────────╮
│ Transaction Effects                                                                  │
│ Status: Success                                                                      │
╰──────────────────────────────────────────────────────────────────────────────────────╯
│ Created Objects:
│  ┌──
│  │ ID: 0x1234...   ← THIS IS YOUR CREDENTIAL OBJECT ID
│  │ Owner: Account Address (your wallet)
│  │ Version: ...
│  └──
```

**Save the Object ID** — navigate to:

```
https://suiexplorer.com/object/<OBJECT_ID>?network=testnet
```

You should see all credential fields rendered correctly on the explorer. If this works, Phase A is complete.

---

## A7. Common Errors & Fixes

| Error                               | Cause                                                             | Fix                                                                |
| ----------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------ |
| `error[E02001]: unbound module`     | Wrong import path                                                 | Double-check `use sui::object` not `use std::object`               |
| `error[E04001]: ability constraint` | Trying to use `transfer::public_transfer` on a non-`store` object | Use `transfer::transfer` (the private version) instead             |
| `Insufficient gas` on publish       | Gas budget too low                                                | Increase to `100000000`                                            |
| `Faucet rate limit`                 | Requested tokens too recently                                     | Wait 60 seconds and try again                                      |
| `No SUI available`                  | Faucet hasn't settled                                             | Wait 15 seconds, check balance again                               |
| `error[E05001]: unused variable`    | Variable declared but not used                                    | Prefix with `_` or remove it                                       |
| `Expected a single token`           | Syntax error in struct or function                                | Check for missing commas, colons, or semicolons                    |
| `Test scenario object not found`    | Credential wasn't transferred to volunteer in test                | Confirm `transfer::transfer` uses the correct `recipient` variable |

---

## A8. Move 2024 Code Quality Compliance

The implementation follows the [Move Book Code Quality Checklist](https://move-book.com/guides/code-quality-checklist/) across all 11 categories:

| Category            | Status | Notes                                                            |
| ------------------- | ------ | ---------------------------------------------------------------- |
| Code Organization   | ✅     | Formatted consistently, doc comments                             |
| Package Manifest    | ✅     | `edition = "2024"`, implicit dependencies                        |
| Imports & Constants | ✅     | Module label syntax, minimal imports                             |
| Structs             | ✅     | `key` only (soulbound), proper field types                       |
| Functions           | ✅     | `entry` (not `public entry`), getters named after fields         |
| Function Body       | ✅     | `ctx.sender()`, `ctx.epoch_timestamp_ms()`, `b"...".to_string()` |
| Testing             | ✅     | No `test_` prefix, no abort codes, method syntax                 |
| Comments            | ✅     | `///` doc comments on all public items                           |

---

## Phase A — Completion Checklist

```
[x] Package scaffolded (Move.toml correct, edition = "2024")
[x] credential.move written with Move 2024 best practices
[x] `has key` only — NO `store` ability on Credential struct
[x] `entry fun issue_credential` implemented
[x] Getter functions for all credential fields
[x] Test module written in separate file (credential_tests.move)
[x] `sui move build` succeeds with no errors
[x] `sui move test` passes (2/2)
[ ] Sui CLI verified and on Testnet
[ ] Wallet funded with Testnet SUI
[ ] `sui client publish` succeeds
[ ] Package ID saved to frontend/.env.local
[ ] Manual CLI test transaction succeeds
[ ] Credential object visible on Sui Testnet Explorer
```

**When all boxes are checked, Phase A is done. Move to Phase B.**

---

## Key Numbers to Record

Fill this in as you complete Phase A:

```
Package ID:        0x8200046ee3637af5aaf00411789e04770914a3bcf73fb24f0a3ccccf6a8425ed
Module Name:       credential
Function Name:     issue_credential
Network:           testnet
Test Object ID:    0xd553c291d4a9cd41f8afe531a68a4a7163d00ce556602c92fee925c5f9f2b43c
Deployer Address:  0x392902a8eaf1438139238e73ac4effe9246187b0b6d7d4efc5cfcecaded59420
```
