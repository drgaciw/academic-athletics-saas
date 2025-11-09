import { ReactNode } from 'react';

export const metadata = {
  title: 'AI Evaluations | Athletic Academics Hub',
  description: 'Monitor and manage AI model evaluations, baselines, and datasets',
};

export default function EvalsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}
