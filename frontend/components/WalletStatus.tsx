'use client';

import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';

export function WalletStatus() {
  const account = useCurrentAccount();

  return (
    <div className="flex items-center gap-3">
      {account ? (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm text-gray-300 font-mono">
            {account.address.slice(0, 6)}...{account.address.slice(-4)}
          </span>
          <ConnectButton />
        </div>
      ) : (
        <ConnectButton />
      )}
    </div>
  );
}
