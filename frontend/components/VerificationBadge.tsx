interface VerificationBadgeProps {
  size?: 'sm' | 'md' | 'lg';
}

export function VerificationBadge({ size = 'md' }: VerificationBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-3 py-1 text-xs gap-1.5',
    lg: 'px-4 py-1.5 text-sm gap-2',
  };

  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div
      className={`inline-flex items-center font-semibold rounded-full border border-green-200 bg-green-50 text-green-700 ${sizeClasses[size]}`}
    >
      <div className={`rounded-full bg-green-500 ${dotSizes[size]}`} />
      <span>Verified on Sui</span>
      <svg
        className={`${iconSizes[size]} text-indigo-400`}
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
      </svg>
    </div>
  );
}
