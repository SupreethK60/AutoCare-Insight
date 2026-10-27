export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { query, execute } from '@/lib/db/mysql';
import { requireAuth } from '@/lib/auth/session';
import { enforcePermission } from '@/lib/auth/rbac';
import { ValidationError } from '@/lib/db/errors';
import { handleApiError, jsonSuccess, jsonCreated } from '@/lib/utils/api-response';

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    enforcePermission(user, 'view_customers');

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim();
    const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 50, 1), 100);
    const offset = Math.max(Number(searchParams.get('offset')) || 0, 0);

    let sql = `
      SELECT customer_id, full_name, email, phone, address, city, state, zip_code, loyalty_points, created_at
      FROM customers
    `;
    const params: any[] = [];

    if (search) {
      sql += ` WHERE full_name LIKE ? OR email LIKE ? OR phone LIKE ?`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    sql += ` ORDER BY customer_id DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const customers = await query<any>(sql, params);

    return jsonSuccess({
      customers,
      pagination: { limit, offset, count: customers.length }
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    enforcePermission(user, 'manage_customers');

    const body = await req.json().catch(() => ({}));
    const { full_name, email, phone, address, city, state, zip_code } = body;

    if (!full_name || typeof full_name !== 'string' || full_name.trim().length === 0) {
      throw new ValidationError('Customer full name is required');
    }
    if (!phone || typeof phone !== 'string' || phone.trim().length < 8) {
      throw new ValidationError('A valid contact phone number is required (min 8 digits)');
    }

    const result = await execute(
      `INSERT INTO customers (full_name, email, phone, address, city, state, zip_code)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        full_name.trim(),
        email ? String(email).trim().toLowerCase() : null,
        phone.trim(),
        address ? String(address).trim() : null,
        city ? String(city).trim() : null,
        state ? String(state).trim() : null,
        zip_code ? String(zip_code).trim() : null
      ]
    );

    return jsonCreated({
      customer: {
        customer_id: result.insertId,
        full_name: full_name.trim(),
        email: email ? String(email).trim().toLowerCase() : null,
        phone: phone.trim(),
        address: address || null,
        city: city || null,
        state: state || null,
        zip_code: zip_code || null
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}

