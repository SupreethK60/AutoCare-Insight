import { NextRequest } from 'next/server';
import { queryOne, execute } from '@/lib/db/mysql';
import { requireAuth } from '@/lib/auth/session';
import { enforcePermission } from '@/lib/auth/rbac';
import { NotFoundError, ValidationError } from '@/lib/db/errors';
import { handleApiError, jsonSuccess } from '@/lib/utils/api-response';

interface RouteContext {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const user = requireAuth(req);
    enforcePermission(user, 'view_inventory');

    const partId = Number(params.id);
    if (!partId || isNaN(partId)) {
      throw new ValidationError('Invalid part ID');
    }

    const part = await queryOne<any>(
      `SELECT *, CASE WHEN qty_in_stock <= reorder_level THEN 1 ELSE 0 END AS is_low_stock
       FROM spare_parts
       WHERE part_id = ?`,
      [partId]
    );

    if (!part) {
      throw new NotFoundError(`Spare part #${partId} not found`);
    }

    return jsonSuccess({ part });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  try {
    const user = requireAuth(req);
    enforcePermission(user, 'manage_inventory');

    const partId = Number(params.id);
    if (!partId || isNaN(partId)) {
      throw new ValidationError('Invalid part ID');
    }

    const body = await req.json().catch(() => ({}));
    const { part_name, description, category, brand, unit_cost, selling_price, qty_in_stock, reorder_level, location_code, is_active } = body;

    const existing = await queryOne<any>('SELECT * FROM spare_parts WHERE part_id = ?', [partId]);
    if (!existing) {
      throw new NotFoundError(`Spare part #${partId} not found`);
    }

    const cost = unit_cost !== undefined ? Number(unit_cost) : existing.unit_cost;
    const price = selling_price !== undefined ? Number(selling_price) : existing.selling_price;

    if (price < cost) {
      throw new ValidationError('Selling price cannot be less than purchase unit cost');
    }

    await execute(
      `UPDATE spare_parts
       SET part_name = COALESCE(?, part_name),
           description = COALESCE(?, description),
           category = COALESCE(?, category),
           brand = COALESCE(?, brand),
           unit_cost = COALESCE(?, unit_cost),
           selling_price = COALESCE(?, selling_price),
           qty_in_stock = COALESCE(?, qty_in_stock),
           reorder_level = COALESCE(?, reorder_level),
           location_code = COALESCE(?, location_code),
           is_active = COALESCE(?, is_active)
       WHERE part_id = ?`,
      [
        part_name !== undefined ? part_name.trim() : null,
        description !== undefined ? description : null,
        category !== undefined ? category : null,
        brand !== undefined ? brand : null,
        unit_cost !== undefined ? cost : null,
        selling_price !== undefined ? price : null,
        qty_in_stock !== undefined ? Math.max(0, Number(qty_in_stock)) : null,
        reorder_level !== undefined ? Math.max(1, Number(reorder_level)) : null,
        location_code !== undefined ? location_code : null,
        is_active !== undefined ? Number(is_active) : null,
        partId
      ]
    );

    const updated = await queryOne<any>('SELECT * FROM spare_parts WHERE part_id = ?', [partId]);
    return jsonSuccess({ part: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

