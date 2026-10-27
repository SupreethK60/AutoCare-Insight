export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { query, execute } from '@/lib/db/mysql';
import { requireAuth } from '@/lib/auth/session';
import { enforcePermission } from '@/lib/auth/rbac';
import { ValidationError, ConflictError } from '@/lib/db/errors';
import { handleApiError, jsonSuccess, jsonCreated } from '@/lib/utils/api-response';

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    enforcePermission(user, 'manage_users');

    const users = await query<any>(
      `SELECT user_id, full_name, email, role, phone, is_active, created_at, updated_at 
       FROM users 
       ORDER BY user_id ASC`
    );

    return jsonSuccess({ users });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    enforcePermission(user, 'manage_users');

    const body = await req.json().catch(() => ({}));
    const { full_name, email, password, role, phone } = body;

    if (!full_name || typeof full_name !== 'string' || full_name.trim().length === 0) {
      throw new ValidationError('Full name is required');
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      throw new ValidationError('Valid email is required');
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      throw new ValidationError('Password must be at least 6 characters');
    }
    if (!role || !['admin', 'service_advisor', 'mechanic'].includes(role)) {
      throw new ValidationError("Role must be 'admin', 'service_advisor', or 'mechanic'");
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await execute(
      `INSERT INTO users (full_name, email, password_hash, role, phone, is_active)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [full_name.trim(), email.toLowerCase().trim(), passwordHash, role, phone || null]
    );

    return jsonCreated({
      user: {
        user_id: result.insertId,
        full_name: full_name.trim(),
        email: email.toLowerCase().trim(),
        role,
        phone: phone || null
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}

