const test = require('node:test');
const assert = require('node:assert/strict');
const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DB_NAME || 'autocare_db';

test('MongoDB Aggregation Pipeline Runner Tests', async (t) => {
  let client;
  let collection;

  t.before(async () => {
    client = new MongoClient(MONGO_URI);
    await client.connect();
    collection = client.db(DB_NAME).collection('repair_reports');
  });

  t.after(async () => {
    if (client) await client.close();
  });

  await t.test('Registry contains all 7 approved aggregation pipelines', async () => {
    const { MONGO_AGGREGATIONS } = require('../src/lib/db/mongodb-aggregations.ts');
    const pipelineKeys = Object.keys(MONGO_AGGREGATIONS);
    assert.equal(pipelineKeys.length, 7, 'Expected exactly 7 aggregation pipelines');
  });

  await t.test('All pipelines execute successfully against live MongoDB repair_reports', async () => {
    const { MONGO_AGGREGATIONS } = require('../src/lib/db/mongodb-aggregations.ts');

    for (const [id, def] of Object.entries(MONGO_AGGREGATIONS)) {
      assert.ok(def.id, `Pipeline ${id} must have an ID`);
      assert.ok(def.title, `Pipeline ${id} must have a title`);
      assert.ok(def.description, `Pipeline ${id} must have a description`);
      assert.ok(Array.isArray(def.stages) && def.stages.length > 0, `Pipeline ${id} must define stages`);
      assert.ok(typeof def.buildPipeline === 'function', `Pipeline ${id} must have buildPipeline`);

      const pipeline = def.buildPipeline({ min_cost: 500 });
      assert.ok(Array.isArray(pipeline), `Pipeline ${id} must produce array`);

      const results = await collection.aggregate(pipeline).toArray();
      assert.ok(Array.isArray(results), `Pipeline ${id} execution must return an array`);
    }
  });
});
