import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { getSupportServiceUrl, toAiUserRole } from '@/lib/services';
import { getStudentByClerkId } from '@/lib/student-data';

export const runtime = 'nodejs';

type RouteParams = { params: Promise<{ path: string[] }> };

/** Path patterns where the final segment is a studentProfile id. */
const STUDENT_SCOPED_PATH =
  /^(tutoring\/sessions|study-hall\/attendance|study-hall\/stats|workshop\/registrations|mentoring\/matches)\/([^/]+)$/;

function collectRequestedStudentIds(
  subPath: string,
  searchParams: URLSearchParams,
  bodyText: string | null
): string[] {
  const ids = new Set<string>();

  const pathMatch = subPath.match(STUDENT_SCOPED_PATH);
  if (pathMatch?.[2]) {
    ids.add(pathMatch[2]);
  }

  const queryStudentId = searchParams.get('studentId');
  if (queryStudentId) {
    ids.add(queryStudentId);
  }

  if (bodyText) {
    try {
      const parsed = JSON.parse(bodyText) as { studentId?: unknown; menteeId?: unknown };
      if (typeof parsed.studentId === 'string' && parsed.studentId.length > 0) {
        ids.add(parsed.studentId);
      }
      if (typeof parsed.menteeId === 'string' && parsed.menteeId.length > 0) {
        ids.add(parsed.menteeId);
      }
    } catch {
      // Non-JSON bodies are forwarded unchanged; upstream validation handles them.
    }
  }

  return [...ids];
}

async function proxySupportRequest(req: NextRequest, params: RouteParams['params']) {
  const clerkAuth = await auth();
  const { userId } = clerkAuth;
  if (!userId) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  const student = await getStudentByClerkId(userId);
  const ownProfileId = student?.studentProfile?.id;
  if (!ownProfileId) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Student profile required' } },
      { status: 403 }
    );
  }

  const user = await currentUser();
  const role = toAiUserRole(user?.publicMetadata?.role as string | undefined);
  const { path } = await params;
  const subPath = path.join('/');
  const url = new URL(req.url);
  const serviceUrl = getSupportServiceUrl();
  const targetUrl = `${serviceUrl}/api/support/${subPath}${url.search}`;

  let bodyText: string | null = null;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    bodyText = await req.text();
  }

  const requestedIds = collectRequestedStudentIds(subPath, url.searchParams, bodyText);
  if (requestedIds.some((id) => id !== ownProfileId)) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'You can only access your own student support records' } },
      { status: 403 }
    );
  }

  const correlationId = crypto.randomUUID();
  const headers: Record<string, string> = {
    'X-User-Id': userId,
    'X-User-Role': role,
    'X-Correlation-Id': correlationId,
  };

  const token = await clerkAuth.getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const contentType = req.headers.get('content-type');
  if (contentType) {
    headers['Content-Type'] = contentType;
  }

  const init: RequestInit = {
    method: req.method,
    headers,
  };

  if (bodyText !== null) {
    init.body = bodyText;
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
