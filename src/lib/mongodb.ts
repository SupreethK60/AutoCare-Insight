import { MongoClient, Db, Collection } from 'mongodb';
import { MongoRepairReport } from '../types';
import { initialMongoReports } from './seed-data';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/autocare_db';
const dbName = process.env.MONGODB_DB_NAME || 'autocare_db';

let client: MongoClient | null = null;
let db: Db | null = null;
let isMongoAvailable = true;

// In-memory fallback for MongoDB reports
let fallbackReports: MongoRepairReport[] = [...initialMongoReports];

export async function getMongoDb(): Promise<Db | null> {
  if (!isMongoAvailable) return null;
  try {
    if (!client) {
      client = new MongoClient(uri, { serverSelectionTimeoutMS: 2000 });
      await client.connect();
      db = client.db(dbName);
    }
    return db;
  } catch (err: any) {
    console.warn(`[AutoCare Insight MongoDB] Host unavailable (${err.message}). Using resilient document store.`);
    isMongoAvailable = false;
    return null;
  }
}

export async function getRepairReportsCollection(): Promise<Collection<MongoRepairReport> | null> {
  const database = await getMongoDb();
  if (!database) return null;
  return database.collection<MongoRepairReport>('repair_reports');
}

/**
 * Fetch all repair reports
 */
export async function getAllRepairReports(): Promise<MongoRepairReport[]> {
  try {
    const col = await getRepairReportsCollection();
    if (col) {
      return (await col.find({}).toArray()) as unknown as MongoRepairReport[];
    }
  } catch {
    // Fall back to in-memory
  }
  return fallbackReports;
}

/**
 * Fetch a single repair report by MySQL job_id
 */
export async function getRepairReportByJobId(jobId: number): Promise<MongoRepairReport | null> {
  try {
    const col = await getRepairReportsCollection();
    if (col) {
      const doc = await col.findOne({ job_id: jobId });
      if (doc) return doc as unknown as MongoRepairReport;
    }
  } catch {
    // Fall back to in-memory
  }
  return fallbackReports.find(r => r.job_id === Number(jobId)) || null;
}

/**
 * Create or update a repair report
 */
export async function saveRepairReport(report: MongoRepairReport): Promise<MongoRepairReport> {
  try {
    const col = await getRepairReportsCollection();
    if (col) {
      const existing = await col.findOne({ job_id: report.job_id });
      if (existing) {
        await col.updateOne({ job_id: report.job_id }, { $set: report });
      } else {
        await col.insertOne(report as any);
      }
      return report;
    }
  } catch {
    // Fall back to in-memory
  }

  const idx = fallbackReports.findIndex(r => r.job_id === report.job_id);
  if (idx >= 0) {
    fallbackReports[idx] = { ...fallbackReports[idx], ...report };
  } else {
    fallbackReports.push({
      ...report,
      _id: `6648a1b2c3d4e5f60102030${fallbackReports.length + 4}`
    });
  }
  return report;
}

/**
 * MongoDB Aggregation Pipeline 1: Subsystem Health & Defect Analysis
 * Groups all findings by system and calculates condition counts
 */
export async function aggregateSystemConditions(): Promise<any[]> {
  try {
    const col = await getRepairReportsCollection();
    if (col) {
      return await col.aggregate([
        { $unwind: '$findings' },
        {
          $group: {
            _id: { system: '$findings.system', condition: '$findings.condition' },
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            system: '$_id.system',
            condition: '$_id.condition',
            count: 1,
            _id: 0
          }
        },
        { $sort: { count: -1 } }
      ]).toArray();
    }
  } catch {
    // Fall back
  }

  // Fallback aggregation computation
  const counts: Record<string, number> = {};
  fallbackReports.forEach(r => {
    r.findings.forEach(f => {
      const key = `${f.system} - ${f.condition}`;
      counts[key] = (counts[key] || 0) + 1;
    });
  });

  return Object.entries(counts).map(([label, count]) => {
    const [system, condition] = label.split(' - ');
    return { system, condition, count };
  });
}

/**
 * MongoDB Aggregation Pipeline 2: Overall Fleet Health Score Metrics
 */
export async function aggregateHealthMetrics(): Promise<any> {
  try {
    const col = await getRepairReportsCollection();
    if (col) {
      const result = await col.aggregate([
        {
          $group: {
            _id: null,
            averageHealthScore: { $avg: '$overall_health_score' },
            minScore: { $min: '$overall_health_score' },
            maxScore: { $max: '$overall_health_score' },
            totalInspections: { $sum: 1 }
          }
        }
      ]).toArray();
      if (result.length > 0) return result[0];
    }
  } catch {
    // Fall back
  }

  const scores = fallbackReports.map(r => r.overall_health_score || 80);
  const sum = scores.reduce((a, b) => a + b, 0);
  return {
    averageHealthScore: (sum / scores.length).toFixed(1),
    minScore: Math.min(...scores),
    maxScore: Math.max(...scores),
    totalInspections: scores.length
  };
}

