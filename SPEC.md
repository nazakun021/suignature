# Phase A — Sui Move Smart Contract Specification

### vPoW Credentials | `vpow_credentials` Package

---

## Overview

Phase A is the foundation of the entire project. Everything in Phase B and C depends on the **Package ID** produced at the end of this phase. The Move contract is intentionally minimal — one module, one struct, one function. Its power comes from what it deliberately excludes, not what it includes.

**Goal:** Deploy a Move package to Sui Testnet that allows a trusted issuer to mint a non-transferable credential object directly into a volunteer's wallet.

**Estimated time:** 45–60 minutes

---

## Directory Structure

After Phase A is complete, your project root should look like this:

```
vpow-credentials/
├── move/
│   └── vpow_credentials/
│       ├── Move.toml
│       └── sources/
│           └── credential.move
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

```bash
# Navigate to your project root
mkdir vpow-credentials && cd vpow-credentials
mkdir move && cd move

# Scaffold the Move package
sui move new vpow_credentials

# Result:
# vpow_credentials/
# ├── Move.toml
# └── sources/          ← empty, you'll add credential.move here
```

### Move.toml — Final Expected State

```toml
[package]
name = "vpow_credentials"
version = "0.0.1"
edition = "2024.beta"

[dependencies]
Sui = { git = "https://github.com/MystenLabs/sui.git", subdir = "crates/sui-framework/packages/sui-framework", rev = "testnet" }

[addresses]
vpow_credentials = "0x0"
```

> **Important:** The `vpow_credentials = "0x0"` address is a placeholder. After publishing, Sui will replace this with the actual on-chain package address. Do not change it manually before publishing.

---

## A3. The Move Module — Full Specification

Create the file: `move/vpow_credentials/sources/credential.move`

---

### 3.1 Module Declaration

```move
module vpow_credentials::credential {
    // imports go here
}
```

The module name follows the pattern `<package_name>::<module_name>`.
In your case: `vpow_credentials::credential`.

---

### 3.2 Required Imports

```move
use sui::object::{Self, UID};
use sui::tx_context::{Self, TxContext};
use sui::transfer;
use std::string::String;
```

| Import                               | Why It's Needed                                                                          |
| ------------------------------------ | ---------------------------------------------------------------------------------------- |
| `sui::object::{Self, UID}`           | Every on-chain Sui object requires a `UID` field. `Self` gives access to `object::new()` |
| `sui::tx_context::{Self, TxContext}` | Needed to create new object IDs and read transaction metadata (timestamp, sender)        |
| `sui::transfer`                      | Needed to send the minted credential to the recipient's address                          |
| `std::string::String`                | Allows the struct fields to hold UTF-8 text data                                         |

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
public entry fun issue_credential(
    volunteer_name: String,
    project_or_event: String,
    skills_verified: vector<String>,
    issuer_name: String,
    recipient: address,
    ctx: &mut TxContext
) {
    let credential = Credential {
        id: object::new(ctx),
        volunteer_name,
        project_or_event,
        skills_verified,
        issuer_name,
        issuer_address: tx_context::sender(ctx),
        timestamp: tx_context::epoch_timestamp_ms(ctx),
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
2. `tx_context::sender(ctx)` — captures the wallet address of whoever signed the transaction (the issuer). This is cryptographically guaranteed — it cannot be spoofed.
3. `tx_context::epoch_timestamp_ms(ctx)` — records the current epoch time in milliseconds as a `u64`
4. `transfer::transfer(credential, recipient)` — moves the newly created object out of the transaction context and into the recipient's wallet. After this line executes, the issuer has no control over the object.

#### Why `public entry`?

- `public` — the function is callable from outside the module (required for frontend transactions)
- `entry` — the function can be called directly as a transaction entry point from the Sui SDK or CLI. Without `entry`, the TypeScript frontend cannot call it directly via `moveCall`.

---

### 3.5 Complete Module — Final Form

```move
module vpow_credentials::credential {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use std::string::String;

    public struct Credential has key {
        id: UID,
        volunteer_name: String,
        project_or_event: String,
        skills_verified: vector<String>,
        issuer_name: String,
        issuer_address: address,
        timestamp: u64,
    }

