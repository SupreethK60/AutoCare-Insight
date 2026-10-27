export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { query, queryOne } from '@/lib/db/mysql';
import { requireAuth } from '@/lib/auth/session';
import { enforcePermission } from '@/lib/auth/rbac';
import { ValidationError, ConflictError } from '@/lib/db/errors';
import { handleApiError, jsonSuccess, jsonCreated } from '@/lib/utils/api-response';

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    enforcePermission(user, 'view_appointments');

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status')?.trim();
    const customerId = searchParams.get('customer_id');
    const vehicleId = searchParams.get('vehicle_id');
    const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 50, 1), 100);
    const offset = Math.max(Number(searchParams.get('offset')) || 0, 0);

    let sql = `
      SELECT a.appointment_id, a.customer_id, a.vehicle_id, a.advisor_id, a.scheduled_at,
             a.status, a.service_type_id, a.mileage_at_booking, a.customer_notes, a.advisor_notes, a.created_at,
             c.full_name AS customer_name, c.phone AS customer_phone,
             cv.license_plate, cv.vin,
             CONCAT(vc.manufacturer, ' ', vc.model, ' (', vc.model_year, ')') AS vehicle_description,
             u.full_name AS advisor_name,
             st.service_name, st.base_price
      FROM appointments a
      JOIN customers c ON a.customer_id = c.customer_id
      JOIN customer_vehicles cv ON a.vehicle_id = cv.vehicle_id
      LEFT JOIN vehicle_catalogue vc ON cv.catalogue_id = vc.catalogue_id
      LEFT JOIN users u ON a.advisor_id = u.user_id
      LEFT JOIN service_types st ON a.service_type_id = st.service_type_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status) {
      sql += ` AND a.status = ?`;
      params.push(status);
    }
    if (customerId) {
      sql += ` AND a.customer_id = ?`;
      params.push(Number(customerId));
    }
    if (vehicleId) {
      sql += ` AND a.vehicle_id = ?`;
      params.push(Number(vehicleId));
    }

    sql += ` ORDER BY a.scheduled_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const appointments = await query<any>(sql, params);

    return jsonSuccess({
      appointments,
      pagination: { limit, offset, count: appointments.length }
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    enforcePermission(user, 'manage_appointments');

    const body = await req.json().catch(() => ({}));
    const { customer_id, vehicle_id, scheduled_at, service_type_id, customer_notes, mileage_at_booking } = body;

    if (!customer_id || isNaN(Number(customer_id))) {
      throw new ValidationError('Valid customer_id is required');
    }
    if (!vehicle_id || isNaN(Number(vehicle_id))) {
      throw new ValidationError('Valid vehicle_id is required');
    }
    if (!scheduled_at) {
      throw new ValidationError('scheduled_at timestamp is required');
    }

    const scheduledDate = new Date(scheduled_at);
    if (isNaN(scheduledDate.getTime())) {
      throw new ValidationError('Invalid scheduled_at date format');
    }

    // Call stored procedure sp_book_appointment
    const advisorId = user.role === 'service_advisor' ? user.user_id : (body.advisor_id || user.user_id);

    await query(
      `CALL sp_book_appointment(?, ?, ?, ?, ?, ?, @out_appt_id, @out_msg)`,
      [
        Number(customer_id),
        Number(vehicle_id),
        Number(advisorId),
        scheduledDate.toISOString().slice(0, 19).replace('T', ' '),
        service_type_id ? Number(service_type_id) : null,
        customer_notes ? String(customer_notes).trim() : null
      ]
    );

    const procResult = await queryOne<any>('SELECT @out_appt_id AS appt_id, @out_msg AS msg');
    if (!procResult || procResult.appt_id === 0) {
      const msg = procResult?.msg || 'Could not complete appointment booking';
      if (msg.includes('already has an appointment')) {
        throw new ConflictError(msg);
      }
      throw new ValidationError(msg);
    }

    const apptId = procResult.appt_id;

    if (mileage_at_booking) {
      await query('UPDATE appointments SET mileage_at_booking = ? WHERE appointment_id = ?', [
        Number(mileage_at_booking),
        apptId
      ]);
    }

    const created = await queryOne<any>(
      `SELECT a.*, c.full_name AS customer_name, cv.license_plate
       FROM appointments a
       JOIN customers c ON a.customer_id = c.customer_id
       JOIN customer_vehicles cv ON a.vehicle_id = cv.vehicle_id
       WHERE a.appointment_id = ?`,
      [apptId]
    );

    return jsonCreated({ appointment: created });
  } catch (error) {
    return handleApiError(error);
  }
}

