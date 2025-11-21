'use client';

interface AcademicOverviewCardProps {
  gpa: number;
  totalCredits: number;
  degreeCompletion: number;
}

export function AcademicOverviewCard({
  gpa,
  totalCredits,
  degreeCompletion,
}: AcademicOverviewCardProps) {
  return (
    <div className="flex flex-col justify-between rounded-xl bg-white p-6">
      <div>
        <p className="mb-4 text-lg font-bold leading-tight tracking-[-0.015em] text-neutral-text">
          Academic Overview
        </p>
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <p className="text-sm font-normal text-gray-500">Current GPA</p>
            <p className="text-2xl font-bold text-neutral-text">{gpa}</p>
          </div>
          <div className="flex flex-col">
            <p className="text-sm font-normal text-gray-500">Total Credits</p>
            <p className="text-2xl font-bold text-neutral-text">
              {totalCredits}
            </p>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex justify-between gap-6">
          <p className="text-sm font-medium leading-normal text-neutral-text">
            Degree Completion
          </p>
          <p className="text-sm font-bold leading-normal text-primary">
            {degreeCompletion}%
          </p>
        </div>
        <div className="rounded-full bg-gray-200">
          <div
            className="h-2 rounded-full bg-primary"
            style={{ width: `${degreeCompletion}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
