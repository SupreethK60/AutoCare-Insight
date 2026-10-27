/**
 * AutoCare Insight — Semantic Vector Search Engine
 * 
 * Architecture:
 * 1. Semantic Embedding Space: 64-dimensional dense vectors normalized to unit length (L2 norm = 1.0)
 * 2. Tokenizer & Feature Extractor: Domain-specific automotive diagnostic lexicon + secondary semantic hashing
 * 3. Similarity Metric: Cosine Similarity: dot_product(v1, v2)
 * 4. Hybrid Corpus:
 *    a) Curated Diagnostic Knowledge Base (8 multi-system reference records)
 *    b) Dynamic MongoDB Repair Reports Index (live extraction from repair_reports collection)
 */

export const EMBEDDING_MODEL_NAME = 'autocare-semantic-dense-64d';
export const EMBEDDING_DIMENSIONS = 64;

export interface DiagnosticVectorRecord {
  id: string;
  source: 'knowledge_base' | 'mongodb_report';
  symptom: string;
  category: string;
  possibleCauses: string[];
  recommendedAction: string;
  suggestedParts: string[];
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  reportId?: string;
  jobId?: number;
  vehicleId?: number;
  vector: number[];
}

export interface VectorSearchResult extends DiagnosticVectorRecord {
  similarityScore: number;
  matchPercentage: string;
}

// Domain automotive diagnostic lexicon
const VOCABULARY: string[] = [
  'brake', 'squeal', 'grinding', 'pedal', 'rotor', 'pad', 'abs', 'fluid',
  'engine', 'misfire', 'knocking', 'ticking', 'oil', 'pressure', 'overheating', 'coolant',
  'transmission', 'slipping', 'gear', 'clutch', 'shudder', 'delay', 'fluid', 'shift',
  'battery', 'charging', 'alternator', 'drain', 'voltage', 'starter', 'hybrid', 'electric',
  'suspension', 'vibration', 'steering', 'pulling', 'wobble', 'strut', 'alignment', 'tyre',
  'exhaust', 'smoke', 'odour', 'catalytic', 'converter', 'emissions', 'leak', 'rattle',
  'ac', 'air', 'conditioning', 'heating', 'compressor', 'blower', 'warm', 'refrigerant',
  'fuel', 'economy', 'consumption', 'filter', 'injector', 'pump', 'spark', 'plug'
];

/**
 * Generates a normalized 64-dimensional dense semantic embedding vector
 */
export function generateEmbedding(text: string): number[] {
  if (!text || typeof text !== 'string') {
    return new Array(EMBEDDING_DIMENSIONS).fill(0);
  }

  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  const vector = new Array(EMBEDDING_DIMENSIONS).fill(0);

  // Term frequency weighting against automotive diagnostic lexicon
  words.forEach((word) => {
    VOCABULARY.forEach((vocabWord, idx) => {
      if (word === vocabWord) {
        vector[idx] += 2.0;
      } else if (word.includes(vocabWord) || vocabWord.includes(word)) {
        vector[idx] += 1.0;
      }
    });

    // Secondary semantic hash distribution to handle arbitrary terms & DTC codes
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = (hash << 5) - hash + word.charCodeAt(i);
      hash |= 0;
    }
    const bucket = Math.abs(hash) % EMBEDDING_DIMENSIONS;
    vector[bucket] += 0.5;
  });

  // Calculate Euclidean norm (L2 norm)
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude === 0) return vector;

  // Normalize to unit vector
  return vector.map((val) => Number((val / magnitude).toFixed(6)));
}

