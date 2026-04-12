import type { Metadata } from 'next';
import { ZkLoginButton } from '@/components/ZkLoginButton';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Sign In · suignature',
  description: 'Sign in with Google to access your verifiable credentials dashboard.',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800/50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/" className="text-lg font-bold text-white hover:text-gray-200 transition-colors">
            suignature
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center space-y-8">
          {/* Logo / Brand */}
          <div className="space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-indigo-600 to-cyan-500 flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/20">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold">Welcome to suignature</h1>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm mx-auto">
              Sign in to access your verifiable credentials dashboard.
              Your Sui identity is created automatically — no wallet needed.
            </p>
          </div>

          {/* Login Card */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-8 space-y-6">
            <div className="flex justify-center">
              <ZkLoginButton />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-800" />
              <span className="text-xs text-gray-500">or</span>
              <div className="flex-1 h-px bg-gray-800" />
            </div>

            <Link
              href="/issue"
              className="block w-full py-3 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 text-sm font-medium transition-colors text-center"
            >
              Issue credentials with wallet →
            </Link>
          </div>

          {/* Info */}
          <div className="space-y-3">
            <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
              By signing in, you agree to our Terms of Service. Your Google account
              is used to create a unique Sui blockchain identity — we never see your
              password.
            </p>
            <div className="flex items-center justify-center gap-4 text-xs text-gray-600">
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                End-to-end encrypted
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Powered by Sui zkLogin
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
