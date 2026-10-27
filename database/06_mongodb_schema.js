// ============================================================
// AutoCare Insight — MongoDB Collection Design
// File: 06_mongodb_schema.js
// ============================================================
// This file describes the MongoDB collection used for flexible
// inspection reports and repair notes, which cannot be structured
// rigidly in MySQL because every job has different findings.
//
// The relationship to MySQL:
//   service_jobs.mongo_report_id  ←→  repair_reports._id (as string)
//
// HOW TO USE:
//   1. Open MongoDB Compass (or mongosh)
//   2. Connect to: mongodb://localhost:27017
//   3. Create database:  use autocare_db
//   4. Run the validator block below to create a schema-validated collection
//   5. Insert the sample documents for testing
// ============================================================


// ─────────────────────────────────────────────────────────────
// STEP 1: Create the database and collection with schema
//         validation (JSON Schema, MongoDB 3.6+)
// ─────────────────────────────────────────────────────────────
use("autocare_db");

db.createCollection("repair_reports", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["job_id", "vehicle_id", "created_at", "mechanic_id"],
      description: "Must be a valid repair report linked to a MySQL service job",
      properties: {

        job_id: {
          bsonType: "int",
          description: "FK to MySQL service_jobs.job_id — required, must be integer"
        },

        vehicle_id: {
          bsonType: "int",
          description: "FK to MySQL customer_vehicles.vehicle_id — required"
        },

        mechanic_id: {
          bsonType: "int",
          description: "FK to MySQL users.user_id — required"
        },

        created_at: {
          bsonType: "date",
          description: "Timestamp of report creation — required"
        },

        mileage_at_service: {
          bsonType: "int",
          description: "Odometer reading when service was performed"
        },

        inspection_summary: {
          bsonType: "string",
          description: "Brief overall summary of the inspection"
        },

        findings: {
          bsonType: "array",
          description: "Array of individual system findings",
          items: {
            bsonType: "object",
            required: ["system", "condition"],
            properties: {
              system:      { bsonType: "string", description: "e.g. Brakes, Engine, Tyres" },
              condition:   { bsonType: "string", enum: ["Good", "Fair", "Worn", "Damaged", "Critical"], description: "Condition rating" },
              action_taken:{ bsonType: "string", description: "Action performed (if any)" },
              recommendation: { bsonType: "string", description: "Advice for future service" }
            }
          }
        },

        parts_replaced: {
          bsonType: "array",
          description: "Parts replaced, for cross-reference with MySQL part_usage",
          items: {
            bsonType: "object",
            properties: {
              part_id:   { bsonType: "int",    description: "FK to MySQL spare_parts.part_id" },
              part_name: { bsonType: "string" },
              qty:       { bsonType: "int" }
            }
          }
        },

        photo_urls: {
          bsonType: "array",
          description: "Array of URLs/paths to inspection photos",
          items: { bsonType: "string" }
        },

        customer_complaints: {
          bsonType: "string",
          description: "Customer-described problem at drop-off"
        },

        repair_summary: {
          bsonType: "string",
          description: "Mechanic's narrative of work done"
        },

        next_service_recommendations: {
          bsonType: "string",
          description: "Suggestions for the next visit"
        },

        test_drive_notes: {
          bsonType: "string",
          description: "Observations from post-repair test drive"
        },

        overall_health_score: {
          bsonType: "int",
          minimum: 0,
          maximum: 100,
          description: "Mechanic-assigned vehicle health score 0-100"
        }
      }
    }
  },
  validationAction: "warn"   // "warn" allows inserts above but logs; use "error" to enforce strictly
});


// ─────────────────────────────────────────────────────────────
// STEP 2: Create indexes on the collection
// ─────────────────────────────────────────────────────────────

// Index on job_id for fast lookup from MySQL job_id
db.repair_reports.createIndex({ job_id: 1 }, { unique: true });

// Index on vehicle_id for vehicle history queries
db.repair_reports.createIndex({ vehicle_id: 1 });

