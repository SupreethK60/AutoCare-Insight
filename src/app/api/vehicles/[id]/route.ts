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
    enforcePermission(user, 'view_vehicles');

    const vehicleId = Number(params.id);
    if (!vehicleId || isNaN(vehicleId)) {
      throw new ValidationError('Invalid vehicle ID');
    }

    const vehicle = await queryOne<any>(
      `SELECT cv.*,
              c.full_name AS customer_name, c.phone AS customer_phone, c.email AS customer_email,
              vc.manufacturer, vc.model, vc.model_year, vc.category, vc.fuel, vc.drivetrain,
              vc.conv_economy_combined, vc.alt_economy_combined, vc.electric_range
       FROM customer_vehicles cv
       JOIN customers c ON cv.customer_id = c.customer_id
       LEFT JOIN vehicle_catalogue vc ON cv.catalogue_id = vc.catalogue_id
       WHERE cv.vehicle_id = ? AND cv.is_active = 1`,
      [vehicleId]
    );

    if (!vehicle) {
      throw new NotFoundError(`Vehicle #${vehicleId} not found`);
    }

    return jsonSuccess({ vehicle });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  try {
    const user = requireAuth(req);
    enforcePermission(user, 'manage_vehicles');

    const vehicleId = Number(params.id);
    if (!vehicleId || isNaN(vehicleId)) {
      throw new ValidationError('Invalid vehicle ID');
    }

    const body = await req.json().catch(() => ({}));
    const { color, current_odometer, notes, is_active } = body;

    const existing = await queryOne<any>('SELECT vehicle_id FROM customer_vehicles WHERE vehicle_id = ?', [vehicleId]);
    if (!existing) {
      throw new NotFoundError(`Vehicle #${vehicleId} not found`);
    }

    await execute(
      `UPDATE customer_vehicles
       SET color = COALESCE(?, color),
           current_odometer = COALESCE(?, current_odometer),
           notes = COALESCE(?, notes),
           is_active = COALESCE(?, is_active)
       WHERE vehicle_id = ?`,
      [
        color !== undefined ? color : null,
        current_odometer !== undefined ? Number(current_odometer) : null,
        notes !== undefined ? notes : null,
        is_active !== undefined ? Number(is_active) : null,
        vehicleId
      ]
    );

    const updated = await queryOne<any>('SELECT * FROM customer_vehicles WHERE vehicle_id = ?', [vehicleId]);
    return jsonSuccess({ vehicle: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

