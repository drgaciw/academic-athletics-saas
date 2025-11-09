'use client';

import { useEffect, useRef } from 'react';

interface CrossZoneLinkProps {
  href: string;
  children: React.ReactNode;
  prefetch?: boolean;
  openInNewTab?: boolean;
  className?: string;
}

export function CrossZoneLink({
  href,
  children,
  prefetch = true,
  openInNewTab = false,
  className,
}: CrossZoneLinkProps) {
  const linkRef = useRef<HTMLAnchorElement>(null);
  
  useEffect(() => {
    if (!prefetch || !linkRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Prefetch the target zone
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = href;
            document.head.appendChild(link);
            
            observer.disconnect();
          }
        });
      },
      { rootMargin: '50px' }
    );
    
    observer.observe(linkRef.current);
    
    return () => observer.disconnect();
  }, [href, prefetch]);
  
  return (
    <a
      ref={linkRef}
      href={href}
      target={openInNewTab ? '_blank' : undefined}
      rel={openInNewTab ? 'noopener noreferrer' : undefined}
      className={className}
    >
      {children}
    </a>
  );
}
