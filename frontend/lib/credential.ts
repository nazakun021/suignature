import { suiClient } from './sui';

// ── Parsed credential type ────────────────────────────────────────────────────
export interface CredentialData {
  objectId: string;
  volunteerName: string;
  projectOrEvent: string;
  skillsVerified: string[];
  issuerName: string;
  issuerAddress: string;
  timestamp: number;
  issuedAt: Date;
  ownerAddress: string;
}

// ── Fetch and parse a credential from Sui Testnet ─────────────────────────────
export async function fetchCredential(
  objectId: string,
): Promise<CredentialData> {
  const response = await suiClient.getObject({
    id: objectId,
    options: {
      showContent: true,
      showOwner: true,
    },
  });

  if (!response.data) {
    throw new Error('CREDENTIAL_NOT_FOUND');
  }

  const content = response.data.content;

  if (!content || content.dataType !== 'moveObject') {
    throw new Error('INVALID_OBJECT_TYPE');
  }

  if (!content.type.includes('::credential::Credential')) {
    throw new Error('NOT_A_CREDENTIAL');
  }

  const fields = content.fields as Record<string, unknown>;
  const timestamp = Number(fields.timestamp);

  const owner = response.data.owner;
  let ownerAddress = 'Unknown';
  if (owner && typeof owner === 'object' && 'AddressOwner' in owner) {
    ownerAddress = owner.AddressOwner as string;
  }

  return {
    objectId,
    volunteerName: fields.volunteer_name as string,
    projectOrEvent: fields.project_or_event as string,
    skillsVerified: fields.skills_verified as string[],
    issuerName: fields.issuer_name as string,
    issuerAddress: fields.issuer_address as string,
    timestamp,
    issuedAt: new Date(timestamp),
    ownerAddress,
  };
}

// ── Format date for display ───────────────────────────────────────────────────
export function formatIssuedDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ── Shorten a wallet address for display ──────────────────────────────────────
export function shortenAddress(address: string): string {
  if (address.length < 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// ── Build the Sui explorer URL for the credential object ──────────────────────
export function explorerUrl(objectId: string): string {
  return `https://suiscan.xyz/testnet/object/${objectId}`;
}

// ── Build the Sui explorer URL for a wallet address ───────────────────────────
export function addressExplorerUrl(address: string): string {
  return `https://suiscan.xyz/testnet/account/${address}`;
}
