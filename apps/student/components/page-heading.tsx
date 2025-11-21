'use client';

interface PageHeadingProps {
  name: string;
}

export function PageHeading({ name }: PageHeadingProps) {
  return (
    <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
      <p className="text-4xl font-black leading-tight tracking-[-0.033em] text-neutral-text">
        Welcome back, {name}!
      </p>
    </header>
  );
}
