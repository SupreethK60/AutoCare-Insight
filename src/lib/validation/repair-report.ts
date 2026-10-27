import { ValidationError } from '../db/errors';
import { MongoRepairReport, FindingItem, PartReplacedItem } from '../../types';

const VALID_CONDITIONS = ['Good', 'Fair', 'Worn', 'Damaged', 'Critical'] as const;

export function validateRepairReport(data: any): Omit<MongoRepairReport, '_id'> {
  const errors: Record<string, string> = {};

  if (!data || typeof data !== 'object') {
    throw new ValidationError('Repair report data must be an object');
  }

  const jobId = Number(data.job_id);
  if (!jobId || isNaN(jobId) || jobId <= 0) {
    errors['job_id'] = 'Valid integer job_id is required';
  }

  const vehicleId = Number(data.vehicle_id);
  if (!vehicleId || isNaN(vehicleId) || vehicleId <= 0) {
    errors['vehicle_id'] = 'Valid integer vehicle_id is required';
  }

  const mechanicId = Number(data.mechanic_id);
  if (!mechanicId || isNaN(mechanicId) || mechanicId <= 0) {
    errors['mechanic_id'] = 'Valid integer mechanic_id is required';
  }

  // Validate findings array if provided
  const findings: FindingItem[] = [];
  if (data.findings !== undefined) {
    if (!Array.isArray(data.findings)) {
      errors['findings'] = 'Findings must be an array';
    } else {
      data.findings.forEach((item: any, idx: number) => {
        if (!item || typeof item !== 'object') {
          errors[`findings[${idx}]`] = 'Finding item must be an object';
          return;
        }
        if (!item.system || typeof item.system !== 'string' || item.system.trim().length === 0) {
          errors[`findings[${idx}].system`] = 'System name is required';
        }
        if (!item.condition || !VALID_CONDITIONS.includes(item.condition)) {
          errors[`findings[${idx}].condition`] = `Condition must be one of: ${VALID_CONDITIONS.join(', ')}`;
        }
        findings.push({
          system: String(item.system).trim(),
          condition: item.condition,
          action_taken: item.action_taken ? String(item.action_taken).trim() : undefined,
          recommendation: item.recommendation ? String(item.recommendation).trim() : undefined
        });
      });
    }
  }

  // Validate parts_replaced array if provided
  const partsReplaced: PartReplacedItem[] = [];
  if (data.parts_replaced !== undefined) {
    if (!Array.isArray(data.parts_replaced)) {
      errors['parts_replaced'] = 'parts_replaced must be an array';
    } else {
      data.parts_replaced.forEach((item: any, idx: number) => {
        if (!item || typeof item !== 'object') {
          errors[`parts_replaced[${idx}]`] = 'Part item must be an object';
          return;
        }
        const qty = Number(item.qty);
        if (isNaN(qty) || qty <= 0) {
          errors[`parts_replaced[${idx}].qty`] = 'Quantity must be a positive number';
        }
        partsReplaced.push({
          part_id: item.part_id ? Number(item.part_id) : undefined,
          part_name: item.part_name ? String(item.part_name).trim() : 'Unnamed Part',
          qty: qty || 1
        });
      });
    }
  }

  // Validate overall health score if provided
  let healthScore: number | undefined;
  if (data.overall_health_score !== undefined && data.overall_health_score !== null && data.overall_health_score !== '') {
    healthScore = Number(data.overall_health_score);
    if (isNaN(healthScore) || healthScore < 0 || healthScore > 100) {
      errors['overall_health_score'] = 'Overall health score must be an integer between 0 and 100';
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Validation failed for repair report', errors);
  }

  return {
    job_id: jobId,
    vehicle_id: vehicleId,
    mechanic_id: mechanicId,
    created_at: data.created_at ? new Date(data.created_at).toISOString() : new Date().toISOString(),
    mileage_at_service: data.mileage_at_service ? Number(data.mileage_at_service) : undefined,
    customer_complaints: data.customer_complaints ? String(data.customer_complaints).trim() : undefined,
    inspection_summary: data.inspection_summary ? String(data.inspection_summary).trim() : undefined,
    findings,
    parts_replaced: partsReplaced,
    photo_urls: Array.isArray(data.photo_urls) ? data.photo_urls.map(String) : [],
    repair_summary: data.repair_summary ? String(data.repair_summary).trim() : undefined,
    next_service_recommendations: data.next_service_recommendations ? String(data.next_service_recommendations).trim() : undefined,
    test_drive_notes: data.test_drive_notes ? String(data.test_drive_notes).trim() : undefined,
    overall_health_score: healthScore
  };
}

