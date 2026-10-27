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
    enforcePermission(user, 'view_vehicles');

    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get('customer_id');
    const search = searchParams.get('search')?.trim();
    const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 50, 1), 100);
    const offset = Math.max(Number(searchParams.get('offset')) || 0, 0);

    let sql = `
      SELECT cv.vehicle_id, cv.customer_id, cv.catalogue_id, cv.license_plate, cv.vin,
             cv.color, cv.purchase_year, cv.current_odometer, cv.fuel_override, cv.notes, cv.is_active,
             c.full_name AS customer_name, c.phone AS customer_phone,
             vc.manufacturer, vc.model, vc.model_year, vc.category, vc.fuel
      FROM customer_vehicles cv
      JOIN customers c ON cv.customer_id = c.customer_id
      LEFT JOIN vehicle_catalogue vc ON cv.catalogue_id = vc.catalogue_id
      WHERE cv.is_active = 1
    `;
    const params: any[] = [];

    if (customerId) {
      sql += ` AND cv.customer_id = ?`;
      params.push(Number(customerId));
    }

    if (search) {
      sql += ` AND (cv.license_plate LIKE ? OR cv.vin LIKE ? OR c.full_name LIKE ? OR vc.model LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    sql += ` ORDER BY cv.vehicle_id DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const vehicles = await query<any>(sql, params);

    return jsonSuccess({
      vehicles,
      pagination: { limit, offset, count: vehicles.length }
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    enforcePermission(user, 'manage_vehicles');

    const body = await req.json().catch(() => ({}));
    const { customer_id, catalogue_id, license_plate, vin, color, purchase_year, current_odometer, notes } = body;

    if (!customer_id || isNaN(Number(customer_id))) {
      throw new ValidationError('Valid customer_id is required');
    }
    if (!license_plate || typeof license_plate !== 'string' || license_plate.trim().length === 0) {
      throw new ValidationError('License plate registration number is required');
    }

    const result = await execute(
      `INSERT INTO customer_vehicles (customer_id, catalogue_id, license_plate, vin, color, purchase_year, current_odometer, notes, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        Number(customer_id),
        catalogue_id ? Number(catalogue_id) : null,
        license_plate.trim().toUpperCase(),
        vin ? vin.trim().toUpperCase() : null,
        color ? color.trim() : null,
        purchase_year ? Number(purchase_year) : null,
        current_odometer ? Math.max(0, Number(current_odometer)) : 0,
        notes ? notes.trim() : null
      ]
    );

    return jsonCreated({
      vehicle: {
        vehicle_id: result.insertId,
        customer_id: Number(customer_id),
        catalogue_id: catalogue_id ? Number(catalogue_id) : null,
        license_plate: license_plate.trim().toUpperCase(),
        vin: vin || null,
        color: color || null,
        current_odometer: current_odometer || 0
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}

