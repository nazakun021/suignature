'use client';

import Link from 'next/link';
import { formatIssuedDate } from '@/lib/credential';

interface CredentialCardProps {
  objectId: string;
  volunteerName?: string;
  projectOrEvent: string;
  skillsVerified: string[];
  issuerName?: string;
  timestamp: number;
}

export function CredentialCard({
  objectId,
  volunteerName,
  projectOrEvent,
  skillsVerified,
  issuerName,
  timestamp,
}: CredentialCardProps) {
  const date = formatIssuedDate(new Date(timestamp));

  return (
    <Link
      href={`/verify/${objectId}`}
      className="group block rounded-xl border border-gray-200 bg-white p-5 shadow-sm
                 transition hover:border-indigo-300 hover:shadow-md"
    >
      {/* Top accent */}
      <div className="mb-3 h-1 w-10 rounded-full bg-linear-to-r from-indigo-500 to-cyan-400" />

      {/* Event name */}
      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
        {projectOrEvent}
      </p>

      {/* Who received / who issued — depends on context */}
      {volunteerName && (
        <p className="mt-1 text-sm font-medium text-gray-900">{volunteerName}</p>
      )}
      {issuerName && (
        <p className="mt-1 text-xs text-gray-500">Issued by {issuerName}</p>
      )}

      {/* Skills */}
      {skillsVerified.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {skillsVerified.slice(0, 3).map((skill) => (
            <span
              key={skill}
              className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700"
            >
              {skill}
            </span>
          ))}
          {skillsVerified.length > 3 && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
              +{skillsVerified.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Date + arrow */}
      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-gray-400">{date}</p>
        <span className="text-xs text-indigo-500 opacity-0 transition group-hover:opacity-100">
          View →
        </span>
      </div>
    </Link>
  );
}
