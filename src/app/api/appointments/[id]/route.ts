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
    enforcePermission(user, 'view_appointments');

    const appointmentId = Number(params.id);
    if (!appointmentId || isNaN(appointmentId)) {
      throw new ValidationError('Invalid appointment ID');
    }

    const appt = await queryOne<any>(
      `SELECT a.*,
              c.full_name AS customer_name, c.phone AS customer_phone, c.email AS customer_email,
              cv.license_plate, cv.vin, cv.color, cv.current_odometer,
              vc.manufacturer, vc.model, vc.model_year, vc.category, vc.fuel,
              u.full_name AS advisor_name,
              st.service_name, st.base_price, st.description AS service_description
       FROM appointments a
       JOIN customers c ON a.customer_id = c.customer_id
       JOIN customer_vehicles cv ON a.vehicle_id = cv.vehicle_id
       LEFT JOIN vehicle_catalogue vc ON cv.catalogue_id = vc.catalogue_id
       LEFT JOIN users u ON a.advisor_id = u.user_id
       LEFT JOIN service_types st ON a.service_type_id = st.service_type_id
       WHERE a.appointment_id = ?`,
      [appointmentId]
    );

    if (!appt) {
      throw new NotFoundError(`Appointment #${appointmentId} not found`);
    }

    return jsonSuccess({ appointment: appt });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const user = requireAuth(req);
    enforcePermission(user, 'manage_appointments');

    const appointmentId = Number(params.id);
    if (!appointmentId || isNaN(appointmentId)) {
      throw new ValidationError('Invalid appointment ID');
    }

    const body = await req.json().catch(() => ({}));
    const { status, scheduled_at, advisor_notes, advisor_id } = body;

    const existing = await queryOne<any>('SELECT appointment_id FROM appointments WHERE appointment_id = ?', [appointmentId]);
    if (!existing) {
      throw new NotFoundError(`Appointment #${appointmentId} not found`);
    }

    const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      throw new ValidationError(`Status must be one of: ${validStatuses.join(', ')}`);
    }

    await execute(
      `UPDATE appointments
       SET status = COALESCE(?, status),
           scheduled_at = COALESCE(?, scheduled_at),
           advisor_notes = COALESCE(?, advisor_notes),
           advisor_id = COALESCE(?, advisor_id)
       WHERE appointment_id = ?`,
      [
        status || null,
        scheduled_at ? new Date(scheduled_at).toISOString().slice(0, 19).replace('T', ' ') : null,
        advisor_notes !== undefined ? advisor_notes : null,
        advisor_id !== undefined ? Number(advisor_id) : null,
        appointmentId
      ]
    );

    const updated = await queryOne<any>('SELECT * FROM appointments WHERE appointment_id = ?', [appointmentId]);
    return jsonSuccess({ appointment: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const user = requireAuth(req);
    enforcePermission(user, 'manage_appointments');

    const appointmentId = Number(params.id);
    if (!appointmentId || isNaN(appointmentId)) {
      throw new ValidationError('Invalid appointment ID');
    }

    await execute(`UPDATE appointments SET status = 'cancelled' WHERE appointment_id = ?`, [appointmentId]);

    return jsonSuccess({ message: `Appointment #${appointmentId} has been cancelled` });
  } catch (error) {
    return handleApiError(error);
  }
}

