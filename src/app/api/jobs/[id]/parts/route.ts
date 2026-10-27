import { NextRequest } from 'next/server';
import { query, queryOne, execute } from '@/lib/db/mysql';
import { requireAuth } from '@/lib/auth/session';
import { enforcePermission } from '@/lib/auth/rbac';
import { NotFoundError, ValidationError } from '@/lib/db/errors';
import { handleApiError, jsonSuccess, jsonCreated } from '@/lib/utils/api-response';

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

    const parts = await query<any>(
      `SELECT pu.usage_id, pu.job_id, pu.part_id, pu.qty_used, pu.unit_price_charged, pu.used_at,
              sp.part_number, sp.part_name, sp.category, sp.brand, sp.qty_in_stock
       FROM part_usage pu
       JOIN spare_parts sp ON pu.part_id = sp.part_id
       WHERE pu.job_id = ?
       ORDER BY pu.used_at DESC`,
      [jobId]
    );

    return jsonSuccess({ parts });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const user = requireAuth(req);
    enforcePermission(user, 'manage_jobs');

    const jobId = Number(params.id);
    if (!jobId || isNaN(jobId)) {
      throw new ValidationError('Invalid job ID');
    }

    const body = await req.json().catch(() => ({}));
    const { part_id, qty_used, unit_price_charged } = body;

    if (!part_id || isNaN(Number(part_id))) {
      throw new ValidationError('Valid part_id is required');
    }

    const qty = Number(qty_used) || 1;
    if (qty <= 0) {
      throw new ValidationError('Quantity used must be greater than 0');
    }

    // Verify job exists and is active
    const job = await queryOne<any>('SELECT job_id, status FROM service_jobs WHERE job_id = ?', [jobId]);
    if (!job) {
      throw new NotFoundError(`Service Job #${jobId} not found`);
    }
    if (job.status === 'completed' || job.status === 'cancelled') {
      throw new ValidationError(`Cannot add parts to a ${job.status} job`);
    }

    // Verify part exists and has sufficient stock
    const part = await queryOne<any>('SELECT part_id, selling_price, qty_in_stock FROM spare_parts WHERE part_id = ?', [Number(part_id)]);
    if (!part) {
      throw new NotFoundError(`Spare Part #${part_id} not found`);
    }
    if (part.qty_in_stock < qty) {
      throw new ValidationError(`Insufficient stock for part #${part_id}. Available: ${part.qty_in_stock}, requested: ${qty}`);
    }

    const unitPrice = unit_price_charged !== undefined ? Number(unit_price_charged) : part.selling_price;

    // Insert into part_usage; triggers trg_deduct_stock_on_part_usage
    const result = await execute(
      `INSERT INTO part_usage (job_id, part_id, qty_used, unit_price_charged, used_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [jobId, Number(part_id), qty, unitPrice]
    );

    // Fetch the updated part stock after trigger execution
    const updatedPart = await queryOne<any>('SELECT qty_in_stock FROM spare_parts WHERE part_id = ?', [Number(part_id)]);

    return jsonCreated({
      usage: {
        usage_id: result.insertId,
        job_id: jobId,
        part_id: Number(part_id),
        qty_used: qty,
        unit_price_charged: unitPrice,
        remaining_stock: updatedPart?.qty_in_stock
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}