/**
 * Calculates Cosine Similarity between two unit-normalized embedding vectors
 * Formula: dot_product(A, B)
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) return 0;
  let dotProduct = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
  }
  return Math.max(0, Math.min(1, dotProduct));
}

// Curated Knowledge Base Records
const KNOWLEDGE_BASE_DATA: Omit<DiagnosticVectorRecord, 'vector' | 'source'>[] = [
  {
    id: 'kb-001',
    symptom: 'High-pitched squealing or grinding noise when pressing brake pedal with spongy feel',
    category: 'Braking System',
    possibleCauses: ['Worn front/rear brake pads past wear indicators', 'Glazed or scored brake disc rotors', 'Air trapped in hydraulic brake lines'],
    recommendedAction: 'Inspect brake pad thickness; replace brake pad set and resurface/replace brake disc rotors if under minimum thickness spec.',
    suggestedParts: ['Front Brake Pad Set', 'Rear Brake Pad Set', 'Dot 4 Brake Fluid'],
    severity: 'High'
  },
  {
    id: 'kb-002',
    symptom: 'Engine ticking or tapping sound at idle, disappearing during higher RPM, low oil level',
    category: 'Engine Lubrication',
    possibleCauses: ['Low engine oil volume', 'Degraded or sludged oil clogging hydraulic lifters', 'Blocked engine oil filter'],
    recommendedAction: 'Check dipstick oil level immediately. Perform engine flush, replace oil filter and refill with full synthetic 5W-30 oil.',
    suggestedParts: ['5W-30 Synthetic Oil 4L', 'Engine Oil Filter'],
    severity: 'Medium'
  },
  {
    id: 'kb-003',
    symptom: 'Vehicle vibrates or steering wheel shakes violently at highway speeds (80-110 km/h) while accelerating',
    category: 'Steering & Suspension',
    possibleCauses: ['Unbalanced wheels or thrown wheel weights', 'Uneven tyre wear or flat spots', 'Misaligned front suspension tie rods'],
    recommendedAction: 'Perform 4-wheel computerised wheel balancing, alignment check, and inspect tyre tread depth for feathering.',
    suggestedParts: ['Wheel Balancing Service', 'Wheel Alignment', 'Tyre Pirelli 205/55 R16'],
    severity: 'Medium'
  },
  {
    id: 'kb-004',
    symptom: 'Air conditioning blows warm air or faintly cool air on maximum blower setting with hiss',
    category: 'Climate Control',
    possibleCauses: ['Low R134a/R1234yf refrigerant charge due to micro-leak', 'AC compressor clutch not engaging', 'Clogged cabin air filter'],
    recommendedAction: 'Perform AC manifold pressure test, dye leak detection check, vacuum evacuation and refrigerant gas recharge.',
    suggestedParts: ['Air Conditioning Service', 'Cabin Air Filter', 'Coolant 1L'],
    severity: 'Low'
  },
  {
    id: 'kb-005',
    symptom: 'Vehicle slow to crank or fails to start with rapid clicking noise and dim instrument lights',
    category: 'Electrical System',
    possibleCauses: ['Sulfated 12V automotive battery with low cold cranking amps', 'Loose or corroded battery terminal cables', 'Faulty starter motor solenoid'],
    recommendedAction: 'Conduct load conductance battery test. Clean terminal clamps with wire brush. Replace 12V battery if capacity under 60%.',
    suggestedParts: ['12V Car Battery 65Ah', 'Battery Terminal Cleaner'],
    severity: 'High'
  },
  {
    id: 'kb-006',
    symptom: 'Engine misfire under acceleration, check engine light flashing, loss of power and shudder',
    category: 'Ignition & Fuel',
    possibleCauses: ['Fouled or worn iridium spark plugs', 'Failed ignition coil pack', 'Clogged fuel injector nozzle'],
    recommendedAction: 'Read OBD-II error codes (P0300-P0304). Replace spark plugs, check coil resistance, and run fuel injector cleaner.',
    suggestedParts: ['NGK Spark Plug', 'Ignition Coil', 'Fuel Injector Cleaner'],
    severity: 'Critical'
  },
  {
    id: 'kb-007',
    symptom: 'Transmission hesitates, slips or revs high before engaging next gear with shudder',
    category: 'Transmission',
    possibleCauses: ['Burned or low automatic transmission fluid (ATF)', 'Clogged transmission valve body or solenoid malfunction', 'Worn internal clutch packs'],
    recommendedAction: 'Check transmission dipstick for brownish burned fluid. Perform full transmission fluid flush and filter replacement.',
    suggestedParts: ['Transmission Flush Service', 'ATF Synthetic Fluid', 'Transmission Filter'],
    severity: 'Critical'
  },
  {
    id: 'kb-008',
    symptom: 'Vehicle pulls significantly to one side when driving on a flat straight road',
    category: 'Steering & Suspension',
    possibleCauses: ['Unequal tyre pressure between left and right wheels', 'Camber or toe out of factory specification', 'Dragging brake caliper on one side'],
    recommendedAction: 'Check cold tyre PSI, perform computerized 4-wheel alignment and inspect brake calipers for sticking pistons.',
    suggestedParts: ['Wheel Alignment', 'Tyre Pressure Sensor'],
    severity: 'Medium'
  }
];

// Pre-compute vectors for the Knowledge Base
export const KNOWLEDGE_BASE_VECTORS: DiagnosticVectorRecord[] = KNOWLEDGE_BASE_DATA.map((item) => ({
  ...item,
  source: 'knowledge_base',
  vector: generateEmbedding(`${item.symptom} ${item.category} ${item.possibleCauses.join(' ')}`)
}));

/**
 * Dynamically indexes live MongoDB repair reports into vector records
 */
