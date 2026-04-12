'use client';

import { useState } from 'react';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import Papa from 'papaparse';

interface BulkUploaderProps {
  eventId: string;
  orgSlug: string;
}

export function BulkUploader({ eventId, orgSlug }: BulkUploaderProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setStatus('Parsing CSV...');

    Papa.parse<{ name: string; address: string; skills: string }>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const recipients = results.data.map(row => ({
            name: row.name,
            address: row.address,
            skills: row.skills ? row.skills.split(',').map(s => s.trim()) : []
          }));

          setStatus(`Parsed ${recipients.length} recipients. Sponsoring tx...`);

          // Call our server endpoint to get a Shinami sponsored transaction
          const response = await fetch('/api/issue/sponsored', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eventId, orgSlug, recipients }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to sponsor transaction');
          }

          const { sponsoredTxBytes, signature: sponsorSignature } = await response.json();

          setStatus('Awaiting wallet signature...');

          // Reconstruct transaction from bytes
          const tx = Transaction.from(sponsoredTxBytes);

          // Prompt the Organization admin to sign the transaction via their wallet
          signAndExecute(
            {
              transaction: tx,
            },
            {
              onSuccess: () => {
                setStatus('Success! All credentials have been minted.');
                setLoading(false);
              },
              onError: (err) => {
                setStatus(`Signing failed: ${err.message}`);
                setLoading(false);
              },
            }
          );
        } catch (error: any) {
          setStatus(`Error: ${error.message}`);
          setLoading(false);
        }
      },
      error: (err) => {
        setStatus(`CSV Parse Error: ${err.message}`);
        setLoading(false);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center w-full">
        <label className={`flex flex-col items-center justify-center w-full h-32 border-2 ${loading ? 'border-indigo-300' : 'border-gray-300 border-dashed'} rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100`}>
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
            </svg>
            <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">{loading ? 'Processing...' : 'Click to upload CSV'}</span> do not drag and drop yet</p>
            <p className="text-xs text-gray-500">Must include headers: `name`, `address`, `skills` (comma separated)</p>
          </div>
          <input id="dropzone-file" type="file" accept=".csv" className="hidden" disabled={loading} onChange={handleFileUpload} />
        </label>
      </div>
      {status && (
        <div className={`text-sm p-3 rounded text-center ${status.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'}`}>
          {status}
        </div>
      )}
    </div>
  );
}
