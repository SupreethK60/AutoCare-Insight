import { NextRequest } from 'next/server';
import { getRepairReportsCollection } from '@/lib/db/mongodb';
import { requireAuth } from '@/lib/auth/session';
import { enforcePermission } from '@/lib/auth/rbac';
import { NotFoundError, ValidationError } from '@/lib/db/errors';
import { handleApiError, jsonSuccess } from '@/lib/utils/api-response';

interface RouteContext {
  params: { jobId: string };
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const user = requireAuth(req);
    enforcePermission(user, 'view_reports');

    const jobId = Number(params.jobId);
    if (!jobId || isNaN(jobId)) {
      throw new ValidationError('Invalid job ID');
    }

    const collection = await getRepairReportsCollection();
    const report = await collection.findOne({ job_id: jobId });

    if (!report) {
      throw new NotFoundError(`No MongoDB repair report found for Service Job #${jobId}`);
    }

    return jsonSuccess({ report });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  try {
    const user = requireAuth(req);
    enforcePermission(user, 'create_reports');

    const jobId = Number(params.jobId);
    if (!jobId || isNaN(jobId)) {
      throw new ValidationError('Invalid job ID');
    }

    const body = await req.json().catch(() => ({}));
    const collection = await getRepairReportsCollection();

    const existing = await collection.findOne({ job_id: jobId });
    if (!existing) {
      throw new NotFoundError(`Repair report for Job #${jobId} not found`);
    }

    const updateFields: any = { updated_at: new Date().toISOString() };
    if (body.inspection_summary !== undefined) updateFields.inspection_summary = String(body.inspection_summary).trim();
    if (body.repair_summary !== undefined) updateFields.repair_summary = String(body.repair_summary).trim();
    if (body.next_service_recommendations !== undefined) updateFields.next_service_recommendations = String(body.next_service_recommendations).trim();
    if (body.test_drive_notes !== undefined) updateFields.test_drive_notes = String(body.test_drive_notes).trim();
    if (body.findings && Array.isArray(body.findings)) updateFields.findings = body.findings;
    if (body.parts_replaced && Array.isArray(body.parts_replaced)) updateFields.parts_replaced = body.parts_replaced;
    if (body.overall_health_score !== undefined) updateFields.overall_health_score = Number(body.overall_health_score);

    await collection.updateOne({ job_id: jobId }, { $set: updateFields });

    const updated = await collection.findOne({ job_id: jobId });
    return jsonSuccess({ report: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

