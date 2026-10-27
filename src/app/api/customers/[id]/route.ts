import { NextRequest } from 'next/server';
import { query, queryOne, execute } from '@/lib/db/mysql';
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
    enforcePermission(user, 'view_customers');

    const customerId = Number(params.id);
    if (!customerId || isNaN(customerId)) {
      throw new ValidationError('Invalid customer ID');
    }

    const customer = await queryOne<any>(
      `SELECT customer_id, full_name, email, phone, address, city, state, zip_code, loyalty_points, created_at, updated_at
       FROM customers
       WHERE customer_id = ?`,
      [customerId]
    );

    if (!customer) {
      throw new NotFoundError(`Customer with ID ${customerId} not found`);
    }

    // Fetch customer's vehicles
    const vehicles = await query<any>(
      `SELECT cv.vehicle_id, cv.license_plate, cv.vin, cv.color, cv.purchase_year, cv.current_odometer,
              vc.manufacturer, vc.model, vc.model_year, vc.category, vc.fuel
       FROM customer_vehicles cv
       LEFT JOIN vehicle_catalogue vc ON cv.catalogue_id = vc.catalogue_id
       WHERE cv.customer_id = ? AND cv.is_active = 1`,
      [customerId]
    );

    return jsonSuccess({ customer, vehicles });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  try {
    const user = requireAuth(req);
    enforcePermission(user, 'manage_customers');

    const customerId = Number(params.id);
    if (!customerId || isNaN(customerId)) {
      throw new ValidationError('Invalid customer ID');
    }

    const body = await req.json().catch(() => ({}));
    const { full_name, email, phone, address, city, state, zip_code } = body;

    const existing = await queryOne<any>('SELECT customer_id FROM customers WHERE customer_id = ?', [customerId]);
    if (!existing) {
      throw new NotFoundError(`Customer with ID ${customerId} not found`);
    }

    await execute(
      `UPDATE customers
       SET full_name = COALESCE(?, full_name),
           email = COALESCE(?, email),
           phone = COALESCE(?, phone),
           address = COALESCE(?, address),
           city = COALESCE(?, city),
           state = COALESCE(?, state),
           zip_code = COALESCE(?, zip_code)
       WHERE customer_id = ?`,
      [
        full_name ? full_name.trim() : null,
        email ? email.trim().toLowerCase() : null,
        phone ? phone.trim() : null,
        address !== undefined ? address : null,
        city !== undefined ? city : null,
        state !== undefined ? state : null,
        zip_code !== undefined ? zip_code : null,
        customerId
      ]
    );

    const updated = await queryOne<any>('SELECT * FROM customers WHERE customer_id = ?', [customerId]);
    return jsonSuccess({ customer: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const user = requireAuth(req);
    enforcePermission(user, 'manage_customers');

    const customerId = Number(params.id);
    if (!customerId || isNaN(customerId)) {
      throw new ValidationError('Invalid customer ID');
    }

    const existing = await queryOne<any>('SELECT customer_id FROM customers WHERE customer_id = ?', [customerId]);
    if (!existing) {
      throw new NotFoundError(`Customer with ID ${customerId} not found`);
    }

    // Attempt delete; foreign keys RESTRICT deletion if vehicles/invoices exist
    await execute('DELETE FROM customers WHERE customer_id = ?', [customerId]);

    return jsonSuccess({ message: `Customer #${customerId} deleted successfully` });
  } catch (error) {
    return handleApiError(error);
  }
}

