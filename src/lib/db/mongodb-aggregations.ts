import type { Document } from 'mongodb';

export interface AggregationDefinition {
  id: string;
  title: string;
  description: string;
  stages: string[];
  parameters?: {
    name: string;
    label: string;
    type: 'number' | 'string';
    defaultValue: any;
    description: string;
  }[];
  buildPipeline: (params: Record<string, any>) => Document[];
}

export const MONGO_AGGREGATIONS: Record<string, AggregationDefinition> = {
  vehicle_health_summary: {
    id: 'vehicle_health_summary',
    title: 'Fleet Vehicle Health Diagnostics & Score Distribution',
    description: 'Groups inspection documents by vehicle_id to calculate lifetime inspections count, average health score, minimum recorded score, and maximum health score.',
    stages: ['$group', '$project', '$sort'],
    buildPipeline: () => [
      {
        $group: {
          _id: '$vehicle_id',
          total_inspections: { $sum: 1 },
          avg_health_score: { $avg: '$overall_health_score' },
          min_health_score: { $min: '$overall_health_score' },
          max_health_score: { $max: '$overall_health_score' }
        }
      },
      {
        $project: {
          _id: 0,
          vehicle_id: '$_id',
          total_inspections: 1,
          avg_health_score: { $round: ['$avg_health_score', 1] },
          min_health_score: 1,
          max_health_score: 1
        }
      },
      { $sort: { avg_health_score: 1 } }
    ]
  },

  subsystem_defect_frequency: {
    id: 'subsystem_defect_frequency',
    title: 'Subsystem Defect & Condition Breakdown ($unwind)',
    description: 'Unwinds the polymorphic findings array to group observations by vehicle subsystem (Brakes, Engine, Suspension, etc.) and condition rating (Good, Fair, Worn, Damaged, Critical).',
    stages: ['$unwind', '$group', '$project', '$sort'],
    buildPipeline: () => [
      { $unwind: '$findings' },
      {
        $group: {
          _id: {
            system: '$findings.system',
            condition: '$findings.condition'
          },
          observation_count: { $sum: 1 },
          total_repair_cost: { $sum: { $ifNull: ['$findings.cost_estimate', 0] } }
        }
      },
      {
        $project: {
          _id: 0,
          subsystem: '$_id.system',
          condition: '$_id.condition',
          observation_count: 1,
          total_repair_cost: 1
        }
      },
      { $sort: { observation_count: -1, subsystem: 1 } }
    ]
  },

  condition_severity_distribution: {
    id: 'condition_severity_distribution',
    title: 'Severity Distribution & Estimated Repair Exposure',
    description: 'Aggregates multi-point inspection checkpoints across all vehicles to compute total financial repair exposure by condition category.',
    stages: ['$unwind', '$group', '$project', '$sort'],
    buildPipeline: () => [
      { $unwind: '$findings' },
      {
        $group: {
          _id: '$findings.condition',
          findings_count: { $sum: 1 },
          cumulative_cost_estimate: { $sum: { $ifNull: ['$findings.cost_estimate', 0] } },
          avg_point_cost: { $avg: { $ifNull: ['$findings.cost_estimate', 0] } }
        }
      },
      {
        $project: {
          _id: 0,
          condition: '$_id',
          findings_count: 1,
          cumulative_cost_estimate: 1,
          avg_point_cost: { $round: ['$avg_point_cost', 0] }
        }
      },
      { $sort: { cumulative_cost_estimate: -1 } }
    ]
  },

  common_dtc_fault_codes: {
    id: 'common_dtc_fault_codes',
    title: 'Most Frequent OBD-II Diagnostic Trouble Codes (DTCs)',
    description: 'Extracts and aggregates diagnostic trouble codes across all inspection reports to identify recurring electronic and mechanical failure patterns.',
    stages: ['$match', '$unwind', '$group', '$project', '$sort'],
    buildPipeline: () => [
      {
        $match: {
          diagnostic_codes: { $exists: true, $ne: [] }
        }
      },
      { $unwind: '$diagnostic_codes' },
      {
        $group: {
          _id: '$diagnostic_codes',
          occurrences: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          dtc_code: '$_id',
          occurrences: 1
        }
      },
      { $sort: { occurrences: -1 } }
    ]
  },

  inspections_over_time: {
    id: 'inspections_over_time',
    title: 'Monthly Inspection Volume & Quality Trend',
    description: 'Analyzes vehicle inspection throughput over monthly periods to track workshop diagnostic activity and average customer fleet health.',
    stages: ['$group', '$project', '$sort'],
    buildPipeline: () => [
      {
        $group: {
          _id: {
            $substr: [{ $ifNull: ['$created_at', '2025-05-01'] }, 0, 7]
          },
          inspections_completed: { $sum: 1 },
          average_health_score: { $avg: '$overall_health_score' }
        }
      },
      {
        $project: {
          _id: 0,
          month: '$_id',
          inspections_completed: 1,
          average_health_score: { $round: ['$average_health_score', 1] }
        }
      },
      { $sort: { month: -1 } }
    ]
  },

  mechanic_workload_metrics: {
    id: 'mechanic_workload_metrics',
    title: 'Mechanic Diagnostic Inspection Workload',
    description: 'Computes total reports signed off by each technician and evaluates average health scores assigned to detect inspection calibration variance.',
    stages: ['$group', '$project', '$sort'],
    buildPipeline: () => [
      {
        $group: {
          _id: '$mechanic_id',
          reports_filed: { $sum: 1 },
          avg_score_given: { $avg: '$overall_health_score' }
        }
      },
      {
        $project: {
          _id: 0,
          mechanic_id: '$_id',
          reports_filed: 1,
          avg_score_given: { $round: ['$avg_score_given', 1] }
        }
      },
      { $sort: { reports_filed: -1 } }
    ]
  },

  high_cost_findings: {
    id: 'high_cost_findings',
    title: 'Critical High-Cost Repair Recommendations ($match filter)',
    description: 'Filters and ranks individual component defects exceeding a specified repair cost threshold across the entire fleet.',
    stages: ['$unwind', '$match', '$project', '$sort', '$limit'],
    parameters: [
      {
        name: 'min_cost',
        label: 'Minimum Repair Cost (₹)',
        type: 'number',
        defaultValue: 1000,
        description: 'Lower bound filter for finding cost estimates'
      }
    ],
    buildPipeline: (params: Record<string, any>) => {
      const minCost = Number(params.min_cost) || 1000;
      return [
        { $unwind: '$findings' },
        {
          $match: {
            'findings.cost_estimate': { $gte: minCost }
          }
        },
        {
          $project: {
            _id: 0,
            job_id: '$job_id',
            vehicle_id: '$vehicle_id',
            subsystem: '$findings.system',
            condition: '$findings.condition',
            observation: '$findings.finding',
            action_recommended: '$findings.action_recommended',
            estimated_cost: '$findings.cost_estimate'
          }
        },
        { $sort: { estimated_cost: -1 } },
        { $limit: 25 }
      ];
    }
  }
};
