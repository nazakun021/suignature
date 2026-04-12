import { suiClient } from './sui';
import { SUI_CONFIG } from './constants';

export interface OwnedCredential {
  objectId: string;
  volunteerName: string;
  projectOrEvent: string;
  skillsVerified: string[];
  issuerName: string;
  issuerAddress: string;
  timestamp: number;
  issuedAt: Date;
}

/**
 * Fetches all Credential objects owned by a given Sui address.
 * Uses the on-chain struct type filter to only return suignature credentials.
 */
export async function fetchUserCredentials(
  address: string,
): Promise<OwnedCredential[]> {
  const structType = `${SUI_CONFIG.packageId}::credential::Credential`;

  const response = await suiClient.getOwnedObjects({
    owner: address,
    filter: { StructType: structType },
    options: { showContent: true },
  });

  return response.data
    .map((obj) => {
      const content = obj.data?.content;
      if (!content || content.dataType !== 'moveObject') return null;

      const fields = content.fields as Record<string, unknown>;
      const timestamp = Number(fields.timestamp);

      return {
        objectId: obj.data!.objectId,
        volunteerName: fields.volunteer_name as string,
        projectOrEvent: fields.project_or_event as string,
        skillsVerified: fields.skills_verified as string[],
        issuerName: fields.issuer_name as string,
        issuerAddress: fields.issuer_address as string,
        timestamp,
        issuedAt: new Date(timestamp),
      };
    })
    .filter((cred): cred is OwnedCredential => cred !== null)
    .sort((a, b) => b.timestamp - a.timestamp);
}
