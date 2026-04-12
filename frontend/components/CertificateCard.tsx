'use client';

import { CredentialData, formatIssuedDate } from '@/lib/credential';
import { SkillBadge } from './SkillBadge';
import { CertificateQR } from './CertificateQR';

interface CertificateCardProps {
  credential: CredentialData;
}

export function CertificateCard({ credential }: CertificateCardProps) {
  const {
    objectId,
    volunteerName,
    projectOrEvent,
    skillsVerified,
    issuerName,
    issuedAt,
  } = credential;

  return (
    <div
      id="certificate-card"
      className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden"
    >
      {/* Certificate top accent bar */}
      <div className="h-1.5 w-full bg-linear-to-r from-indigo-600 via-violet-600 to-indigo-400" />

      <div className="p-6 sm:p-8 space-y-6">
        {/* Header: Logo + Verified badge */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest mb-1">
              Certificate of Verified Work
            </p>
            <h1 className="text-2xl font-bold text-gray-900">suignature</h1>
          </div>
          <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-3 py-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs font-semibold text-green-700">Verified</span>
          </div>
        </div>

        <div className="border-t border-gray-100" />

        {/* Main content + QR code side by side */}
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          {/* Left: Credential details */}
          <div className="flex-1 space-y-5">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">
                This certifies that
              </p>
              <p className="text-2xl font-bold text-gray-900">{volunteerName}</p>
            </div>

            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">
                Demonstrated verified contributions to
              </p>
              <p className="text-base font-semibold text-gray-800">{projectOrEvent}</p>
            </div>

            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">
                Verified and issued by
              </p>
              <p className="text-base font-semibold text-gray-800">{issuerName}</p>
            </div>

            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">
                Date of issuance
              </p>
              <p className="text-sm text-gray-700">{formatIssuedDate(issuedAt)}</p>
            </div>
          </div>

          {/* Right: QR Code */}
          <div className="shrink-0 self-center sm:self-start">
            <CertificateQR objectId={objectId} />
          </div>
        </div>

        {/* Skills */}
        {skillsVerified.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-gray-400 uppercase tracking-wide">
              Skills Verified
            </p>
            <div className="flex flex-wrap gap-2">
              {skillsVerified.map((skill) => (
                <SkillBadge key={skill} skill={skill} />
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-gray-100" />

        {/* Certificate footer */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
            This credential is cryptographically verified and permanently recorded.
            It cannot be forged, transferred, or revoked by anyone other than the original issuer.
          </p>
          <div className="flex items-center gap-1.5 shrink-0">
            <svg
              className="w-4 h-4 text-indigo-400"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
            <span className="text-xs text-gray-400">Verified on Sui</span>
          </div>
        </div>
      </div>
    </div>
  );
}
