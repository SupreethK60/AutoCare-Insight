import { MongoClient, Db, Collection } from 'mongodb';
import { DatabaseError } from './errors';
import { MongoRepairReport } from '../../types';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/autocare_db';
const dbName = process.env.MONGODB_DB_NAME || 'autocare_db';

interface GlobalWithMongo {
  _mongoClientPromise?: Promise<MongoClient>;
}

const globalWithMongo = global as unknown as GlobalWithMongo;

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  if (!globalWithMongo._mongoClientPromise) {
    const client = new MongoClient(uri, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000
    });
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  const client = new MongoClient(uri, {
    maxPoolSize: 10,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 5000
  });
  clientPromise = client.connect();
}

export async function getMongoDb(): Promise<Db> {
  try {
    const client = await clientPromise;
    return client.db(dbName);
  } catch (err: any) {
    console.error('[MongoDB Connection Failure]', err.message);
    throw new DatabaseError('MongoDB service currently unavailable', 'MONGO_CONNECTION_FAILURE');
  }
}

export async function getRepairReportsCollection(): Promise<Collection<MongoRepairReport>> {
  const db = await getMongoDb();
  return db.collection<MongoRepairReport>('repair_reports');
}

