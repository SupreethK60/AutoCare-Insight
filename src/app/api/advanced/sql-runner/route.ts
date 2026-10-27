import { NextRequest } from 'next/server';
import { query } from '@/lib/db/mysql';
import { requireAuth } from '@/lib/auth/session';
import { enforcePermission } from '@/lib/auth/rbac';
import { ValidationError, NotFoundError } from '@/lib/db/errors';
import { handleApiError, jsonSuccess } from '@/lib/utils/api-response';
import { SQL_QUERY_REGISTRY } from '@/lib/db/query-registry';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    enforcePermission(user, 'view_reports');

    const queries = Object.values(SQL_QUERY_REGISTRY).map((q) => ({
      id: q.id,
      title: q.title,
      description: q.description,
      category: q.category,
      concepts: q.concepts,
      parameters: q.parameters || [],
      sql: q.sql,
    }));

    return jsonSuccess({
      queries,
      total_queries: queries.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    enforcePermission(user, 'view_reports');

    const body = await req.json().catch(() => ({}));
    const { query_id, params = {} } = body;

    if (!query_id || typeof query_id !== 'string') {
      throw new ValidationError('A valid query_id string is required');
    }

    const queryDef = SQL_QUERY_REGISTRY[query_id];
    if (!queryDef) {
      throw new NotFoundError(`Query "${query_id}" not found in server registry`);
    }

    // Build safe parameterized SQL
    const { sql, values } = queryDef.buildQuery(params);

    const startTime = performance.now();
    const rows = await query<any>(sql, values);
    const executionTimeMs = Math.round((performance.now() - startTime) * 10) / 10;

    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

    return jsonSuccess({
      query_id: queryDef.id,
      title: queryDef.title,
      category: queryDef.category,
      concepts: queryDef.concepts,
      sql,
      parameters_used: values,
      columns,
      rows,
      count: rows.length,
      execution_time_ms: executionTimeMs,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
