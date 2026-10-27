export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { query, execute } from '@/lib/db/mysql';
import { withTransaction } from '@/lib/db/transaction';
import { requireAuth } from '@/lib/auth/session';
import { enforcePermission } from '@/lib/auth/rbac';
import { ValidationError, NotFoundError } from '@/lib/db/errors';
import { handleApiError, jsonSuccess, jsonCreated } from '@/lib/utils/api-response';

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    enforcePermission(user, 'view_jobs');

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status')?.trim();
    const mechanicId = searchParams.get('mechanic_id');
    const vehicleId = searchParams.get('vehicle_id');
    const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 50, 1), 100);
    const offset = Math.max(Number(searchParams.get('offset')) || 0, 0);

    let sql = `
      SELECT sj.job_id, sj.appointment_id, sj.mechanic_id, sj.vehicle_id, sj.status,
             sj.odometer_in, sj.odometer_out, sj.started_at, sj.completed_at,
             sj.mongo_report_id, sj.internal_notes, sj.warranty_months, sj.created_at,
             u.full_name AS mechanic_name,
             c.full_name AS customer_name, c.phone AS customer_phone,
             cv.license_plate,
             CONCAT(vc.manufacturer, ' ', vc.model, ' (', vc.model_year, ')') AS vehicle_description,
             inv.invoice_id, inv.total_amount, inv.status AS invoice_status
      FROM service_jobs sj
      JOIN customer_vehicles cv ON sj.vehicle_id = cv.vehicle_id
      JOIN customers c ON cv.customer_id = c.customer_id
      LEFT JOIN vehicle_catalogue vc ON cv.catalogue_id = vc.catalogue_id
      LEFT JOIN users u ON sj.mechanic_id = u.user_id
      LEFT JOIN invoices inv ON sj.job_id = inv.job_id
      WHERE 1=1
    `;
    const params: any[] = [];

    // Mechanics only see assigned jobs if requested
    if (user.role === 'mechanic') {
      sql += ` AND (sj.mechanic_id = ? OR sj.mechanic_id IS NULL)`;
      params.push(user.user_id);
    } else if (mechanicId) {
      sql += ` AND sj.mechanic_id = ?`;
      params.push(Number(mechanicId));
    }

    if (status) {
      sql += ` AND sj.status = ?`;
      params.push(status);
    }
    if (vehicleId) {
      sql += ` AND sj.vehicle_id = ?`;
      params.push(Number(vehicleId));
    }

    sql += ` ORDER BY sj.job_id DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const jobs = await query<any>(sql, params);

    return jsonSuccess({
      jobs,
      pagination: { limit, offset, count: jobs.length }
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    enforcePermission(user, 'manage_jobs');

    const body = await req.json().catch(() => ({}));
    const { appointment_id, vehicle_id, mechanic_id, odometer_in, internal_notes, service_type_ids } = body;

    let targetVehicleId = vehicle_id ? Number(vehicle_id) : null;

    return await withTransaction(async (tx) => {
      // If linked to an appointment, derive vehicle and update appt status
      if (appointment_id) {
        const appt = await tx.queryOne<any>(
          'SELECT vehicle_id, service_type_id FROM appointments WHERE appointment_id = ?',
          [Number(appointment_id)]
        );
        if (!appt) {
          throw new NotFoundError(`Appointment #${appointment_id} not found`);
        }
        targetVehicleId = appt.vehicle_id;

        await tx.execute(
          `UPDATE appointments SET status = 'in_progress' WHERE appointment_id = ?`,
          [Number(appointment_id)]
        );
      }

      if (!targetVehicleId) {
        throw new ValidationError('A valid vehicle_id is required for a service job');
      }

      const jobResult = await tx.execute(
        `INSERT INTO service_jobs (appointment_id, mechanic_id, vehicle_id, status, odometer_in, started_at, internal_notes)
         VALUES (?, ?, ?, 'assigned', ?, NOW(), ?)`,
        [
          appointment_id ? Number(appointment_id) : null,
          mechanic_id ? Number(mechanic_id) : null,
          targetVehicleId,
          odometer_in ? Number(odometer_in) : null,
          internal_notes ? String(internal_notes).trim() : null
        ]
      );

      const jobId = jobResult.insertId;

      // Insert associated services if provided
      if (Array.isArray(service_type_ids) && service_type_ids.length > 0) {
        for (const stId of service_type_ids) {
          const st = await tx.queryOne<any>('SELECT base_price FROM service_types WHERE service_type_id = ?', [Number(stId)]);
          const price = st ? st.base_price : 0.0;
          await tx.execute(
            `INSERT IGNORE INTO job_services (job_id, service_type_id, service_price)
             VALUES (?, ?, ?)`,
            [jobId, Number(stId), price]
          );
        }
      }

      return jsonCreated({
        job: {
          job_id: jobId,
          appointment_id: appointment_id || null,
          vehicle_id: targetVehicleId,
          mechanic_id: mechanic_id || null,
          status: 'assigned'
        }
      });
    });
  } catch (error) {
    return handleApiError(error);
  }
}

