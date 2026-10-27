import { NextRequest } from 'next/server';
import { query, queryOne } from '@/lib/db/mysql';
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
    enforcePermission(user, 'view_invoices');

    const invoiceId = Number(params.id);
    if (!invoiceId || isNaN(invoiceId)) {
      throw new ValidationError('Invalid invoice ID');
    }

    const invoice = await queryOne<any>(
      `SELECT inv.*,
              c.full_name AS customer_name, c.email AS customer_email, c.phone AS customer_phone, c.address AS customer_address,
              cv.license_plate, cv.vin,
              CONCAT(vc.manufacturer, ' ', vc.model, ' (', vc.model_year, ')') AS vehicle_description
       FROM invoices inv
       JOIN customers c ON inv.customer_id = c.customer_id
       JOIN service_jobs sj ON inv.job_id = sj.job_id
       JOIN customer_vehicles cv ON sj.vehicle_id = cv.vehicle_id
       LEFT JOIN vehicle_catalogue vc ON cv.catalogue_id = vc.catalogue_id
       WHERE inv.invoice_id = ?`,
      [invoiceId]
    );

    if (!invoice) {
      throw new NotFoundError(`Invoice #${invoiceId} not found`);
    }

    // Line items: Services charged
    const services = await query<any>(
      `SELECT js.service_type_id, js.service_price, st.service_name, st.description
       FROM job_services js
       JOIN service_types st ON js.service_type_id = st.service_type_id
       WHERE js.job_id = ?`,
      [invoice.job_id]
    );

    // Line items: Parts charged
    const parts = await query<any>(
      `SELECT pu.part_id, pu.qty_used, pu.unit_price_charged,
              (pu.qty_used * pu.unit_price_charged) AS total_part_price,
              sp.part_number, sp.part_name
       FROM part_usage pu
       JOIN spare_parts sp ON pu.part_id = sp.part_id
       WHERE pu.job_id = ?`,
      [invoice.job_id]
    );

    // Payments recorded
    const payments = await query<any>(
      `SELECT pay.*, u.full_name AS recorded_by_name
       FROM invoice_payments pay
       LEFT JOIN users u ON pay.recorded_by = u.user_id
       WHERE pay.invoice_id = ?
       ORDER BY pay.paid_at ASC`,
      [invoiceId]
    );

    const totalPaid = payments.reduce((sum: number, p: any) => sum + Number(p.amount_paid), 0);

    return jsonSuccess({
      invoice,
      services,
      parts,
      payments,
      summary: {
        total_amount: Number(invoice.total_amount),
        total_paid: totalPaid,
        balance_due: Math.max(0, Number(invoice.total_amount) - totalPaid),
        is_settled: totalPaid >= Number(invoice.total_amount)
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}

