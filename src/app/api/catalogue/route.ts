import { NextRequest } from 'next/server';
import { query } from '@/lib/db/mysql';
import { handleApiError, jsonSuccess } from '@/lib/utils/api-response';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim();
    const manufacturer = searchParams.get('manufacturer')?.trim();
    const fuel = searchParams.get('fuel')?.trim();
    const category = searchParams.get('category')?.trim();
    const year = searchParams.get('year');
    const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 25, 1), 100);
    const offset = Math.max(Number(searchParams.get('offset')) || 0, 0);

    let sql = `
      SELECT catalogue_id, manufacturer, model, model_year, category, fuel, fuel_code,
             engine_type, engine_size, engine_cylinders, transmission_type, drivetrain,
             conv_economy_combined, alt_economy_combined, electric_range, phev_total_range,
             source_dataset
      FROM vehicle_catalogue
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search) {
      sql += ` AND (manufacturer LIKE ? OR model LIKE ? OR category LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    if (manufacturer) {
      sql += ` AND manufacturer = ?`;
      params.push(manufacturer);
    }

    if (fuel) {
      sql += ` AND fuel LIKE ?`;
      params.push(`%${fuel}%`);
    }

    if (category) {
      sql += ` AND category = ?`;
      params.push(category);
    }

    if (year) {
      sql += ` AND model_year = ?`;
      params.push(Number(year));
    }

    sql += ` ORDER BY manufacturer ASC, model ASC, model_year DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const items = await query<any>(sql, params);

    return jsonSuccess({
      catalogue: items,
      pagination: { limit, offset, count: items.length }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
