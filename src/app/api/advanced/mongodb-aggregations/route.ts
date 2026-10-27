import { NextRequest } from 'next/server';
import { getRepairReportsCollection } from '@/lib/db/mongodb';
import { requireAuth } from '@/lib/auth/session';
import { enforcePermission } from '@/lib/auth/rbac';
import { ValidationError, NotFoundError } from '@/lib/db/errors';
import { handleApiError, jsonSuccess } from '@/lib/utils/api-response';
import { MONGO_AGGREGATIONS } from '@/lib/db/mongodb-aggregations';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    enforcePermission(user, 'view_reports');

    const queries = Object.values(MONGO_AGGREGATIONS).map((q) => ({
      id: q.id,
      title: q.title,
      description: q.description,
      stages: q.stages,
      parameters: q.parameters || [],
    }));

    return jsonSuccess({ queries, total_queries: queries.length });
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

    const aggregationDef = MONGO_AGGREGATIONS[query_id];
    if (!aggregationDef) {
      throw new NotFoundError(`Aggregation query "${query_id}" not found in server registry`);
    }

    const pipeline = aggregationDef.buildPipeline(params);
    const collection = await getRepairReportsCollection();

    const startTime = performance.now();
    const results = await collection.aggregate(pipeline).toArray();
    const executionTimeMs = Math.round((performance.now() - startTime) * 10) / 10;

    return jsonSuccess({
      query_id: aggregationDef.id,
      title: aggregationDef.title,
      description: aggregationDef.description,
      stages: aggregationDef.stages,
      pipeline,
      results,
      count: results.length,
      execution_time_ms: executionTimeMs,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

