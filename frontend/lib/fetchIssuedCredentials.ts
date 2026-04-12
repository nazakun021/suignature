import { suiClient } from './sui';
import { SUI_CONFIG } from './constants';

export interface IssuedCredentialSummary {
  objectId: string;
  volunteerName: string;
  projectOrEvent: string;
  skillsVerified: string[];
  recipientAddress: string;
  timestamp: number;
}

/**
 * Fetches all credentials issued by a given Sui address.
 * Queries transaction blocks where the address called issue_credential,
 * then batch-fetches the created Credential objects.
 */
export async function fetchIssuedCredentials(
  issuerAddress: string,
): Promise<IssuedCredentialSummary[]> {
  // Step 1: Find all txs where this address called issue_credential
  const txBlocks = await suiClient.queryTransactionBlocks({
    filter: {
      MoveFunction: {
        package: SUI_CONFIG.packageId,
        module: 'credential',
        function: 'issue_credential',
      },
    },
    options: {
      showEffects: true,
    },
    limit: 50,
  });

  // Step 2: From each tx's effects, collect created object IDs
  const objectIds: string[] = [];
  for (const tx of txBlocks.data) {
    const created = tx.effects?.created ?? [];
    for (const obj of created) {
      if (typeof obj.reference?.objectId === 'string') {
        objectIds.push(obj.reference.objectId);
      }
    }
  }

  if (objectIds.length === 0) return [];

  // Step 3: Batch fetch the full objects
  const objects = await suiClient.multiGetObjects({
    ids: objectIds,
    options: { showContent: true, showOwner: true },
  });

  // Step 4: Parse each object into a summary, filter by issuer
  const credentials: IssuedCredentialSummary[] = [];
  for (const obj of objects) {
    if (obj.data?.content?.dataType !== 'moveObject') continue;

    const type = obj.data.content.type as string;
    if (!type.includes('::credential::Credential')) continue;

    const fields = obj.data.content.fields as Record<string, unknown>;

    // Only include credentials actually issued by this address
    const credIssuerAddress = fields.issuer_address as string;
    if (credIssuerAddress !== issuerAddress) continue;

    const owner = obj.data.owner;
    let recipientAddress = '';
    if (owner && typeof owner === 'object' && 'AddressOwner' in owner) {
      recipientAddress = (owner as { AddressOwner: string }).AddressOwner;
    }

    credentials.push({
      objectId: obj.data.objectId,
      volunteerName: fields.volunteer_name as string,
      projectOrEvent: fields.project_or_event as string,
      skillsVerified: (fields.skills_verified as string[]) ?? [],
      recipientAddress,
      timestamp: Number(fields.timestamp),
    });
  }

  return credentials.sort((a, b) => b.timestamp - a.timestamp);
}
