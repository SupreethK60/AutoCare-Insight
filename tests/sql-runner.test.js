const test = require('node:test');
const assert = require('node:assert/strict');
const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: Number(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'Simha@1234',
  database: process.env.MYSQL_DATABASE || 'autocare_insight'
};

test('Interactive SQL Query Runner & Registry Tests', async (t) => {
  let pool;

  t.before(async () => {
    pool = mysql.createPool(DB_CONFIG);
  });

  t.after(async () => {
    if (pool) await pool.end();
  });

  await t.test('Registry contains at least 18 distinct, educational SQL queries', async () => {
    // Dynamic import of TypeScript / compiled or required queries
    const { SQL_QUERY_REGISTRY } = require('../src/lib/db/query-registry.ts');
    const queryKeys = Object.keys(SQL_QUERY_REGISTRY);
    assert.ok(queryKeys.length >= 18, `Expected at least 18 queries, found ${queryKeys.length}`);
  });

  await t.test('All registered queries have required metadata and valid SQL syntax', async () => {
    const { SQL_QUERY_REGISTRY } = require('../src/lib/db/query-registry.ts');

    for (const [key, q] of Object.entries(SQL_QUERY_REGISTRY)) {
      assert.ok(q.id, `Query ${key} must have an ID`);
      assert.ok(q.title, `Query ${key} must have a title`);
      assert.ok(q.description, `Query ${key} must have a description`);
      assert.ok(q.category, `Query ${key} must have a category`);
      assert.ok(Array.isArray(q.concepts) && q.concepts.length > 0, `Query ${key} must have concepts`);
      assert.ok(typeof q.buildQuery === 'function', `Query ${key} must have a buildQuery function`);

      // Test buildQuery
      const { sql, values } = q.buildQuery({});
      assert.ok(typeof sql === 'string' && sql.trim().length > 0, `Query ${key} must produce SQL`);
      assert.ok(Array.isArray(values), `Query ${key} values must be an array`);

      // Execute safely against live MySQL
      const [rows] = await pool.query(sql, values);
      assert.ok(Array.isArray(rows), `Query ${key} must return row array`);
    }
  });

  await t.test('Advanced Views (vw_customer_fleet_overview, vw_technician_performance, vw_invoice_settlement_audit) are accessible', async () => {
    const [views] = await pool.query(`SHOW FULL TABLES WHERE Table_type = 'VIEW'`);
    const viewNames = views.map(v => Object.values(v)[0]);
    assert.ok(viewNames.includes('vw_customer_fleet_overview'), 'vw_customer_fleet_overview must exist');
    assert.ok(viewNames.includes('vw_technician_performance'), 'vw_technician_performance must exist');
    assert.ok(viewNames.includes('vw_invoice_settlement_audit'), 'vw_invoice_settlement_audit must exist');
  });
});

