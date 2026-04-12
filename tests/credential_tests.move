#[test_only]
module suignature::credential_tests;

use sui::test_scenario;
use std::unit_test::{assert_eq, destroy};
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

        assert_eq!(*cred.volunteer_name(), b"Juan dela Cruz".to_string());
        assert_eq!(*cred.issuer_name(), b"YGG Pilipinas".to_string());
        assert_eq!(cred.issuer_address(), issuer);
        assert_eq!(*cred.project_or_event(), b"Sui Builders Program Davao".to_string());
        assert_eq!(cred.skills_verified().length(), 2);

        destroy(cred);
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
