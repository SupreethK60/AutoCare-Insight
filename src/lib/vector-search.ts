/**
 * Semantic Vector Search Engine for Vehicle Diagnostics & Repair Knowledge Base
 * 
 * Implements:
 * 1. Data converted into embeddings: Technician inspection notes, customer reported symptoms, fault descriptions
 * 2. Embedding approach: 64-dimensional semantic dense vectors normalized to unit length
 * 3. Vector storage: Stored in memory / MongoDB document field with indexing
 * 4. Similarity metric: Cosine Similarity: dot_product(v1, v2) / (|v1| * |v2|)
 * 5. Retrieval strategy: Top-K nearest vector ranking
 */

export interface DiagnosticVectorRecord {
  id: string;
  symptom: string;
  category: string;
  possibleCauses: string[];
  recommendedAction: string;
  suggestedParts: string[];
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  vector: number[];
}

// Vocabulary keywords for 64-dimensional semantic space
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
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
  const vector = new Array(64).fill(0);

  // Term frequency weighting
  words.forEach(word => {
    VOCABULARY.forEach((vocabWord, idx) => {
      if (word === vocabWord) {
        vector[idx] += 2.0;
      } else if (word.includes(vocabWord) || vocabWord.includes(word)) {
        vector[idx] += 1.0;
      }
    });

    // Secondary semantic hash distribution to handle out-of-vocabulary words
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = (hash << 5) - hash + word.charCodeAt(i);
      hash |= 0;
    }
    const bucket = Math.abs(hash) % 64;
    vector[bucket] += 0.5;
  });

  // Calculate Euclidean norm (L2 norm)
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude === 0) return vector;

  // Normalize to unit vector
  return vector.map(val => Number((val / magnitude).toFixed(6)));
}

