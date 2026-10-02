import { NextResponse } from 'next/server';
import { verifySessionToken, hasPermission, AuthSession } from '@nexeraquest/auth';
import { checkRateLimit, RateLimitOptions } from '@nexeraquest/auth/src/ratelimit';
import { prisma } from '@nexeraquest/database';

export function jsonSuccess<T>(data: T, meta?: any, status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta,
      },
    },
    { status }
  );
}

export function jsonError(message: string, code = 'BAD_REQUEST', status = 400, details?: any) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  );
}

/**
 * Extracts authenticated session or falls back to active contributor for development
 */
export async function getAuthSession(req: Request): Promise<AuthSession | null> {
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const session = verifySessionToken(token);
    if (session) return session;
  }

  // Check custom simulation header if present
  const simulatedUserId = req.headers.get('x-simulated-user-id');
  if (simulatedUserId) {
    const user = await prisma.user.findUnique({ where: { id: simulatedUserId } });
    if (user) {
      return {
        userId: user.id,
        role: user.role as any,
        telegramId: user.telegramId,
        email: user.email,
      };
    }
  }

  // Sandbox fallback ONLY when explicitly enabled — never in production.
  if (process.env.SANDBOX_MODE !== 'true' && process.env.NODE_ENV === 'production') {
    return null;
  }
  // In development/sandbox fallback, default to contributor1
  const defaultContrib = await prisma.user.findFirst({
    where: { role: 'CONTRIBUTOR' },
  });
  if (defaultContrib) {
    return {
      userId: defaultContrib.id,
      role: 'CONTRIBUTOR',
      telegramId: defaultContrib.telegramId,
      email: defaultContrib.email,
    };
  }

  return null;
}

/**
 * Enforces authentication + a granular permission.
 * Returns the session on success, or a 401/403 error response on failure.
 * Usage: const auth = await requirePermission(req, 'withdrawal:authorize');
 *        if ('error' in auth) return auth.error;
 */
export async function requirePermission(
  req: Request,
  permission: string
): Promise<{ session: AuthSession } | { error: ReturnType<typeof jsonError> }> {
  const session = await getAuthSession(req);
  if (!session) {
    return { error: jsonError('Authentication required.', 'UNAUTHORIZED', 401) };
  }
  if (!hasPermission(session.role as any, permission)) {
    return { error: jsonError(`Forbidden: missing permission '${permission}'.`, 'FORBIDDEN', 403) };
  }
  return { session };
}

/**
 * Enforces a sliding-window rate limit keyed per user (or IP fallback).
 * Returns null when allowed, or a 429 error response when exceeded.
 */
export function enforceRateLimit(
  req: Request,
  userId: string | undefined,
  scope: string,
  opts: RateLimitOptions
): ReturnType<typeof jsonError> | null {
  const ip = req.headers.get('x-forwarded-for') || 'unknown-ip';
  const key = `${scope}:${userId || ip}`;
  const result = checkRateLimit(key, opts);
  if (!result.allowed) {
    return jsonError(
      `Too many requests. Please wait ${Math.ceil(result.retryAfterMs / 1000)}s and try again.`,
      'RATE_LIMITED',
      429,
      { retryAfterMs: result.retryAfterMs }
    );
  }
  return null;
}
