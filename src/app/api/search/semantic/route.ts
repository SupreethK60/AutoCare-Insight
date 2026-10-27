import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { enforcePermission } from '@/lib/auth/rbac';
import { ValidationError } from '@/lib/db/errors';
import { handleApiError, jsonSuccess } from '@/lib/utils/api-response';
import {
  searchSemanticDiagnostics,
  EMBEDDING_MODEL_NAME,
  EMBEDDING_DIMENSIONS
} from '@/lib/vector-search';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    // Allow mechanics, advisors, and admins to access diagnostic similarity search
    enforcePermission(user, 'view_reports');

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim();
    const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 4, 1), 10);
    const scope = (searchParams.get('scope') || 'all') as 'all' | 'knowledge_base' | 'mongodb_report';

    if (!query || query.length < 2) {
      throw new ValidationError('A non-empty search query string (minimum 2 characters) is required');
    }

    const startTime = performance.now();
    const results = await searchSemanticDiagnostics(query, limit, scope);
    const searchDurationMs = Math.round((performance.now() - startTime) * 10) / 10;

    return jsonSuccess({
      query,
      model: EMBEDDING_MODEL_NAME,
      dimensions: EMBEDDING_DIMENSIONS,
      similarity_metric: 'Cosine Similarity (dot product on L2 unit-normalized dense vectors)',
      scope,
      results,
      count: results.length,
      search_duration_ms: searchDurationMs,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
