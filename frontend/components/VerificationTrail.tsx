import { shortenAddress, addressExplorerUrl, explorerUrl } from '@/lib/credential';

interface VerificationTrailProps {
  issuerName: string;
  issuerAddress: string;
  volunteerName: string;
  ownerAddress: string;
  objectId: string;
  issuedAt: Date;
}

export function VerificationTrail({
  issuerName,
  issuerAddress,
  volunteerName,
  ownerAddress,
  objectId,
  issuedAt,
}: VerificationTrailProps) {
  const formattedDate = issuedAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-sm font-semibold text-gray-700">
            Verification Trail
          </span>
          <span className="text-xs text-gray-400 ml-auto">
            Recorded on Sui Blockchain
          </span>
        </div>
      </div>

      {/* Trail Steps */}
      <div className="px-5 py-4 space-y-4">
        <TrailStep
          step={1}
          label="Issued by"
          name={issuerName}
          address={issuerAddress}
          description="The organization that verified and signed this credential"
        />

        <div className="ml-4 w-px h-4 bg-gray-300" />

        <TrailStep
          step={2}
          label="Issued to"
          name={volunteerName}
          address={ownerAddress}
          description="The individual whose work is being recognized"
        />

        <div className="ml-4 w-px h-4 bg-gray-300" />

        {/* Step 3: Timestamp */}
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0 text-xs font-bold text-gray-500">
            3
          </div>
          <div className="space-y-0.5 pt-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Date &amp; Time of Issuance
            </p>
            <p className="text-sm font-medium text-gray-800">{formattedDate}</p>
            <p className="text-xs text-gray-400">
              Timestamp is permanently recorded and cannot be altered
            </p>
          </div>
        </div>
      </div>

      {/* Footer: Blockchain record link */}
      <div className="px-5 py-3 border-t border-gray-200 bg-white">
        <a
          href={explorerUrl(objectId)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-400 hover:text-indigo-600 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          View original blockchain record
        </a>
      </div>
    </div>
  );
}

function TrailStep({
  step,
  label,
  name,
  address,
  description,
}: {
  step: number;
  label: string;
  name: string;
  address: string;
  description: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 text-xs font-bold text-indigo-600">
        {step}
      </div>
      <div className="space-y-0.5 pt-1 min-w-0">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {label}
        </p>
        <p className="text-sm font-semibold text-gray-900">{name}</p>
        <a
          href={addressExplorerUrl(address)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-400 hover:text-indigo-600 font-mono transition-colors cursor-pointer"
        >
          {shortenAddress(address)} ↗
        </a>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
    </div>
  );
}
