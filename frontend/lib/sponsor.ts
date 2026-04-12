export async function sponsorTransactionBlock(txBytes: string, sender: string, budget: number = 5000000) {
  const apiKey = process.env.SHINAMI_GAS_KEY;
  if (!apiKey) {
    throw new Error("Missing SHINAMI_GAS_KEY in environment variables.");
  }

  // Shinami RPC endpoint for Gas Station v1
  const rpcUrl = `https://api.shinami.com/gas/v1/${apiKey}`;

  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'gas_sponsorTransactionBlock',
      params: [txBytes, sender, budget],
    }),
  });

  if (!response.ok) {
    throw new Error(`Shinami API HTTP error: ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.error) {
    throw new Error(`Shinami RPC error: ${data.error.message}`);
  }

  return data.result as { txBytes: string; signature: string };
}
