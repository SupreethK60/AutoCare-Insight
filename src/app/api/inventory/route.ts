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
    enforcePermission(user, 'view_inventory');

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim();
    const category = searchParams.get('category')?.trim();
    const lowStockOnly = searchParams.get('low_stock') === 'true';
    const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 50, 1), 100);
    const offset = Math.max(Number(searchParams.get('offset')) || 0, 0);

    let sql = `
      SELECT part_id, part_number, part_name, description, category, brand,
             unit_cost, selling_price, qty_in_stock, reorder_level, location_code,
             is_active,
             CASE WHEN qty_in_stock <= reorder_level THEN 1 ELSE 0 END AS is_low_stock
      FROM spare_parts
      WHERE is_active = 1
    `;
    const params: any[] = [];

    if (lowStockOnly) {
      sql += ` AND qty_in_stock <= reorder_level`;
    }
    if (category) {
      sql += ` AND category = ?`;
      params.push(category);
    }
    if (search) {
      sql += ` AND (part_number LIKE ? OR part_name LIKE ? OR brand LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    sql += ` ORDER BY is_low_stock DESC, part_name ASC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const parts = await query<any>(sql, params);

    return jsonSuccess({
      inventory: parts,
      pagination: { limit, offset, count: parts.length }
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    enforcePermission(user, 'manage_inventory');

    const body = await req.json().catch(() => ({}));
    const { part_number, part_name, description, category, brand, unit_cost, selling_price, qty_in_stock, reorder_level, location_code } = body;

    if (!part_number || typeof part_number !== 'string' || part_number.trim().length === 0) {
      throw new ValidationError('Part number / SKU is required');
    }
    if (!part_name || typeof part_name !== 'string' || part_name.trim().length === 0) {
      throw new ValidationError('Part display name is required');
    }

    const cost = Number(unit_cost) || 0.0;
    const price = Number(selling_price) || cost;
    if (price < cost) {
      throw new ValidationError('Selling price cannot be less than purchase unit cost');
    }

    const result = await execute(
      `INSERT INTO spare_parts (part_number, part_name, description, category, brand, unit_cost, selling_price, qty_in_stock, reorder_level, location_code, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        part_number.trim().toUpperCase(),
        part_name.trim(),
        description ? description.trim() : null,
        category ? category.trim() : null,
        brand ? brand.trim() : null,
        cost,
        price,
        Math.max(0, Number(qty_in_stock) || 0),
        Math.max(1, Number(reorder_level) || 5),
        location_code ? location_code.trim().toUpperCase() : null
      ]
    );

    return jsonCreated({
      part: {
        part_id: result.insertId,
        part_number: part_number.trim().toUpperCase(),
        part_name: part_name.trim(),
        qty_in_stock: Number(qty_in_stock) || 0,
        selling_price: price
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}

