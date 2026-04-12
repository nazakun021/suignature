'use client';

import { useEffect, useState } from 'react';
import { fetchUserCredentials, type OwnedCredential } from '@/lib/fetchUserCredentials';
import { PortfolioGrid } from '@/components/PortfolioGrid';
import { VerificationBadge } from '@/components/VerificationBadge';
import Link from 'next/link';

interface UserProfile {
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  social_links: Record<string, string> | null;
  sui_address: string;
  created_at: string;
}

interface PortfolioPageClientProps {
  username: string;
}

type PageState = 'loading' | 'not_found' | 'success';

export function PortfolioPageClient({ username }: PortfolioPageClientProps) {
  const [state, setState] = useState<PageState>('loading');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [credentials, setCredentials] = useState<OwnedCredential[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch(`/api/users/${username}`);
        if (!response.ok) {
          setState('not_found');
          return;
        }

        const data = await response.json();
        setProfile(data);

        // Fetch credentials for this user's Sui address
        const creds = await fetchUserCredentials(data.sui_address);
        setCredentials(creds);
        setState('success');
      } catch {
        setState('not_found');
      }
    }

    load();
  }, [username]);

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  if (state === 'not_found' || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800">User Not Found</h2>
          <p className="text-sm text-gray-500">
            No portfolio exists for <span className="font-mono text-gray-700">@{username}</span>
          </p>
          <Link href="/" className="text-sm text-indigo-600 hover:text-indigo-500 transition-colors">
            ← Back to suignature
          </Link>
        </div>
      </div>
    );
  }

  const displayName = profile.display_name || `@${profile.username}`;
  const socialLinks = profile.social_links || {};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-base font-bold text-gray-900 hover:text-gray-700 transition-colors">
            suignature
          </Link>
          <VerificationBadge size="sm" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        {/* Profile Header */}
        <div className="text-center space-y-4">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-linear-to-br from-indigo-500 to-cyan-400 flex items-center justify-center mx-auto text-white text-2xl font-bold shadow-lg">
            {displayName.charAt(0).toUpperCase()}
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
            <p className="text-sm text-gray-500">@{profile.username}</p>
          </div>

          {profile.bio && (
            <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
              {profile.bio}
            </p>
          )}

          {/* Social Links */}
          {Object.keys(socialLinks).length > 0 && (
            <div className="flex items-center justify-center gap-3">
              {socialLinks.linkedin && (
                <SocialLink href={socialLinks.linkedin} label="LinkedIn" />
              )}
              {socialLinks.github && (
                <SocialLink href={socialLinks.github} label="GitHub" />
              )}
              {socialLinks.twitter && (
                <SocialLink href={socialLinks.twitter} label="Twitter" />
              )}
            </div>
          )}
        </div>

        {/* Credentials */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Verified Credentials ({credentials.length})
            </h2>
          </div>

          <PortfolioGrid credentials={credentials} showLinks />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 py-5 flex items-center justify-between">
          <p className="text-xs text-gray-400">suignature · Verifiable Proof of Work</p>
          <p className="text-xs text-gray-400">Built on Sui</p>
        </div>
      </footer>
    </div>
  );
}

function SocialLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs text-gray-500 hover:text-indigo-600 transition-colors flex items-center gap-1"
    >
      {label} ↗
    </a>
  );
}
