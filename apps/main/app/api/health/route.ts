import { NextResponse } from 'next/server';

interface ZoneHealth {
  zone: string;
  status: 'healthy' | 'unhealthy' | 'unreachable';
  responseTime?: number;
  error?: string;
}

interface HealthCheckResponse {
  zones: ZoneHealth[];
  overall: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
}

/**
 * Health check endpoint for all zones
 * GET /api/health
 */
export async function GET() {
  const zones = [
    { name: 'student', url: process.env.STUDENT_PORTAL_URL || 'http://localhost:3001' },
    { name: 'admin', url: process.env.ADMIN_PORTAL_URL || 'http://localhost:3002' },
    { name: 'docs', url: process.env.DOCS_APP_URL || 'http://localhost:3003' },
  ];

  const healthChecks = await Promise.all(
    zones.map(async (zone): Promise<ZoneHealth> => {
      const startTime = Date.now();
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await fetch(`${zone.url}/api/health`, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'AAH-Health-Check',
          },
        });

        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;

        return {
          zone: zone.name,
          status: response.ok ? 'healthy' : 'unhealthy',
          responseTime,
        };
      } catch (error) {
        const responseTime = Date.now() - startTime;
        
        return {
          zone: zone.name,
          status: 'unreachable',
          responseTime,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    })
  );

  // Determine overall health
  const healthyCount = healthChecks.filter((check) => check.status === 'healthy').length;
  const totalCount = healthChecks.length;
  
  let overall: 'healthy' | 'degraded' | 'unhealthy';
  if (healthyCount === totalCount) {
    overall = 'healthy';
  } else if (healthyCount > 0) {
    overall = 'degraded';
  } else {
    overall = 'unhealthy';
  }

  const response: HealthCheckResponse = {
    zones: healthChecks,
    overall,
    timestamp: new Date().toISOString(),
  };

  const statusCode = overall === 'healthy' ? 200 : 503;

  return NextResponse.json(response, { status: statusCode });
}
