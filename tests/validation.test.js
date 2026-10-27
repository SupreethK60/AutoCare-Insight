const { describe, it } = require('node:test');
const assert = require('node:assert');

// Test validation logic
describe('Repair Report Schema Validation Tests', () => {
  const VALID_CONDITIONS = ['Good', 'Fair', 'Worn', 'Damaged', 'Critical'];

  function validateReportInput(data) {
    const errors = {};
    if (!data.job_id || isNaN(Number(data.job_id))) errors.job_id = 'Missing job_id';
    if (!data.vehicle_id || isNaN(Number(data.vehicle_id))) errors.vehicle_id = 'Missing vehicle_id';
    if (!data.mechanic_id || isNaN(Number(data.mechanic_id))) errors.mechanic_id = 'Missing mechanic_id';

    if (data.overall_health_score !== undefined) {
      const score = Number(data.overall_health_score);
      if (isNaN(score) || score < 0 || score > 100) {
        errors.overall_health_score = 'Invalid health score (must be 0-100)';
      }
    }

    if (data.findings && Array.isArray(data.findings)) {
      data.findings.forEach((f, idx) => {
        if (!f.system) errors[`findings[${idx}].system`] = 'Missing system';
        if (!f.condition || !VALID_CONDITIONS.includes(f.condition)) {
          errors[`findings[${idx}].condition`] = 'Invalid condition enum';
        }
      });
    }

    return { isValid: Object.keys(errors).length === 0, errors };
  }

  it('should accept a completely valid multi-point inspection report', () => {
    const validData = {
      job_id: 1,
      vehicle_id: 1,
      mechanic_id: 4,
      overall_health_score: 92,
      findings: [
        { system: 'Brakes', condition: 'Worn', action_taken: 'Replaced pads' },
        { system: 'Engine', condition: 'Good' }
      ]
    };
    const res = validateReportInput(validData);
    assert.strictEqual(res.isValid, true);
    assert.strictEqual(Object.keys(res.errors).length, 0);
  });

  it('should reject reports with missing mandatory foreign keys', () => {
    const invalid = { overall_health_score: 80 };
    const res = validateReportInput(invalid);
    assert.strictEqual(res.isValid, false);
    assert.ok(res.errors.job_id);
    assert.ok(res.errors.vehicle_id);
    assert.ok(res.errors.mechanic_id);
  });

  it('should reject reports with invalid health scores (< 0 or > 100)', () => {
    const invalid = { job_id: 1, vehicle_id: 1, mechanic_id: 4, overall_health_score: 150 };
    const res = validateReportInput(invalid);
    assert.strictEqual(res.isValid, false);
    assert.ok(res.errors.overall_health_score);
  });

  it('should reject findings with invalid condition enum values', () => {
    const invalid = {
      job_id: 1,
      vehicle_id: 1,
      mechanic_id: 4,
      findings: [{ system: 'Tyres', condition: 'BrokenBeyondRepair' }]
    };
    const res = validateReportInput(invalid);
    assert.strictEqual(res.isValid, false);
    assert.ok(res.errors['findings[0].condition']);
  });
});

