const test = require('node:test');
const assert = require('node:assert/strict');

test('Diagnostic Semantic / Vector Similarity Search Tests', async (t) => {
  const {
    generateEmbedding,
    cosineSimilarity,
    searchSemanticDiagnostics,
    EMBEDDING_MODEL_NAME,
    EMBEDDING_DIMENSIONS
  } = require('../src/lib/vector-search.ts');

  await t.test('Model specification and dimensions are verified', () => {
    assert.equal(EMBEDDING_MODEL_NAME, 'autocare-semantic-dense-64d');
    assert.equal(EMBEDDING_DIMENSIONS, 64);
  });

  await t.test('generateEmbedding produces a normalized 64-dimensional vector', () => {
    const text = 'Squealing noise when pressing the brake pedal';
    const vec = generateEmbedding(text);

    assert.equal(vec.length, 64, 'Vector must be 64-dimensional');

    // Check L2 norm (magnitude) is approximately 1.0
    const magnitude = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
    assert.ok(Math.abs(magnitude - 1.0) < 0.01, `Magnitude ${magnitude} should be close to 1.0`);
  });

  await t.test('cosineSimilarity computes mathematical dot product of unit vectors', () => {
    const v1 = generateEmbedding('Brake pads worn and grinding');
    const v2 = generateEmbedding('Brake pads worn and grinding');
    const v3 = generateEmbedding('Air conditioning compressor warm');

    const simSelf = cosineSimilarity(v1, v2);
    assert.ok(Math.abs(simSelf - 1.0) < 0.01, 'Self-similarity must equal 1.0');

    const simDiff = cosineSimilarity(v1, v3);
    assert.ok(simDiff >= 0.0 && simDiff <= 1.0, 'Similarity must be bounded in [0, 1]');
    assert.ok(simDiff < simSelf, 'Different concepts must have strictly lower similarity than self');
  });

  await t.test('searchSemanticDiagnostics returns ranked results with metadata', async () => {
    const query = 'Car shakes violently at highway speed and wheel vibrates';
    const results = await searchSemanticDiagnostics(query, 3, 'knowledge_base');

    assert.ok(results.length > 0, 'Must return matching results');
    assert.ok(results[0].similarityScore > 0, 'Top result must have positive similarity');
    assert.ok(results[0].matchPercentage.endsWith('%'), 'Must format match percentage string');
    assert.equal(results[0].category, 'Steering & Suspension', 'Should match Steering & Suspension category top');

    // Check descending ranking
    for (let i = 0; i < results.length - 1; i++) {
      assert.ok(
        results[i].similarityScore >= results[i + 1].similarityScore,
        'Results must be sorted descending by similarity score'
      );
    }
  });

  await t.test('search handles empty or whitespace queries gracefully', async () => {
    const results = await searchSemanticDiagnostics('', 3);
    assert.deepEqual(results, [], 'Empty query must return empty array');
  });
});