export async function getLiveMongoReportVectors(): Promise<DiagnosticVectorRecord[]> {
  try {
    const { getRepairReportsCollection } = await import('@/lib/db/mongodb');
    const collection = await getRepairReportsCollection();
    const reports = await collection.find({}).limit(50).toArray();

    return reports.map((r: any) => {
      const findingsSummary = (r.findings || [])
        .map((f: any) => `${f.system}: ${f.finding} (${f.condition}) - ${f.action_recommended || ''}`)
        .join('. ');

      const dtcSummary = (r.diagnostic_codes || []).join(' ');
      const textToEmbed = `${findingsSummary} ${r.technician_notes || ''} ${dtcSummary}`.trim();

      const topFinding = (r.findings && r.findings[0]) || {};

      return {
        id: `mongo-${r._id.toString()}`,
        source: 'mongodb_report',
        reportId: r._id.toString(),
        jobId: r.job_id,
        vehicleId: r.vehicle_id,
        symptom: r.technician_notes || findingsSummary.slice(0, 120),
        category: topFinding.system || 'Multi-Point Inspection',
        possibleCauses: (r.findings || []).map((f: any) => `${f.system} reported as ${f.condition}`),
        recommendedAction: (r.recommendations && r.recommendations[0]) || topFinding.action_recommended || 'Follow regular service schedule',
        suggestedParts: (r.findings || []).filter((f: any) => f.cost_estimate > 0).map((f: any) => `${f.system} components`),
        severity: r.overall_health_score < 70 ? 'Critical' : r.overall_health_score < 80 ? 'High' : 'Medium',
        vector: generateEmbedding(textToEmbed)
      };
    });
  } catch (err) {
    console.error('Failed to load MongoDB repair reports for vector search:', err);
    return [];
  }
}

/**
 * Searches the unified vector index using Cosine Similarity
 */
export async function searchSemanticDiagnostics(
  query: string,
  topK: number = 4,
  scope: 'all' | 'knowledge_base' | 'mongodb_report' = 'all'
): Promise<VectorSearchResult[]> {
  if (!query || query.trim().length === 0) return [];

  const queryVector = generateEmbedding(query);

  let corpus: DiagnosticVectorRecord[] = [];
  if (scope === 'all' || scope === 'knowledge_base') {
    corpus = [...corpus, ...KNOWLEDGE_BASE_VECTORS];
  }
  if (scope === 'all' || scope === 'mongodb_report') {
    const mongoVectors = await getLiveMongoReportVectors();
    corpus = [...corpus, ...mongoVectors];
  }

  const scored = corpus.map((record) => {
    const score = cosineSimilarity(queryVector, record.vector);
    return {
      ...record,
      similarityScore: score,
      matchPercentage: `${(score * 100).toFixed(1)}%`
    };
  });

  return scored
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, topK);
}
