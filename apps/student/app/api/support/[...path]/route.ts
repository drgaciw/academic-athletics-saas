import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { getSupportServiceUrl, toAiUserRole } from '@/lib/services';

export const runtime = 'nodejs';

type RouteParams = { params: Promise<{ path: string[] }> };

async function proxySupportRequest(req: NextRequest, params: RouteParams['params']) {
  const { userId, getToken } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  const user = await currentUser();
  const role = toAiUserRole(user?.publicMetadata?.role as string | undefined);
  const { path } = await params;
  const subPath = path.join('/');
  const url = new URL(req.url);
  const serviceUrl = getSupportServiceUrl();
  const targetUrl = `${serviceUrl}/api/support/${subPath}${url.search}`;

  const correlationId = crypto.randomUUID();
  const headers: Record<string, string> = {
    'X-User-Id': userId,
    'X-User-Role': role,
    'X-Correlation-Id': correlationId,
  };
  const token = await getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const contentType = req.headers.get('content-type');
  if (contentType) {
    headers['Content-Type'] = contentType;
  }

  const init: RequestInit = {
    method: req.method,
    headers,
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = await req.text();
  }

  const response = await fetch(targetUrl, init);

  let data: unknown = null;
  const responseType = response.headers.get('content-type') ?? '';
  if (responseType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = { error: { code: 'UPSTREAM', message: 'Support service returned invalid JSON' } };
    }
  } else {
    data = { error: { code: 'UPSTREAM', message: 'Support service returned a non-JSON response' } };
  }

  return NextResponse.json(data, {
    status: response.status,
    headers: {
      'X-Request-Id': correlationId,
    },
  });
}

export async function GET(req: NextRequest, context: RouteParams) {
  return proxySupportRequest(req, context.params);
}

export async function POST(req: NextRequest, context: RouteParams) {
  return proxySupportRequest(req, context.params);
}

export async function PUT(req: NextRequest, context: RouteParams) {
  return proxySupportRequest(req, context.params);
}

export async function PATCH(req: NextRequest, context: RouteParams) {
  return proxySupportRequest(req, context.params);
}

export async function DELETE(req: NextRequest, context: RouteParams) {
  return proxySupportRequest(req, context.params);
}
