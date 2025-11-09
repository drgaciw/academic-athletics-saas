import { NextResponse } from 'next/server';

/**
 * Health check endpoint for Admin Portal
 * GET /api/health
 */
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    zone: 'admin',
    timestamp: new Date().toISOString(),
  });
}
