import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { AuthenticatedUser } from './rbac';
import { UnauthorizedError } from '../db/errors';

const JWT_SECRET = process.env.JWT_SECRET || 'autocare_secret_key_pes_cse_2026';
export const AUTH_COOKIE_NAME = 'autocare_token';

// In-memory sliding window rate limiter for login protection
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

export function checkLoginRateLimit(identifier: string, maxAttempts: number = 5, windowMs: number = 60000): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(identifier);

  if (!entry || now > entry.resetAt) {
    loginAttempts.set(identifier, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxAttempts) {
    return false;
  }

  entry.count++;
  return true;
}

export function resetLoginRateLimit(identifier: string): void {
  loginAttempts.delete(identifier);
}

export function createSessionToken(user: AuthenticatedUser): string {
  return jwt.sign(
    {
      user_id: user.user_id,
      email: user.email,
      full_name: user.full_name,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifySessionToken(token: string): AuthenticatedUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (!decoded || !decoded.user_id || !decoded.role) {
      return null;
    }
    return {
      user_id: decoded.user_id,
      email: decoded.email,
      full_name: decoded.full_name,
      role: decoded.role
    };
  } catch {
    return null;
  }
}

export function getSessionFromRequest(req: NextRequest): AuthenticatedUser | null {
  // Check HTTP-only cookie first
  const cookie = req.cookies.get(AUTH_COOKIE_NAME);
  if (cookie?.value) {
    const user = verifySessionToken(cookie.value);
    if (user) return user;
  }

  // Fallback to Authorization Header
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    return verifySessionToken(token);
  }

  return null;
}

export function requireAuth(req: NextRequest): AuthenticatedUser {
  const user = getSessionFromRequest(req);
  if (!user) {
    throw new UnauthorizedError('Authentication required. Please log in.');
  }
  return user;
}

