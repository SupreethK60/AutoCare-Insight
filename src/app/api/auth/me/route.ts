import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { handleApiError, jsonSuccess } from '@/lib/utils/api-response';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    return jsonSuccess({ user });
  } catch (error) {
    return handleApiError(error);
  }
}
