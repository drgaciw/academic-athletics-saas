import { NextResponse } from 'next/server';

/**
 * Health check endpoint for Student Portal
 * GET /api/health
 */
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    zone: 'student',
    timestamp: new Date().toISOString(),
  });
}
