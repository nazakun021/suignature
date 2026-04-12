import { NextResponse } from 'next/server';
import { Transaction } from '@mysten/sui/transactions';
import { createClient } from '@/lib/supabase/server';
import { sponsorTransactionBlock } from '@/lib/sponsor';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Parse specific credential request
    const body = await req.json();
    const { eventId, orgSlug, recipients } = body;
    // recipients is an array of { address, name, skills }

    if (!eventId || !orgSlug || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: 'Missing required payload data' }, { status: 400 });
    }

    // 1. Verify User is Org member
    const { data: orgData } = await supabase
      .from('organizations')
      .select('id, name, organization_members!inner(role)')
      .eq('slug', orgSlug)
      .eq('organization_members.user_id', user.id)
      .single();

    if (!orgData) {
      return NextResponse.json({ error: 'Organization not found or unauthorized' }, { status: 403 });
    }

    // 2. Verify Event belongs to Org and IS PAID
    const { data: eventData } = await supabase
      .from('events')
      .select('id, name, is_paid')
      .eq('id', eventId)
      .eq('org_id', orgData.id)
      .single();

    if (!eventData) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (!eventData.is_paid) {
      return NextResponse.json({ error: 'Cannot issue credentials for an unpaid event' }, { status: 402 });
    }

    // FETCH THE ISSUER'S SUI ADDRESS from Supabase (zkLogin derived address)
    const { data: issuerProfile } = await supabase
      .from('users')
      .select('sui_address, display_name, username')
      .eq('id', user.id)
      .single();

    if (!issuerProfile || !issuerProfile.sui_address) {
      return NextResponse.json({ error: 'Issuer has no linked Sui address' }, { status: 400 });
    }

    const issuerAddress = issuerProfile.sui_address;
    const issuerName = orgData.name; // Use Org Name as the issuer on-chain

    // 3. Build Programmable Transaction Block (PTB)
    const tx = new Transaction();
    tx.setSender(issuerAddress); // The transaction will be sent ON BEHALF OF the Org Admin

    const packageId = process.env.NEXT_PUBLIC_PACKAGE_ID!;
    const moduleName = process.env.NEXT_PUBLIC_MODULE_NAME!;
    const functionName = process.env.NEXT_PUBLIC_FUNCTION_NAME!;

    // Batch all issuances into ONE transaction loop to save gas
    for (const recipient of recipients) {
      // Basic validation
      if (!recipient.address || !recipient.name) continue;

      tx.moveCall({
        target: `${packageId}::${moduleName}::${functionName}`,
        arguments: [
          tx.pure.string(recipient.name),
          tx.pure.string(eventData.name),
          tx.pure.vector('string', recipient.skills || []),
          tx.pure.string(issuerName),
          tx.pure.address(issuerAddress),
          tx.pure.address(recipient.address),
        ],
      });
    }

    // Attempt to convert to base64 transaction bytes without setting gas limits.
    // We let Shinami do the heavy lifting.
    const txBytes = await tx.build({
      client: undefined, // Only works offline if we don't need object resolution
      onlyTransactionKind: true // Build purely the inner contents, letting Shinami wrap gas and budget
    });
    
    const { toBase64 } = await import('@mysten/sui/utils');
    const base64TxBytes = toBase64(txBytes);

    // 4. Request Shinami Gas Sponsorship
    // In Phase 2: Shinami pays, standard Gas limit set to 5M MIST
    try {
      const sponsoredTx = await sponsorTransactionBlock(
        base64TxBytes,
        issuerAddress,
        5_000_000 
      );
      
      // Return the Sponsored TX to the client.
      // The client MUST sign it using their active wallet (or Ephemeral keypair for zkLogin!)
      return NextResponse.json({ 
        success: true, 
        sponsoredTxBytes: sponsoredTx.txBytes,
        signature: sponsoredTx.signature // Shinami's service signature covering the Gas portion
      });

    } catch (shinamiError: unknown) {
      const errorMessage = shinamiError instanceof Error ? shinamiError.message : String(shinamiError);
      console.error('Shinami Sponsorship Error:', shinamiError);
      return NextResponse.json({ error: `Gas Sponsorship Failed: ${errorMessage || 'Unknown error'}` }, { status: 500 });
    }

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Issue Error:', error);
    return NextResponse.json({ error: msg || 'Internal Server Error' }, { status: 500 });
  }
}
