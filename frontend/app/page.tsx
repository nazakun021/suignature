import Link from 'next/link';
import { VerificationBadge } from '@/components/VerificationBadge';
import { SiteHeader } from '@/components/SiteHeader';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <SiteHeader theme="dark" />

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-linear-to-b from-indigo-950/20 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 py-24 sm:py-32 text-center relative">
          <div className="inline-flex items-center gap-2 mb-6 text-xs text-gray-400 bg-gray-800/50 rounded-full px-4 py-2 border border-gray-700/50">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Live on Sui Testnet
          </div>

          <h2 className="text-4xl sm:text-6xl font-bold tracking-tight leading-tight">
            Your community work,{' '}
            <span className="bg-linear-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              verified forever.
            </span>
          </h2>

          <p className="text-lg text-gray-400 max-w-2xl mx-auto mt-6 leading-relaxed">
            Organizations issue cryptographically verified credentials to volunteers.
            Volunteers build a public, portable proof-of-work portfolio directly on-chain.
            Recruiters verify instantly — no crypto knowledge required.
          </p>

          {/* Dual CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <Link
              href="/issue"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/20"
            >
              Issue a Credential
            </Link>
            <a
              href="https://suiscan.xyz/testnet"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold text-sm border border-gray-700 transition-all duration-200"
            >
              Browse Network ↗
            </a>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-gray-800/50">
        <div className="max-w-5xl mx-auto px-4 py-20">
          <h3 className="text-2xl font-bold text-center mb-4">How It Works</h3>
          <p className="text-gray-400 text-center text-sm mb-12 max-w-lg mx-auto">
            Three steps. No wallets, no seed phrases, no crypto jargon.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StepCard
              step={1}
              title="Organization Issues"
              description="A trusted organization verifies your work and issues a soulbound credential directly to your identity."
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              }
            />
            <StepCard
              step={2}
              title="You Receive It"
              description="The credential appears in your public portfolio. It is permanently linked to your wallet address."
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              }
            />
            <StepCard
              step={3}
              title="Anyone Verifies"
              description="Share a single link. Recruiters see a clean certificate — no account needed, no blockchain knowledge required."
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="border-t border-gray-800/50 bg-gray-900/30">
        <div className="max-w-4xl mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold mb-4">Why Blockchain?</h3>
            <p className="text-gray-400 text-sm max-w-lg mx-auto">
              Not for complexity — for trust. Here&apos;s what the blockchain guarantees that
              a PDF certificate never can.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <TrustCard
              title="Can't be faked"
              description="Every credential is cryptographically signed by the issuing organization. The signature is impossible to forge."
            />
            <TrustCard
              title="Can't be transferred"
              description="Credentials are soulbound — permanently locked to the recipient. They can't be sold, traded, or given away."
            />
            <TrustCard
              title="Can't be deleted"
              description="Once issued, the credential exists permanently on the blockchain. Not even the issuer can remove it."
            />
            <TrustCard
              title="Always verifiable"
              description="Anyone with the link can verify the credential instantly. No account needed. Works forever."
            />
          </div>

          <div className="mt-10 flex justify-center">
            <VerificationBadge size="lg" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800/50">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-gray-500">suignature</span>
            <span className="text-xs text-gray-600">
              Verifiable Proof of Work
            </span>
          </div>
          <div className="flex items-center gap-6 text-xs text-gray-500">
            <Link href="/issue" className="hover:text-gray-300 transition-colors">
              Issue Credentials
            </Link>
            <a
              href="https://github.com/nazakun021/suignature"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-300 transition-colors"
            >
              GitHub
            </a>
            <span>Built on Sui · Sui Builders Program Davao 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function StepCard({
  step,
  title,
  description,
  icon,
}: {
  step: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/30 p-6 space-y-4 hover:border-gray-700 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-600/10 flex items-center justify-center text-indigo-400">
          {icon}
        </div>
        <span className="text-xs text-gray-500 font-semibold">Step {step}</span>
      </div>
      <h4 className="text-lg font-semibold text-white">{title}</h4>
      <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}

function TrustCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/20 p-6 space-y-2">
      <h4 className="text-sm font-semibold text-white">{title}</h4>
      <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}
