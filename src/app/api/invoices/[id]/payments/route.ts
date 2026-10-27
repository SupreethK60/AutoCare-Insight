import { NextRequest } from 'next/server';
import { queryOne, execute } from '@/lib/db/mysql';
import { requireAuth } from '@/lib/auth/session';
import { enforcePermission } from '@/lib/auth/rbac';
import { NotFoundError, ValidationError } from '@/lib/db/errors';
import { handleApiError, jsonCreated } from '@/lib/utils/api-response';

interface RouteContext {
  params: { id: string };
}

const VALID_METHODS = ['cash', 'card', 'upi', 'bank_transfer', 'cheque', 'other'] as const;

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const user = requireAuth(req);
    enforcePermission(user, 'record_payments');

    const invoiceId = Number(params.id);
    if (!invoiceId || isNaN(invoiceId)) {
      throw new ValidationError('Invalid invoice ID');
    }

    const body = await req.json().catch(() => ({}));
    const { amount_paid, payment_method, reference_number, notes } = body;

    const amount = Number(amount_paid);
    if (isNaN(amount) || amount <= 0) {
      throw new ValidationError('Amount paid must be greater than 0');
    }

    if (!payment_method || !VALID_METHODS.includes(payment_method)) {
      throw new ValidationError(`Payment method must be one of: ${VALID_METHODS.join(', ')}`);
    }

    // Verify invoice exists
    const invoice = await queryOne<any>(
      `SELECT inv.invoice_id, inv.total_amount, inv.status,
              COALESCE(SUM(pay.amount_paid), 0) AS total_paid
       FROM invoices inv
       LEFT JOIN invoice_payments pay ON inv.invoice_id = pay.invoice_id
       WHERE inv.invoice_id = ?
       GROUP BY inv.invoice_id, inv.total_amount, inv.status`,
      [invoiceId]
    );

    if (!invoice) {
      throw new NotFoundError(`Invoice #${invoiceId} not found`);
    }
    if (invoice.status === 'paid') {
      throw new ValidationError(`Invoice #${invoiceId} is already fully paid and settled`);
    }
    if (invoice.status === 'cancelled') {
      throw new ValidationError(`Cannot record payments on a cancelled invoice`);
    }

    const currentPaid = Number(invoice.total_paid);
    const balanceDue = Number(invoice.total_amount) - currentPaid;

    if (amount > balanceDue + 0.01) {
      throw new ValidationError(`Payment amount (₹${amount}) exceeds remaining balance due (₹${balanceDue.toFixed(2)})`);
    }

    // Insert payment: triggers trg_mark_invoice_paid
    const result = await execute(
      `INSERT INTO invoice_payments (invoice_id, amount_paid, payment_method, reference_number, recorded_by, notes, paid_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        invoiceId,
        amount,
        payment_method,
        reference_number ? String(reference_number).trim() : null,
        user.user_id,
        notes ? String(notes).trim() : null
      ]
    );

    // Fetch updated invoice status after trigger execution
    const updatedInvoice = await queryOne<any>('SELECT invoice_id, status, total_amount FROM invoices WHERE invoice_id = ?', [invoiceId]);

    return jsonCreated({
      payment: {
        payment_id: result.insertId,
        invoice_id: invoiceId,
        amount_paid: amount,
        payment_method,
        reference_number: reference_number || null,
        invoice_status: updatedInvoice?.status
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}

