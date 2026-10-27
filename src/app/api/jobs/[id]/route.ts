import { NextRequest } from 'next/server';
import { query, queryOne, execute } from '@/lib/db/mysql';
import { requireAuth } from '@/lib/auth/session';
import { enforcePermission } from '@/lib/auth/rbac';
import { NotFoundError, ValidationError, ForbiddenError } from '@/lib/db/errors';
import { handleApiError, jsonSuccess } from '@/lib/utils/api-response';

interface RouteContext {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const user = requireAuth(req);
    enforcePermission(user, 'view_jobs');

    const jobId = Number(params.id);
    if (!jobId || isNaN(jobId)) {
      throw new ValidationError('Invalid job ID');
    }

    const job = await queryOne<any>(
      `SELECT sj.*,
              c.customer_id, c.full_name AS customer_name, c.phone AS customer_phone, c.email AS customer_email,
              cv.license_plate, cv.vin, cv.color,
              CONCAT(vc.manufacturer, ' ', vc.model, ' (', vc.model_year, ')') AS vehicle_description,
              u.full_name AS mechanic_name
       FROM service_jobs sj
       JOIN customer_vehicles cv ON sj.vehicle_id = cv.vehicle_id
       JOIN customers c ON cv.customer_id = c.customer_id
       LEFT JOIN vehicle_catalogue vc ON cv.catalogue_id = vc.catalogue_id
       LEFT JOIN users u ON sj.mechanic_id = u.user_id
       WHERE sj.job_id = ?`,
      [jobId]
    );

    if (!job) {
      throw new NotFoundError(`Service Job #${jobId} not found`);
    }

    // Fetch services performed
    const services = await query<any>(
      `SELECT js.job_service_id, js.service_type_id, js.service_price, js.technician_notes,
              st.service_name, st.description
       FROM job_services js
       JOIN service_types st ON js.service_type_id = st.service_type_id
       WHERE js.job_id = ?`,
      [jobId]
    );

    // Fetch parts used
    const parts = await query<any>(
      `SELECT pu.usage_id, pu.part_id, pu.qty_used, pu.unit_price_charged, pu.used_at,
              sp.part_number, sp.part_name, sp.brand
       FROM part_usage pu
       JOIN spare_parts sp ON pu.part_id = sp.part_id
       WHERE pu.job_id = ?`,
      [jobId]
    );

    // Fetch invoice if generated
    const invoice = await queryOne<any>(
      `SELECT * FROM invoices WHERE job_id = ?`,
      [jobId]
    );

    return jsonSuccess({
      job,
      services,
      parts,
      invoice
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const user = requireAuth(req);
    enforcePermission(user, 'update_job_status');

    const jobId = Number(params.id);
    if (!jobId || isNaN(jobId)) {
      throw new ValidationError('Invalid job ID');
    }

    const body = await req.json().catch(() => ({}));
    const { status, mechanic_id, odometer_in, odometer_out, internal_notes, mongo_report_id, warranty_months } = body;

    const existing = await queryOne<any>('SELECT * FROM service_jobs WHERE job_id = ?', [jobId]);
    if (!existing) {
      throw new NotFoundError(`Service Job #${jobId} not found`);
    }

    // Role check: mechanics can only update jobs assigned to them
    if (user.role === 'mechanic' && existing.mechanic_id && existing.mechanic_id !== user.user_id) {
      throw new ForbiddenError('Mechanics can only update their own assigned jobs');
    }

    const validStatuses = ['assigned', 'in_progress', 'on_hold', 'completed', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      throw new ValidationError(`Job status must be one of: ${validStatuses.join(', ')}`);
    }

    const isMarkingCompleted = status === 'completed' && existing.status !== 'completed';

    await execute(
      `UPDATE service_jobs
       SET status = COALESCE(?, status),
           mechanic_id = COALESCE(?, mechanic_id),
           odometer_in = COALESCE(?, odometer_in),
           odometer_out = COALESCE(?, odometer_out),
           internal_notes = COALESCE(?, internal_notes),
           mongo_report_id = COALESCE(?, mongo_report_id),
           warranty_months = COALESCE(?, warranty_months),
           completed_at = CASE WHEN ? = 1 THEN NOW() ELSE completed_at END
       WHERE job_id = ?`,
      [
        status || null,
        mechanic_id !== undefined ? Number(mechanic_id) : null,
        odometer_in !== undefined ? Number(odometer_in) : null,
        odometer_out !== undefined ? Number(odometer_out) : null,
        internal_notes !== undefined ? internal_notes : null,
        mongo_report_id !== undefined ? mongo_report_id : null,
        warranty_months !== undefined ? Number(warranty_months) : null,
        isMarkingCompleted ? 1 : 0,
        jobId
      ]
    );

    // If odometer out was supplied, update vehicle current odometer
    if (odometer_out && Number(odometer_out) > 0) {
      await execute(
        `UPDATE customer_vehicles SET current_odometer = ? WHERE vehicle_id = ?`,
        [Number(odometer_out), existing.vehicle_id]
      );
    }

    const updated = await queryOne<any>('SELECT * FROM service_jobs WHERE job_id = ?', [jobId]);
    return jsonSuccess({ job: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

