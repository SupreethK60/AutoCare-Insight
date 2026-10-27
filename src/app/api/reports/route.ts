export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { getRepairReportsCollection } from '@/lib/db/mongodb';
import { execute } from '@/lib/db/mysql';
import { requireAuth } from '@/lib/auth/session';
import { enforcePermission } from '@/lib/auth/rbac';
import { validateRepairReport } from '@/lib/validation/repair-report';
import { handleApiError, jsonSuccess, jsonCreated } from '@/lib/utils/api-response';

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    enforcePermission(user, 'view_reports');

    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('job_id');
    const vehicleId = searchParams.get('vehicle_id');
    const mechanicId = searchParams.get('mechanic_id');
    const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 25, 1), 50);

    const filter: any = {};
    if (jobId) filter.job_id = Number(jobId);
    if (vehicleId) filter.vehicle_id = Number(vehicleId);
    if (mechanicId) filter.mechanic_id = Number(mechanicId);

    const collection = await getRepairReportsCollection();
    const reports = await collection.find(filter).sort({ created_at: -1 }).limit(limit).toArray();

    return jsonSuccess({
      reports,
      count: reports.length
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    enforcePermission(user, 'create_reports');

    const rawBody = await req.json().catch(() => ({}));
    // Enforce current mechanic id if role is mechanic
    if (user.role === 'mechanic') {
      rawBody.mechanic_id = user.user_id;
    }

    const validatedDoc = validateRepairReport(rawBody);

    const collection = await getRepairReportsCollection();
    const insertResult = await collection.insertOne(validatedDoc as any);
    const mongoId = insertResult.insertedId.toString();

    // Cross-paradigm integration: update MySQL service_jobs.mongo_report_id
    await execute(
      `UPDATE service_jobs SET mongo_report_id = ? WHERE job_id = ?`,
      [mongoId, validatedDoc.job_id]
    );

    return jsonCreated({
      report: {
        _id: mongoId,
        ...validatedDoc
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}

