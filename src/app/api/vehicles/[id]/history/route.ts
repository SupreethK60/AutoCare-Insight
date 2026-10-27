import { NextRequest } from 'next/server';
import { query } from '@/lib/db/mysql';
import { requireAuth } from '@/lib/auth/session';
import { enforcePermission } from '@/lib/auth/rbac';
import { ValidationError } from '@/lib/db/errors';
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

    // Invoke the stored procedure sp_get_customer_vehicle_history
    const rawResult: any = await query('CALL sp_get_customer_vehicle_history(?)', [vehicleId]);
    const history = Array.isArray(rawResult) && Array.isArray(rawResult[0]) ? rawResult[0] : rawResult;

    return jsonSuccess({
      vehicle_id: vehicleId,
      history
    });
  } catch (error) {
    return handleApiError(error);
  }
}

