'use client';

import { useCurrentAccount, ConnectButton } from '@mysten/dapp-kit';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SiteHeaderProps {
  theme?: 'dark' | 'light';
}

export function SiteHeader({ theme = 'dark' }: SiteHeaderProps) {
  const account = useCurrentAccount();
  const pathname = usePathname();

  const isDark = theme === 'dark';

  return (
    <header className={`border-b ${isDark ? 'bg-gray-950 border-gray-800/50' : 'bg-white border-gray-200'}`}>
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <h1 className={`text-lg font-bold tracking-tight transition-colors ${isDark ? 'text-white' : 'text-gray-900 group-hover:text-indigo-600'}`}>
              suignature
            </h1>
            <span className={`text-[10px] rounded-full px-2 py-0.5 ${isDark ? 'text-gray-500 bg-gray-800' : 'text-indigo-600 bg-indigo-50'}`}>
              beta
            </span>
          </Link>

          <nav className="hidden sm:flex items-center gap-6 ml-8">
            <Link
              href="/issue"
              className={`text-sm font-medium transition-colors ${
                pathname === '/issue'
                  ? 'text-indigo-500'
                  : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Issue
            </Link>
            {account && (
              <Link
                href="/dashboard"
                className={`text-sm font-medium transition-colors ${
                  pathname === '/dashboard'
                    ? 'text-indigo-500'
                    : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                My Credentials
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}
