import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { getAiServiceUrl, toAiUserRole } from '@/lib/services';

export const runtime = 'nodejs';

interface ChatRequestBody {
  message?: string;
  conversationId?: string;
  messages?: Array<{ role: string; content?: string; parts?: Array<{ type: string; text?: string }> }>;
}

function extractMessage(body: ChatRequestBody): string | null {
  if (body.message?.trim()) {
    return body.message.trim();
  }

  const lastUser = [...(body.messages ?? [])].reverse().find((message) => message.role === 'user');
  if (!lastUser) {
    return null;
  }

  if (lastUser.content?.trim()) {
    return lastUser.content.trim();
  }

  const textPart = lastUser.parts?.find((part) => part.type === 'text' && part.text?.trim());
  return textPart?.text?.trim() ?? null;
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
  }

  const user = await currentUser();
  const role = toAiUserRole(user?.publicMetadata?.role as string | undefined);

  let body: ChatRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: { code: 'INVALID_JSON', message: 'Invalid request body' } }, { status: 400 });
  }

  const message = extractMessage(body);
  if (!message) {
    return NextResponse.json({ error: { code: 'VALIDATION', message: 'Message is required' } }, { status: 400 });
  }

  const correlationId = crypto.randomUUID();
  const serviceUrl = getAiServiceUrl();

  const response = await fetch(`${serviceUrl}/api/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': userId,
      'X-User-Role': role,
      'X-Correlation-Id': correlationId,
    },
    body: JSON.stringify({
      message,
      userId,
      conversationId: body.conversationId,
      stream: false,
    }),
  });

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    data = { error: { code: 'UPSTREAM', message: 'AI service returned a non-JSON response' } };
  }

  return NextResponse.json(data, {
    status: response.status,
    headers: {
      'X-Request-Id': correlationId,
    },
  });
}