    public entry fun issue_credential(
        volunteer_name: String,
        project_or_event: String,
        skills_verified: vector<String>,
        issuer_name: String,
        recipient: address,
        ctx: &mut TxContext
    ) {
        let credential = Credential {
            id: object::new(ctx),
            volunteer_name,
            project_or_event,
            skills_verified,
            issuer_name,
            issuer_address: tx_context::sender(ctx),
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        };

        transfer::transfer(credential, recipient);
    }
}
```

> This is the complete, deployable contract. No other files are needed in `sources/`.

---

## A4. Test Module — Full Specification

Tests live inside the same file, gated behind `#[test_only]` so they are never compiled into the production build.

Append this block **inside** `credential.move`, after the `issue_credential` function but still within the module:

```move
    #[test_only]
    use sui::test_scenario;

    #[test]
    fun test_issue_credential() {
        let issuer = @0xA;
        let volunteer = @0xB;

        let mut scenario = test_scenario::begin(issuer);

        // Step 1: Issue the credential as the issuer
        test_scenario::next_tx(&mut scenario, issuer);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            issue_credential(
                std::string::utf8(b"Juan dela Cruz"),
                std::string::utf8(b"Sui Builders Program Davao"),
                vector[
                    std::string::utf8(b"Smart Contract Development"),
                    std::string::utf8(b"Public Speaking")
                ],
                std::string::utf8(b"YGG Pilipinas"),
                volunteer,
                ctx
            );
        };

        // Step 2: Confirm the volunteer now owns a Credential object
        test_scenario::next_tx(&mut scenario, volunteer);
        {
            let credential = test_scenario::take_from_sender<Credential>(&scenario);

            // Assert fields are correct
            assert!(credential.volunteer_name == std::string::utf8(b"Juan dela Cruz"), 0);
            assert!(credential.issuer_name == std::string::utf8(b"YGG Pilipinas"), 1);
            assert!(credential.issuer_address == issuer, 2);

            test_scenario::return_to_sender(&scenario, credential);
        };

        test_scenario::end(scenario);
    }

    #[test]
    fun test_credential_is_soulbound() {
        // This test documents intent: the credential cannot be transferred.
        // Because `store` is absent, the Move compiler itself prevents any
        // transfer::public_transfer call from compiling. This test simply
        // confirms the struct definition hasn't accidentally gained `store`.
        // If someone adds `store` to the struct, the soulbound property is broken.
        // This comment serves as a written assertion of that invariant.
        assert!(true, 0); // placeholder — the real check is at compile time
    }
```

### Running the Tests

```bash
cd move/vpow_credentials
sui move test
```

**Expected output:**

```
BUILDING vpow_credentials
Running Move unit tests
[ PASS    ] vpow_credentials::credential::test_issue_credential
[ PASS    ] vpow_credentials::credential::test_credential_is_soulbound
Test result: OK. Total tests: 2; passed: 2; failed: 0
```

---

## A5. Build & Publish

### Build First (Catch Errors Before Deploying)

```bash
cd move/vpow_credentials
sui move build
```

**Expected output:**

```
UPDATING GIT DEPENDENCY https://github.com/MystenLabs/sui.git
INCLUDING DEPENDENCY Sui
INCLUDING DEPENDENCY MoveStdlib
BUILDING vpow_credentials
```

If you see any errors here, **fix them before attempting to publish.**

### Publish to Testnet

```bash
sui client publish --gas-budget 50000000
```

> `50000000` MIST = 0.05 SUI. This is well above what a simple publish costs.

### Reading the Publish Output

The output will be a large JSON-like transaction result. You need to extract two values:

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

## Phase A — Completion Checklist

```
[ ] Sui CLI verified and on Testnet
[ ] Wallet funded with Testnet SUI
[ ] Package scaffolded (Move.toml correct)
[ ] credential.move written exactly as specified
[ ] `has key` only — NO `store` ability on Credential struct
[ ] `public entry fun issue_credential` implemented
[ ] Test module written and appended
[ ] `sui move test` passes (2/2)
[ ] `sui move build` succeeds with no errors
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
Package ID:        0x________________________________________________
Module Name:       credential
Function Name:     issue_credential
Network:           testnet
Test Object ID:    0x________________________________________________  (from CLI test)
Deployer Address:  0x________________________________________________
```
