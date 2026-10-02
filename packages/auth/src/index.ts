import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '@nexeraquest/database';
import { UserRole } from '@nexeraquest/types';

const JWT_SECRET = process.env.JWT_SECRET || 'nexeraquest_dev_jwt_secret_change_in_production_key_443';

export interface TelegramUserData {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

export interface AuthSession {
  userId: string;
  role: UserRole;
  telegramId?: string | null;
  email?: string | null;
  projectId?: string | null;
}

/**
 * Validates Telegram Mini App initData string cryptographically using HMAC-SHA256.
 * Implements Telegram official WebApp verification algorithm.
 */
export function validateTelegramInitData(
  initData: string,
  botToken: string
): { isValid: boolean; user?: TelegramUserData; error?: string } {
  if (!initData) {
    return { isValid: false, error: 'Empty initData provided.' };
  }

  // Parse query string
  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');

  if (!hash) {
    return { isValid: false, error: 'Missing hash parameter in initData.' };
  }

  // Check auth_date for replay attack protection (max 24 hours)
  const authDateStr = urlParams.get('auth_date');
  if (!authDateStr) {
    return { isValid: false, error: 'Missing auth_date in initData.' };
  }

  const authDate = parseInt(authDateStr, 10);
  const now = Math.floor(Date.now() / 1000);
  if (now - authDate > 86400) {
    return { isValid: false, error: 'Telegram authentication expired (>24h).' };
  }

  // Collect and sort all parameters except hash
  const dataPairs: string[] = [];
  urlParams.forEach((val, key) => {
    if (key !== 'hash') {
      dataPairs.push(`${key}=${val}`);
    }
  });
  dataPairs.sort();
  const dataCheckString = dataPairs.join('\n');

  // Compute secret key: HMAC_SHA256("WebAppData", botToken)
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();

  // Compute HMAC_SHA256(secretKey, dataCheckString)
  const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  // Compare hashes securely
  const calculatedBuf = Buffer.from(calculatedHash, 'utf-8');
  const providedBuf = Buffer.from(hash, 'utf-8');

  if (calculatedBuf.length !== providedBuf.length || !crypto.timingSafeEqual(calculatedBuf, providedBuf)) {
    return { isValid: false, error: 'Invalid HMAC signature. Untrusted Telegram payload.' };
  }

  // Parse user object
  const userJson = urlParams.get('user');
  if (!userJson) {
    return { isValid: false, error: 'Valid signature but user payload missing.' };
  }

  try {
    const user: TelegramUserData = JSON.parse(userJson);
    return { isValid: true, user };
  } catch (err: any) {
    return { isValid: false, error: 'Failed to parse user JSON payload.' };
  }
}

/**
 * Signs a JWT session token for authenticated user
 */
export function signSessionToken(session: AuthSession, expiresIn: string | number = '7d'): string {
  return jwt.sign(session, JWT_SECRET, { expiresIn: expiresIn as any });
}

/**
 * Verifies and decodes a JWT session token
 */
export function verifySessionToken(token: string): AuthSession | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthSession;
  } catch {
    return null;
  }
}

/**
 * Role-Based Access Control (RBAC) Permission Matrix
 */
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  CONTRIBUTOR: [
    'task:start',
    'task:submit',
    'task:verify',
    'wallet:read',
    'wallet:withdraw',
    'profile:read',
    'profile:update',
    'dispute:create',
    'referral:read',
  ],
  PROJECT_OPERATOR: [
    'campaign:read',
    'campaign:create',
    'campaign:edit',
    'participant:read',
    'participant:export',
    'telemetry:read',
  ],
  PROJECT_OWNER: [
    'campaign:read',
    'campaign:create',
    'campaign:edit',
    'campaign:fund',
    'campaign:pause',
    'campaign:refund',
    'participant:read',
    'participant:export',
    'telemetry:read',
    'project:settings',
    'project:team',
  ],
  RISK_ADMIN: [
    'fraud:read',
    'fraud:investigate',
    'fraud:resolve',
    'contributor:freeze',
    'contributor:unfreeze',
    'dispute:read',
    'dispute:resolve',
    'audit:read',
  ],
  FINANCE_ADMIN: [
    'ledger:read',
    'withdrawal:read',
    'withdrawal:authorize',
    'withdrawal:reject',
    'reconciliation:run',
    'reconciliation:read',
    'refund:approve',
    'audit:read',
  ],
  ADMIN: [
    'campaign:read',
    'campaign:approve',
    'campaign:reject',
    'campaign:pause',
    'fraud:read',
    'fraud:investigate',
    'fraud:resolve',
    'dispute:read',
    'dispute:resolve',
    'withdrawal:read',
    'withdrawal:authorize',
    'ledger:read',
    'audit:read',
    'settings:read',
  ],
  SUPER_ADMIN: ['*'], // Universal permissions
};

export function hasPermission(role: UserRole, permission: string): boolean {
  const allowed = ROLE_PERMISSIONS[role] || [];
  if (allowed.includes('*')) return true;
  return allowed.includes(permission);
}