/**
 * Calculates Cosine Similarity between two embedding vectors
 * Formula: dot_product(A, B) / (||A|| * ||B||)
 * Since vectors are unit-normalized, dot_product(A, B) equals cosine similarity
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
  }
  return Math.max(0, Math.min(1, dotProduct));
}

// Pre-embedded diagnostic knowledge base
const KNOWLEDGE_BASE_DATA: Omit<DiagnosticVectorRecord, 'vector'>[] = [
  {
    id: 'diag-001',
    symptom: 'High-pitched squealing or grinding noise when pressing brake pedal',
    category: 'Braking System',
    possibleCauses: ['Worn front/rear brake pads past wear indicators', 'Glazed or scored brake rotors', 'Dust accumulated in caliper slide pins'],
    recommendedAction: 'Inspect brake pad thickness; replace brake pad set and resurface/replace brake disc rotors if under minimum thickness spec.',
    suggestedParts: ['Front Brake Pad Set', 'Rear Brake Pad Set', 'Brake Fluid'],
    severity: 'High'
  },
  {
    id: 'diag-002',
    symptom: 'Engine ticking or tapping sound at idle, disappearing during higher RPM',
    category: 'Engine Lubrication',
    possibleCauses: ['Low engine oil volume', 'Degraded or sludged oil clogging hydraulic lifters', 'Blocked engine oil filter'],
    recommendedAction: 'Check dipstick oil level immediately. Perform engine flush, replace oil filter and refill with full synthetic 5W-30 oil.',
    suggestedParts: ['5W-30 Synthetic Oil 4L', 'Engine Oil Filter'],
    severity: 'Medium'
  },
  {
    id: 'diag-003',
    symptom: 'Vehicle vibrates or steering wheel shakes violently at highway speeds (80-110 km/h)',
    category: 'Steering & Suspension',
    possibleCauses: ['Unbalanced wheels or thrown wheel weights', 'Uneven tyre wear or flat spots', 'Misaligned front suspension tie rods'],
    recommendedAction: 'Perform 4-wheel computerised wheel balancing, alignment check, and inspect tyre tread depth for feathering.',
    suggestedParts: ['Tyre Rotation', 'Wheel Alignment', 'Tyre Pirelli 205/55 R16'],
    severity: 'Medium'
  },
  {
    id: 'diag-004',
    symptom: 'Air conditioning blows warm air or faintly cool air on maximum blower setting',
    category: 'Climate Control',
    possibleCauses: ['Low R134a/R1234yf refrigerant charge due to micro-leak', 'AC compressor clutch not engaging', 'Clogged cabin air filter'],
    recommendedAction: 'Perform AC manifold pressure test, dye leak detection check, vacuum evacuation and refrigerant gas recharge.',
    suggestedParts: ['Air Conditioning Service', 'Cabin Air Filter', 'Coolant 1L'],
    severity: 'Low'
  },
  {
    id: 'diag-005',
    symptom: 'Vehicle slow to crank or fails to start with rapid clicking noise',
    category: 'Electrical System',
    possibleCauses: ['Sulfated 12V automotive battery with low cold cranking amps', 'Loose or corroded battery terminal cables', 'Faulty starter motor solenoid'],
    recommendedAction: 'Conduct load conductance battery test. Clean terminal clamps with wire brush. Replace 12V battery if capacity under 60%.',
    suggestedParts: ['12V Car Battery 65Ah', 'Battery Terminal Spray'],
    severity: 'High'
  },
  {
    id: 'diag-006',
    symptom: 'Engine misfire under acceleration, check engine light flashing, loss of power',
    category: 'Ignition & Fuel',
    possibleCauses: ['Fouled or worn iridium spark plugs', 'Failed ignition coil pack', 'Clogged fuel injector nozzle'],
    recommendedAction: 'Read OBD-II error codes (P0300-P0304). Replace spark plugs, check coil resistance, and run fuel injector cleaner.',
    suggestedParts: ['NGK Spark Plug', 'Ignition Coil', 'Fuel Injector Cleaner'],
    severity: 'Critical'
  },
  {
    id: 'diag-007',
    symptom: 'Transmission hesitates, slips or revs high before engaging next gear',
    category: 'Transmission',
    possibleCauses: ['Burned or low automatic transmission fluid (ATF)', 'Clogged transmission valve body or solenoid malfunction', 'Worn internal clutch packs'],
    recommendedAction: 'Check transmission dipstick for brownish burned fluid. Perform full transmission fluid flush and filter replacement.',
    suggestedParts: ['Transmission Service', 'ATF Synthetic Fluid', 'Transmission Filter'],
    severity: 'Critical'
  },
  {
    id: 'diag-008',
    symptom: 'Vehicle pulls significantly to one side when driving on a flat straight road',
    category: 'Steering & Suspension',
    possibleCauses: ['Unequal tyre pressure between left and right wheels', 'Camber or toe out of factory specification', 'Dragging brake caliper on one side'],
    recommendedAction: 'Check cold tyre PSI, perform computerized 4-wheel alignment and inspect brake calipers for sticking pistons.',
    suggestedParts: ['Wheel Alignment', 'Tyre Pressure Sensor'],
    severity: 'Medium'
  }
];

export const DIAGNOSTIC_VECTORS: DiagnosticVectorRecord[] = KNOWLEDGE_BASE_DATA.map(item => ({
  ...item,
  vector: generateEmbedding(`${item.symptom} ${item.category} ${item.possibleCauses.join(' ')}`)
}));

export interface VectorSearchResult extends DiagnosticVectorRecord {
  similarityScore: number;
  matchPercentage: string;
}

/**
 * Searches the diagnostic knowledge base using cosine similarity
 */
export function searchDiagnosticKnowledgeBase(query: string, topK: number = 3): VectorSearchResult[] {
  if (!query || query.trim().length === 0) return [];
  const queryVector = generateEmbedding(query);

  const scored = DIAGNOSTIC_VECTORS.map(record => {
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

