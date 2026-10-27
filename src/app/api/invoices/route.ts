export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { query, queryOne } from '@/lib/db/mysql';
import { requireAuth } from '@/lib/auth/session';
import { enforcePermission } from '@/lib/auth/rbac';
import { ValidationError, NotFoundError, ConflictError } from '@/lib/db/errors';
import { handleApiError, jsonSuccess, jsonCreated } from '@/lib/utils/api-response';

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    enforcePermission(user, 'view_invoices');

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status')?.trim();
    const customerId = searchParams.get('customer_id');
    const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 50, 1), 100);
    const offset = Math.max(Number(searchParams.get('offset')) || 0, 0);

    let sql = `
      SELECT inv.invoice_id, inv.job_id, inv.customer_id, inv.subtotal,
             inv.tax_rate, inv.tax_amount, inv.discount_amount, inv.total_amount,
             inv.status, inv.due_date, inv.issued_at,
             c.full_name AS customer_name, c.phone AS customer_phone,
             cv.license_plate,
             COALESCE(SUM(pay.amount_paid), 0) AS amount_paid
      FROM invoices inv
      JOIN customers c ON inv.customer_id = c.customer_id
      JOIN service_jobs sj ON inv.job_id = sj.job_id
      JOIN customer_vehicles cv ON sj.vehicle_id = cv.vehicle_id
      LEFT JOIN invoice_payments pay ON inv.invoice_id = pay.invoice_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status) {
      sql += ` AND inv.status = ?`;
      params.push(status);
    }
    if (customerId) {
      sql += ` AND inv.customer_id = ?`;
      params.push(Number(customerId));
    }

    sql += `
      GROUP BY inv.invoice_id, inv.job_id, inv.customer_id, inv.subtotal,
               inv.tax_rate, inv.tax_amount, inv.discount_amount, inv.total_amount,
               inv.status, inv.due_date, inv.issued_at, c.full_name, c.phone, cv.license_plate
      ORDER BY inv.invoice_id DESC
      LIMIT ? OFFSET ?
    `;
    params.push(limit, offset);

    const invoices = await query<any>(sql, params);

    return jsonSuccess({
      invoices,
      pagination: { limit, offset, count: invoices.length }
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    enforcePermission(user, 'manage_invoices');

    const body = await req.json().catch(() => ({}));
    const { job_id, tax_rate, discount_amount } = body;

    const jobId = Number(job_id);
    if (!jobId || isNaN(jobId)) {
      throw new ValidationError('Valid job_id is required to generate invoice');
    }

    const tax = tax_rate !== undefined ? Number(tax_rate) : 18.0;
    const discount = discount_amount !== undefined ? Number(discount_amount) : 0.0;

    // Call stored procedure sp_generate_invoice
    await query(
      `CALL sp_generate_invoice(?, ?, ?, @out_inv_id, @out_msg)`,
      [jobId, tax, discount]
    );

    const procResult = await queryOne<any>('SELECT @out_inv_id AS inv_id, @out_msg AS msg');
    if (!procResult || procResult.inv_id === 0) {
      const msg = procResult?.msg || 'Could not generate invoice';
      if (msg.includes('already exists')) {
        throw new ConflictError(msg);
      }
      throw new ValidationError(msg);
    }

    const invoice = await queryOne<any>('SELECT * FROM invoices WHERE invoice_id = ?', [procResult.inv_id]);

    return jsonCreated({ invoice });
  } catch (error) {
    return handleApiError(error);
  }
}

