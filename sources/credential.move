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
