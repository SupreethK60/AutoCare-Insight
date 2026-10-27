const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const mysql = require('mysql2/promise');
const { MongoClient } = require('mongodb');

describe('Database Integration Tests (Live MySQL & MongoDB)', () => {
  let dbConn;
  let mongoClient;
  let mongoDb;

  before(async () => {
    // MySQL connection
    dbConn = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      port: Number(process.env.MYSQL_PORT) || 3306,
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || 'Simha@1234',
      database: process.env.MYSQL_DATABASE || 'autocare_insight'
    });

    // MongoDB connection
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/autocare_db';
    mongoClient = new MongoClient(mongoUri);
    await mongoClient.connect();
    mongoDb = mongoClient.db(process.env.MONGODB_DB_NAME || 'autocare_db');
  });

  after(async () => {
    if (dbConn) await dbConn.end();
    if (mongoClient) await mongoClient.close();
  });

  it('MySQL: should successfully query all 6 initial users with correct roles', async () => {
    const [rows] = await dbConn.execute('SELECT user_id, full_name, role FROM users ORDER BY user_id ASC');
    assert.strictEqual(rows.length, 6);
    assert.strictEqual(rows[0].role, 'admin');
    assert.strictEqual(rows[1].role, 'service_advisor');
    assert.strictEqual(rows[3].role, 'mechanic');
  });

  it('MySQL: should query vehicle catalogue containing > 3000 imported models', async () => {
    const [rows] = await dbConn.execute('SELECT COUNT(*) AS total FROM vehicle_catalogue');
    assert.ok(rows[0].total >= 3000, `Expected >= 3000 models, found ${rows[0].total}`);
  });

  it('MySQL: should execute stored procedure sp_get_customer_vehicle_history', async () => {
    const [result] = await dbConn.execute('CALL sp_get_customer_vehicle_history(1)');
    const records = result[0];
    assert.ok(Array.isArray(records));
    assert.ok(records.length > 0);
    assert.strictEqual(records[0].job_id, 1);
    assert.strictEqual(records[0].payment_status, 'paid');
  });

  it('MySQL: should execute stored function fn_invoice_total_paid', async () => {
    const [rows] = await dbConn.execute('SELECT fn_invoice_total_paid(1) AS paid_total');
    assert.strictEqual(Number(rows[0].paid_total), 2183.00);
  });

  it('MySQL: should execute stored function fn_days_since_last_service', async () => {
    const [rows] = await dbConn.execute('SELECT fn_days_since_last_service(1) AS days');
    assert.ok(Number(rows[0].days) >= 0);
  });

  it('MySQL View: vw_inventory_low_stock should isolate parts below reorder level', async () => {
    const [rows] = await dbConn.execute('SELECT * FROM vw_inventory_low_stock');
    assert.ok(rows.length > 0);
    rows.forEach(part => {
      assert.ok(part.qty_in_stock <= part.reorder_level);
    });
  });

  it('MongoDB: should query repair_reports collection with polymorphic findings', async () => {
    const reports = await mongoDb.collection('repair_reports').find({}).toArray();
    assert.ok(reports.length >= 3);
    const report1 = reports.find(r => r.job_id === 1);
    assert.ok(report1);
    assert.ok(Array.isArray(report1.findings));
    assert.strictEqual(report1.findings[0].system, 'Engine');
  });

  it('MongoDB Aggregation: should calculate fleet health statistics via aggregation pipeline', async () => {
    const metrics = await mongoDb.collection('repair_reports').aggregate([
      {
        $group: {
          _id: null,
          avgHealth: { $avg: '$overall_health_score' },
          totalReports: { $sum: 1 }
        }
      }
    ]).toArray();

    assert.ok(metrics.length > 0);
    assert.ok(metrics[0].avgHealth > 60);
    assert.ok(metrics[0].totalReports >= 3);
  });
});