// Index on created_at for time-based queries
db.repair_reports.createIndex({ created_at: -1 });

// Text index for free-text search on notes
db.repair_reports.createIndex({
  inspection_summary: "text",
  repair_summary: "text",
  customer_complaints: "text",
  next_service_recommendations: "text"
}, { name: "report_text_search" });


// ─────────────────────────────────────────────────────────────
// STEP 3: Sample Documents (matching the sample MySQL job IDs)
// ─────────────────────────────────────────────────────────────

db.repair_reports.insertMany([
  {
    // Corresponds to MySQL service_jobs.job_id = 1, mongo_report_id = '6648a1b2c3d4e5f601020304'
    job_id:      1,
    vehicle_id:  1,    // Arjun's Acura NSX
    mechanic_id: 4,    // Suresh Mehta
    created_at:  new Date("2025-05-10T11:10:00Z"),
    mileage_at_service: 47510,
    customer_complaints: "Engine making a slight ticking noise for the last week.",
    inspection_summary: "Vehicle in good condition. Ticking resolved after oil change. No other issues found.",
    findings: [
      {
        system:        "Engine",
        condition:     "Fair",
        action_taken:  "Oil and filter changed (5W-30 synthetic). Resolved ticking.",
        recommendation: "Monitor for recurrence. Next oil change at 52,510 km."
      },
      {
        system:    "Brakes",
        condition: "Good",
        action_taken: null,
        recommendation: "Front pads at 70%, rear at 80%. Good for 15,000+ km."
      },
      {
        system:    "Tyres",
        condition: "Good",
        action_taken: null,
        recommendation: "Even wear. Rotation recommended at next service."
      },
      {
        system:    "Battery",
        condition: "Good",
        action_taken: null,
        recommendation: "12V battery voltage 12.6V at rest. Healthy."
      }
    ],
    parts_replaced: [
      { part_id: 1, part_name: "Engine Oil Filter",     qty: 1 },
      { part_id: 2, part_name: "5W-30 Synthetic Oil 4L", qty: 1 }
    ],
    photo_urls: [],
    repair_summary: "Performed scheduled oil and filter change using Castrol 5W-30 synthetic. Ticking noise resolved. Vehicle test-driven 3 km post-service with no issues.",
    next_service_recommendations: "Oil change due at 52,510 km or 6 months. Recommend tyre rotation at next visit.",
    test_drive_notes: "Engine smooth post oil change. No unusual noises. Brakes responsive. AC cooling well.",
    overall_health_score: 88
  },

  {
    // Corresponds to MySQL service_jobs.job_id = 2, mongo_report_id = '6648a1b2c3d4e5f601020305'
    job_id:      2,
    vehicle_id:  2,    // Deepa's Toyota Camry
    mechanic_id: 5,    // Anjali Singh
    created_at:  new Date("2025-05-12T12:40:00Z"),
    mileage_at_service: 21800,
    customer_complaints: "Squealing sound from front brakes especially when stopping from highway speed.",
    inspection_summary: "Front brake pads worn to 20% life. Rear pads healthy. No rotor damage seen. Customer chose inspection only — brake pad replacement deferred.",
    findings: [
      {
        system:        "Brakes - Front",
        condition:     "Worn",
        action_taken:  "Inspected. Brake pads measured at 4mm (20% life remaining).",
        recommendation: "Replace front brake pads within 3,000-5,000 km to avoid rotor damage."
      },
      {
        system:    "Brakes - Rear",
        condition: "Good",
        action_taken: null,
        recommendation: "Rear pads at 8mm. Good for another 20,000 km."
      },
      {
        system:    "Brake Fluid",
        condition: "Fair",
        action_taken: null,
        recommendation: "Brake fluid slightly discoloured. Consider flush at next visit."
      }
    ],
    parts_replaced: [],
    photo_urls: [],
    repair_summary: "Brake inspection completed. Front pads at critical wear level (4mm). Customer informed and advised urgent replacement. Customer deferred part replacement to next visit.",
    next_service_recommendations: "URGENT: Replace front brake pads at next visit. Also consider brake fluid flush.",
    test_drive_notes: "Confirmed squealing from front. Vehicle otherwise drives well.",
    overall_health_score: 65
  },

  {
    // Corresponds to MySQL service_jobs.job_id = 3, mongo_report_id = '6648a1b2c3d4e5f601020306'
    job_id:      3,
    vehicle_id:  3,    // Farhan's Ford F-150
    mechanic_id: 6,    // Vikram Patel
    created_at:  new Date("2025-05-14T11:45:00Z"),
    mileage_at_service: 74800,
    customer_complaints: "Planning a long trip. Wants full inspection before driving 2000 km.",
    inspection_summary: "65-point inspection completed. Vehicle generally roadworthy. Air filter needs replacement. Wiper blades worn. Coolant level slightly low — topped up.",
    findings: [
      { system: "Engine",       condition: "Good",    action_taken: null, recommendation: "Oil is 60% life. Change within 5,000 km." },
      { system: "Air Filter",   condition: "Worn",    action_taken: null, recommendation: "Air filter heavily clogged. Replace immediately." },
      { system: "Brakes",       condition: "Good",    action_taken: null, recommendation: "Pads and rotors healthy." },
      { system: "Tyres",        condition: "Good",    action_taken: null, recommendation: "All 4 tyres at adequate pressure and tread depth." },
      { system: "Battery",      condition: "Good",    action_taken: null, recommendation: "12V battery charge good." },
      { system: "Lights",       condition: "Good",    action_taken: null, recommendation: "All exterior lights functional." },
      { system: "Coolant",      condition: "Fair",    action_taken: "Topped up coolant to full level.", recommendation: "Check radiator for minor leak at next service." },
      { system: "Wiper Blades", condition: "Worn",    action_taken: null, recommendation: "Front wiper blades streaking. Replace before the trip." },
      { system: "Suspension",   condition: "Good",    action_taken: null, recommendation: "No abnormal sounds or play." },
      { system: "Exhaust",      condition: "Good",    action_taken: null, recommendation: "No leaks or unusual smell." }
    ],
    parts_replaced: [],
    photo_urls: [],
    repair_summary: "Comprehensive 65-point inspection performed. Coolant topped up. Advised customer to replace air filter and wiper blades before long-distance journey.",
    next_service_recommendations: "Replace air filter and front wiper blades (urgent before trip). Oil change due at ~79,800 km. Check radiator for possible micro-leak.",
    test_drive_notes: "Vehicle drives well. Engine strong. No warning lights. AC fully functional. Ready for highway use with above recommendations addressed.",
    overall_health_score: 76
  }
]);


// ─────────────────────────────────────────────────────────────
// STEP 4: Aggregation Pipeline Examples
// ─────────────────────────────────────────────────────────────
// Example 1: Average health score by vehicle
db.repair_reports.aggregate([
  {
    $group: {
      _id: "$vehicle_id",
      avg_health_score: { $avg: "$overall_health_score" },
      total_reports:    { $sum: 1 },
      last_service:     { $max: "$created_at" }
    }
  },
  { $sort: { avg_health_score: 1 } }
]);

// Example 2: Most common issue categories recorded across all reports
db.repair_reports.aggregate([
  { $unwind: "$findings" },
  {
    $group: {
      _id: "$findings.system",
      total_occurrences:   { $sum: 1 },
      worn_or_critical_count: {
        $sum: {
          $cond: [
            { $in: ["$findings.condition", ["Worn","Damaged","Critical"]] },
            1, 0
          ]
        }
      }
    }
  },
  { $sort: { worn_or_critical_count: -1 } }
]);

// Example 3: Full-text search for reports mentioning "brake"
db.repair_reports.find(
  { $text: { $search: "brake" } },
  { score: { $meta: "textScore" }, job_id: 1, inspection_summary: 1 }
).sort({ score: { $meta: "textScore" } });
