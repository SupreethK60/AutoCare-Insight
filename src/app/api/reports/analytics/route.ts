import { NextRequest } from 'next/server';
import { getRepairReportsCollection } from '@/lib/db/mongodb';
import { requireAuth } from '@/lib/auth/session';
import { enforcePermission } from '@/lib/auth/rbac';
import { handleApiError, jsonSuccess } from '@/lib/utils/api-response';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    enforcePermission(user, 'view_reports');

    const collection = await getRepairReportsCollection();

    // MongoDB Aggregation Pipeline 1: Subsystem defects and condition breakdown
    const systemBreakdown = await collection.aggregate([
      { $unwind: '$findings' },
      {
        $group: {
          _id: {
            system: '$findings.system',
            condition: '$findings.condition'
          },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          system: '$_id.system',
          condition: '$_id.condition',
          count: 1
        }
      },
      { $sort: { count: -1, system: 1 } }
    ]).toArray();

    // MongoDB Aggregation Pipeline 2: Fleet Health Score Summary Metrics
    const healthMetrics = await collection.aggregate([
      {
        $group: {
          _id: null,
          totalReports: { $sum: 1 },
          averageHealthScore: { $avg: '$overall_health_score' },
          lowestHealthScore: { $min: '$overall_health_score' },
          highestHealthScore: { $max: '$overall_health_score' }
        }
      },
      {
        $project: {
          _id: 0,
          totalReports: 1,
          averageHealthScore: { $round: ['$averageHealthScore', 1] },
          lowestHealthScore: 1,
          highestHealthScore: 1
        }
      }
    ]).toArray();

    return jsonSuccess({
      analytics: {
        system_breakdown: systemBreakdown,
        fleet_health: healthMetrics.length > 0 ? healthMetrics[0] : null
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
