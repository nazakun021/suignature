import { formatIssuedDate, explorerUrl } from '@/lib/credential';
import { SkillBadge } from './SkillBadge';
import type { OwnedCredential } from '@/lib/fetchUserCredentials';

interface PortfolioGridProps {
  credentials: OwnedCredential[];
  showLinks?: boolean;
}

export function PortfolioGrid({ credentials, showLinks = true }: PortfolioGridProps) {
  if (credentials.length === 0) {
    return (
      <div className="text-center py-16 space-y-3">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <p className="text-sm text-gray-500">No credentials yet</p>
        <p className="text-xs text-gray-400">
          Credentials will appear here when issued by an organization.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {credentials.map((cred) => (
        <CredentialGridCard
          key={cred.objectId}
          credential={cred}
          showLink={showLinks}
        />
      ))}
    </div>
  );
}

function CredentialGridCard({
  credential,
  showLink,
}: {
  credential: OwnedCredential;
  showLink: boolean;
}) {
  const { objectId, volunteerName, projectOrEvent, skillsVerified, issuerName, issuedAt } =
    credential;

  const card = (
    <div className="group rounded-xl border border-gray-200 bg-white hover:border-indigo-200 hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Accent bar */}
      <div className="h-1 w-full bg-linear-to-r from-indigo-500 to-cyan-400" />

      <div className="p-5 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {projectOrEvent}
            </p>
            <p className="text-xs text-gray-500">{issuerName}</p>
          </div>
          <VerificationBadgeSmall />
        </div>

        {/* Recipient */}
        <p className="text-xs text-gray-400">
          Issued to <span className="text-gray-600 font-medium">{volunteerName}</span>
        </p>

        {/* Skills */}
        {skillsVerified.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {skillsVerified.slice(0, 3).map((skill) => (
              <SkillBadge key={skill} skill={skill} />
            ))}
            {skillsVerified.length > 3 && (
              <span className="text-xs text-gray-400 self-center">
                +{skillsVerified.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-gray-100">
          <p className="text-xs text-gray-400">{formatIssuedDate(issuedAt)}</p>
          {showLink && (
            <a
              href={explorerUrl(objectId)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-indigo-600 transition-colors"
            >
              View on-chain ↗
            </a>
          )}
        </div>
      </div>
    </div>
  );

  if (showLink) {
    return (
      <a href={`/verify/${objectId}`} className="block">
        {card}
      </a>
    );
  }

  return card;
}

function VerificationBadgeSmall() {
  return (
    <div className="flex items-center gap-1 bg-green-50 border border-green-200 rounded-full px-2 py-0.5 shrink-0">
      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
      <span className="text-[10px] font-semibold text-green-700">Verified</span>
    </div>
  );
}
