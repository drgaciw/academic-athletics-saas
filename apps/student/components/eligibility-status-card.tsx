'use client';

interface EligibilityStatusCardProps {
  status: string;
  details: string;
}

export function EligibilityStatusCard({
  status,
  details,
}: EligibilityStatusCardProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl bg-white p-6 text-center">
      <p className="mb-3 text-lg font-bold leading-tight tracking-[-0.015em] text-neutral-text">
        NCAA Eligibility
      </p>
      <div className="mb-3 inline-flex items-center justify-center rounded-full bg-status-green/10 px-4 py-1.5 text-status-green">
        <p className="text-base font-bold uppercase tracking-wider">{status}</p>
      </div>
      <p className="max-w-xs text-sm font-normal leading-normal text-gray-500">
        {details}
      </p>
    </div>
  );
}
