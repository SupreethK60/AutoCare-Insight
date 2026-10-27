# AutoCare Insight — Vehicle Service Management & Predictive Maintenance System

[![PES University DBMS Experiential Learning Level 3](https://img.shields.io/badge/PES_University-DBMS_Level_3-blue.svg)](https://pes.edu)
[![Next.js 14](https://img.shields.io/badge/Next.js-14.2.35-black.svg)](https://nextjs.org/)
[![MySQL 8.0](https://img.shields.io/badge/MySQL-8.0.40-orange.svg)](https://www.mysql.com/)
[![MongoDB 8.2](https://img.shields.io/badge/MongoDB-8.2.0-green.svg)](https://www.mongodb.com/)
[![Tests Passing](https://img.shields.io/badge/Tests-31%2F31_Passing-brightgreen.svg)](docs/TEST_VERIFICATION_REPORT.md)

An enterprise-grade automotive service operations, spare parts inventory control, and predictive maintenance platform engineered for modern multi-brand and electric vehicle (EV) workshops. Built with a **Dual-Database Architecture** combining **MySQL 8.0** for relational ACID transactions with **MongoDB 8.2** for semi-structured polymorphic inspection findings and an in-memory **64-Dimensional Semantic Vector Search Engine** for natural-language diagnostic similarity matching.

---

## Table of Contents

- [1. Project Introduction](#1-project-introduction)
  - [Problem Statement](#problem-statement)
  - [Objectives & Key Capabilities](#objectives--key-capabilities)
- [2. System Architecture](#2-system-architecture)
  - [Dual-Database Paradigm](#dual-database-paradigm)
  - [Architecture Diagram](#architecture-diagram)
- [3. Key Features](#3-key-features)
- [4. Technology Stack](#4-technology-stack)
- [5. Repository Structure](#5-repository-structure)
- [6. Prerequisites](#6-prerequisites)
- [7. Step-by-Step Installation & Database Setup](#7-step-by-step-installation--database-setup)
- [8. Evaluation & Role-Based Usage Guide](#8-evaluation--role-based-usage-guide)
- [9. Testing & Verification Suite](#9-testing--verification-suite)
- [10. Project Documentation & PDF Deliverables](#10-project-documentation--pdf-deliverables)
- [11. Troubleshooting & Limitations](#11-troubleshooting--limitations)

---

## 1. Project Introduction

### Problem Statement
Modern automotive workshops manage two fundamentally distinct data workloads:
1. **Relational & Transactional Workloads**: Service bookings, technician bay dispatches, spare parts stock deductions, labor charges, and GST invoice settlements demand strict relational consistency, foreign key constraints, and ACID guarantees.
2. **Polymorphic Diagnostic Workloads**: Multi-point vehicle inspection checklists, OBD-II diagnostic trouble codes (DTCs), sensor readings, and technician notes exhibit high variability across ICE, Hybrid, and Electric vehicle architectures, where fixed tabular schemas create excessive null fields and schema rigidity.
3. **Keyword-Dependent Symptom Search**: Workshop advisors and mechanics cannot query historical diagnostic records effectively using colloquial, natural language complaints (e.g., *"car shudders under acceleration with clicking noise"*).

### Objectives & Key Capabilities
- **Dual-Database Architecture**: Encapsulate financial and inventory consistency in MySQL while storing polymorphic multi-point inspection checkpoints in MongoDB.
- **Automated Stock Deductions**: Enforce database-level triggers that automatically decrement stock when parts are allocated and flag low-inventory items.
- **Alternative Fuel Vehicle Ingestion**: Ingest 3,229 EV, Plug-in Hybrid, CNG, and Hydrogen models from official US Department of Energy datasets.
- **Diagnostic Semantic Vector Search**: Embed symptoms and inspection findings into a normalized 64-dimensional dense semantic space for natural language matching via Cosine Similarity.
- **Interactive Educational SQL Query Runner**: Provide a server-side catalog of 20 educational SQL queries demonstrating joins, subqueries, CTEs, and window functions.
- **Analytical MongoDB Aggregation Engine**: Run 7 multi-stage pipelines analyzing fleet health, defect frequencies, and cost exposures.

---

## 2. System Architecture

### Dual-Database Paradigm
- **MySQL 8.0 (Structured Core)**: 13 relational tables, 18 Foreign Keys, 6 Views, 5 Stored Procedures, 2 Stored Functions, 5 Triggers, and an inventory audit table (`spare_parts_audit`).
- **MongoDB 8.2 (Polymorphic Store)**: `repair_reports` collection with BSON documents validated via JSON Schema, capturing multi-point inspections, DTC trouble codes, and health scores.
- **Cross-Paradigm Integration**: Bidirectional linking between relational service tickets (`service_jobs.mongo_report_id`) and document stores (`repair_reports.job_id`).

### Architecture Diagram

```
+-------------------------------------------------------------------------+
|                         PRESENTATION LAYER                              |
|   Next.js 14 App Router (React 18, TypeScript, Tailwind CSS, Lucide)    |
|   • Operations Dashboard (`/dashboard` & `/`)                           |
|   • Appointments Intake (`/appointments`)                               |
|   • Workshop Service Bays (`/jobs`)                                     |
|   • MongoDB Repair Reports (`/reports`)                                 |
|   • 3,229-Model Vehicle Catalogue (`/catalogue`)                        |
|   • Spare Parts Inventory (`/inventory`)                                |
|   • Tax Invoices & Settlement (`/invoices`)                             |
|   • Interactive SQL Query Runner (`/sql-runner`)                        |
|   • MongoDB Aggregation Runner (`/aggregations`)                        |
|   • Diagnostic Semantic Search (`/search`)                              |
+-------------------------------------------------------------------------+
                                    |
                                    | HTTPS / JSON API
                                    v
+-------------------------------------------------------------------------+
|                       APPLICATION & API LAYER                           |
|   Next.js Server Route Handlers (27 Dynamic API Endpoints)              |
|   • Auth & Session Engine (JWT in HTTP-only Cookies, Bcrypt)            |
|   • RBAC Authorization Guard (Admin, Service Advisor, Mechanic)         |
|   • Query Registry & Parameter Validator (Parameterized SQL)            |
|   • Vector Search Engine (64-D Dense Semantic Encoder & Cosine Ranker)  |
|   • MongoDB Aggregation Pipeline Registry (7 Predefined Pipelines)      |
+-------------------------------------------------------------------------+
                    |                                   |
        MySQL2 / Promise Pool                   Official MongoDB Driver
                    v                                   v
+-------------------------------------+ +---------------------------------+
|        RELATIONAL DATA STORE        | |       DOCUMENT DATA STORE       |
|              MySQL 8.0              | |           MongoDB 8.2           |
| • 13 Core Relational Tables         | | • repair_reports Collection     |
| • 18 Foreign Key Constraints        | | • JSON Schema Validator         |
| • 6 Views (Reporting & Audit)       | | • Multi-Point Inspection Arrays |
| • 5 Stored Procedures & 2 Functions | | • Text Indexes on Symptoms      |
| • 5 Triggers & Audit Logging Table  | | • Multi-Stage Aggregations      |
+-------------------------------------+ +---------------------------------+
```

---

## 3. Key Features

1. **Dashboard & Fleet Analytics (`/dashboard`)**:
   - Real-time KPI summary cards: verified customers, fleet vehicles, active bay jobs, low stock parts, and settled revenue.
   - Live MongoDB defect distribution by subsystem and average fleet health progress metrics.
2. **Appointments Booking (`/appointments`)**:
   - Intake scheduling with vehicle conflict detection executed via stored procedure `sp_book_appointment`.
   - Confirm, reschedule, cancel, and one-click dispatch to workshop bay.
3. **Workshop Bay Manager (`/jobs`)**:
   - Job progression (`assigned` &rarr; `in_progress` &rarr; `completed`) with odometer out sign-off.
   - Part allocation modal: charges parts to jobs while MySQL trigger `trg_deduct_stock_on_part_usage` automatically decrements inventory.
   - Generates invoices via stored procedure `sp_generate_invoice` with 18% GST.
4. **Diagnostic & Repair Reports (`/reports`)**:
   - Multi-point findings editor (`Good`, `Fair`, `Worn`, `Damaged`, `Critical`).
   - Health score calculation (0–100%) and OBD-II DTC trouble code logging.
   - JSON Schema validation and bidirectional linking with MySQL `job_id`.
5. **Vehicle Technical Catalogue (`/catalogue`)**:
   - Browse 3,229 alternative fuel and EV models imported from official Department of Energy datasets.
   - Floating comparison tray allowing side-by-side technical specification comparison of up to 3 vehicles.
6. **Spare Parts Inventory Control (`/inventory`)**:
   - Inventory tracking with low-stock warning banners (`qty_in_stock <= reorder_level`).
   - Add part validation enforcing `selling_price >= unit_cost`.
7. **Invoices & Billing Ledger (`/invoices`)**:
   - Itemized line items (services + parts + 18% GST + loyalty discounts).
   - Settlement modal recording payments; MySQL trigger `trg_mark_invoice_paid` marks invoices paid automatically.
8. **Interactive SQL Query Runner (`/sql-runner`)**:
   - Server-registered read-only query catalog executing **20 distinct SQL queries** demonstrating joins, subqueries, CTEs, window functions, and views.
9. **MongoDB Aggregation Pipeline Runner (`/aggregations`)**:
   - Executes 7 pre-defined analytical pipelines computing fleet health, monthly trends, and cost exposures.
10. **Diagnostic Semantic Vector Search (`/search`)**:
    - Natural language query matcher using normalized 64-dimensional dense semantic vectors and Cosine Similarity.

---

## 4. Technology Stack

| Category | Component | Version | Description |
|---|---|---|---|
| **Frontend** | Next.js (App Router) | `14.2.35` | React Server Components & hybrid SSR/CSR architecture |
| | React & React DOM | `18.3.1` | Component UI library |
| | Tailwind CSS | `3.4.14` | Utility-first styling |
| | Lucide React | `0.453.0` | Professional icon library |
| **Backend** | Next.js Route Handlers | `14.2.35` | 27 dynamic RESTful API endpoints |
| | TypeScript | `5.6.3` | End-to-end static type safety |
| | `jsonwebtoken` | `9.0.2` | HMAC-SHA256 JWT sessions in HTTP-only cookies |
| | `bcryptjs` | `2.4.3` | Salted password hashing (10 rounds) |
| **Databases** | MySQL Server | `8.0.40` | Relational core, ACID transactions, triggers, stored procs |
| | MongoDB Community | `8.2.0` | Document store with JSON Schema validator |
| | `mysql2/promise` | `3.11.3` | Reusable connection pool & transaction manager |
| | `mongodb` Native Driver | `6.10.0` | BSON serialization & aggregation pipeline execution |
| **Vector Engine** | Dense Semantic Space | Custom 64-D | In-memory normalized dense vectors with Cosine Similarity |
| **Testing** | Node Native Test Runner | `node:test` | Automated test suite (31 tests across 6 files) |

---

## 5. Repository Structure

```
DBMS_Assignment/
├── database/                          # Relational & NoSQL Database Setup
│   ├── 01_create_database.sql         # Database creation (autocare_insight, utf8mb4)
│   ├── 02_create_tables.sql           # 13 tables with constraints, keys & indexes
│   ├── 03_advanced_features.sql       # Views, stored procedures, functions, triggers
│   ├── 04_import_csv_vehicle_catalogue.sql # SQL DDL for vehicle catalogue
│   ├── 05_sample_data.sql             # Comprehensive seed data for all entities
│   ├── 06_mongodb_schema.js           # MongoDB JSON Schema validator & seed reports
│   ├── 07_important_queries.sql       # Benchmark SQL queries
│   ├── 08_ddl_alter_drop_demo.sql     # Safe ALTER TABLE and DROP demonstration
│   ├── import_csv_to_mysql.js         # Node script ingesting 3,229 models from CSVs
│   ├── advanced/                      # Phase 6 Advanced SQL Demos
│   │   ├── 01_views_demo.sql          # Advanced reporting views
│   │   ├── 02_stored_procedures_demo.sql # Parameterized procs with cursors
│   │   ├── 03_triggers_demo.sql       # spare_parts_audit table & audit trigger
│   │   ├── 04_transactions_demo.sql   # ACID commit, rollback, and savepoint demos
│   │   └── README.md                  # Advanced SQL execution guide
│   ├── DATA_DICTIONARY.md             # Complete data dictionary for all 13 tables
│   ├── ER_DIAGRAM.md                  # Entity-relationship documentation
│   └── EXECUTION_AND_VERIFICATION_REPORT.md # Database live execution report
├── docs/                              # Project Documentation & Reports
│   ├── PROJECT_REPORT.md              # Complete 13-section academic project report
│   ├── AutoCare_Insight_Project_Report.pdf # 633 KB publication-grade PDF deliverable
│   ├── TEST_VERIFICATION_REPORT.md    # 31/31 automated test verification report
│   └── generate_pdf.py                # Chrome headless PDF generator script
├── src/                               # Application Source Code
│   ├── app/                           # Next.js 14 App Router
│   │   ├── layout.tsx                 # Root layout with AuthProvider & AppLayout
│   │   ├── page.tsx                   # Landing page (renders dashboard)
│   │   ├── dashboard/page.tsx         # Workshop operations dashboard
│   │   ├── appointments/page.tsx      # Appointments intake & scheduling
│   │   ├── jobs/page.tsx              # Workshop bay service jobs & parts allocation
│   │   ├── reports/page.tsx           # MongoDB inspection reports & editor
│   │   ├── catalogue/page.tsx         # 3,229-model vehicle catalogue & comparison
│   │   ├── inventory/page.tsx         # Spare parts inventory & low-stock alerts
│   │   ├── invoices/page.tsx          # Invoices & payment settlements
│   │   ├── sql-runner/page.tsx        # Interactive 20-query SQL runner
│   │   ├── aggregations/page.tsx      # MongoDB 7-pipeline aggregation runner
│   │   ├── search/page.tsx            # Diagnostic semantic vector search
│   │   ├── customers/page.tsx         # Customer directory
│   │   ├── vehicles/page.tsx          # Fleet vehicles & service history
│   │   └── api/                       # 27 Dynamic Route Handlers
│   ├── components/                    # Reusable React UI Components
│   │   ├── layout/AppLayout.tsx       # Responsive role-aware sidebar & navbar
│   │   └── ui/                        # Modal, Badge, and control components
│   ├── lib/                           # Core Utilities & Services
│   │   ├── auth/                      # RBAC rules, session cookies, and JWT logic
│   │   ├── db/                        # MySQL pool, MongoDB client, transactions
│   │   │   ├── query-registry.ts      # 20 educational SQL queries registry
│   │   │   └── mongodb-aggregations.ts# 7 MongoDB aggregation pipelines
│   │   ├── context/AuthContext.tsx    # Client auth state & demo role switcher
│   │   └── vector-search.ts           # 64-D semantic dense vector search engine
│   └── types/                         # TypeScript interfaces & domain types
├── tests/                             # Automated Test Suites (31 Tests)
│   ├── auth.test.js                   # JWT and RBAC permission checks
│   ├── validation.test.js             # MongoDB repair report schema checks
│   ├── integration.test.js            # Live MySQL & MongoDB database queries
│   ├── sql-runner.test.js             # Verification of all 20 SQL queries
│   ├── aggregations.test.js           # Verification of all 7 MongoDB pipelines
│   ├── vector-search.test.js          # Vector normalization & cosine similarity checks
│   └── runner.js                      # Unified test runner (`node tests/runner.js`)
├── package.json                       # Dependencies & project scripts
└── task.md                            # Comprehensive phase-by-phase checklist
```

---

## 6. Prerequisites

Ensure the following environments are installed on your machine:
- **Node.js**: v18.17.0+ or v20.x / v22.x (Verified on `v22.20.0`).
- **npm**: v9.x or v11.x (Verified on `11.6.0`).
- **MySQL Server**: v8.0+ running on port `3306` with InnoDB enabled (Verified on `MySQL 8.0.40`).
- **MongoDB Server**: v6.0+ or v8.0+ running on port `27017` (Verified on `MongoDB 8.2.0`).
- **Google Chrome**: (Optional) required only to re-generate the PDF report via `python docs/generate_pdf.py`.

---

## 7. Step-by-Step Installation & Database Setup

### Step 1: Clone Repository & Install Dependencies
```bash
git clone <repository_url>
cd DBMS_Assignment
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Ensure `.env.local` contains valid connection credentials:
```ini
# MySQL Configuration
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=YourMySQLPassword
MYSQL_DATABASE=autocare_insight

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/autocare_db
MONGODB_DB_NAME=autocare_db

# JWT Secret
JWT_SECRET=super_secure_jwt_secret_key_pes_2026
```

### Step 3: Initialize MySQL Relational Schema
Using the MySQL CLI:
```bash
mysql -u root -p -e "source database/01_create_database.sql;"
mysql -u root -p autocare_insight -e "source database/02_create_tables.sql;"
mysql -u root -p autocare_insight -e "source database/03_advanced_features.sql;"
mysql -u root -p autocare_insight -e "source database/05_sample_data.sql;"
```

### Step 4: Ingest 3,229 Vehicle Catalogue Models
Run the ingestion script to import CSV data into MySQL:
```bash
node database/import_csv_to_mysql.js
```
*Expected Output:* `Ingestion complete! Successfully imported 3,229 distinct vehicle models into vehicle_catalogue.`

### Step 5: Initialize MongoDB Schema & Seed Reports
Run the MongoDB initialization script:
```bash
node database/06_mongodb_schema.js
```
*Expected Output:* `repair_reports collection initialized with JSON Schema validation and text indexes.`

### Step 6: Deploy Phase 6 Advanced SQL Demonstrations
```bash
mysql -u root -p autocare_insight -e "source database/advanced/01_views_demo.sql;"
mysql -u root -p autocare_insight -e "source database/advanced/02_stored_procedures_demo.sql;"
mysql -u root -p autocare_insight -e "source database/advanced/03_triggers_demo.sql;"
mysql -u root -p autocare_insight -e "source database/advanced/04_transactions_demo.sql;"
```

---

## 8. Evaluation & Role-Based Usage Guide

The application includes built-in role switching to easily test Role-Based Access Control (RBAC).

### Pre-Configured Evaluation Personas

| Role | Email | Password | Allowed Capabilities |
|---|---|---|---|
| **Admin** | `admin@autocare.com` | `password123` | Full access across all modules, inventory pricing, user management, and billing |
| **Service Advisor** | `rajesh@autocare.com` | `password123` | Customer intake, appointment scheduling, bay dispatching, billing & settlement |
| **Mechanic** | `suresh@autocare.com` | `password123` | Workshop jobs, part usage, MongoDB inspection reports, vector search. Billing is blocked |

### Testing RBAC via Demo Role Switcher
In the top right navigation bar of the application, click the **Role Switcher** dropdown to toggle between **Admin**, **Service Advisor**, and **Mechanic**. Notice how navigation items and action buttons adjust dynamically based on permissions.

---

## 9. Testing & Verification Suite

The repository includes 31 automated unit and integration tests executing against live databases:

### Run Complete Test Suite
```bash
node tests/runner.js
```

### Run Static Typecheck
```bash
npx tsc --noEmit
```

### Run Next.js Production Build
```bash
npm run build
```

*Actual Build Output:*
```
Route (app)                              Size     First Load JS
┌ ○ /                                    173 B           102 kB
├ ○ /_not-found                          873 B          88.1 kB
├ ○ /aggregations                        4.36 kB        91.6 kB
├ ƒ /api/advanced/mongodb-aggregations   0 B                0 B
├ ƒ /api/advanced/sql-runner             0 B                0 B
├ ƒ /api/appointments                    0 B                0 B
├ ƒ /api/appointments/[id]               0 B                0 B
├ ƒ /api/auth/login                      0 B                0 B
├ ƒ /api/auth/logout                     0 B                0 B
├ ƒ /api/auth/me                         0 B                0 B
├ ƒ /api/catalogue                       0 B                0 B
├ ƒ /api/catalogue/[id]                  0 B                0 B
├ ƒ /api/customers                       0 B                0 B
├ ƒ /api/customers/[id]                  0 B                0 B
├ ƒ /api/inventory                       0 B                0 B
├ ƒ /api/inventory/[id]                  0 B                0 B
├ ƒ /api/invoices                        0 B                0 B
├ ƒ /api/invoices/[id]                   0 B                0 B
├ ƒ /api/invoices/[id]/payments          0 B                0 B
├ ƒ /api/jobs                            0 B                0 B
├ ƒ /api/jobs/[id]                       0 B                0 B
├ ƒ /api/jobs/[id]/parts                 0 B                0 B
├ ƒ /api/reports                         0 B                0 B
├ ƒ /api/reports/[jobId]                 0 B                0 B
├ ƒ /api/reports/analytics               0 B                0 B
├ ƒ /api/search/semantic                 0 B                0 B
├ ƒ /api/users                           0 B                0 B
├ ƒ /api/vehicles                        0 B                0 B
├ ƒ /api/vehicles/[id]                   0 B                0 B
├ ƒ /api/vehicles/[id]/history           0 B                0 B
├ ○ /appointments                        6.61 kB        93.9 kB
├ ○ /catalogue                           4.72 kB          92 kB
├ ○ /customers                           4.59 kB        91.9 kB
├ ○ /dashboard                           174 B           102 kB
├ ○ /inventory                           5.97 kB        93.2 kB
├ ○ /invoices                            6.51 kB        93.8 kB
├ ○ /jobs                                6.36 kB         103 kB
├ ○ /reports                             6.97 kB        94.2 kB
├ ○ /search                              4.37 kB         101 kB
├ ○ /sql-runner                          4.83 kB        92.1 kB
└ ○ /vehicles                            5.42 kB        92.7 kB
+ First Load JS shared by all            87.3 kB

✓ 18/18 static pages generated
✓ 27 dynamic API route handlers compiled
```

### Start Development Server
```bash
npm run dev
# Open http://localhost:3000 in your browser
```

---

## 10. Project Documentation & PDF Deliverables

All documentation artifacts are available in the repository:

1. **[Comprehensive Project Report (PDF)](docs/AutoCare_Insight_Project_Report.pdf)**: 633 KB publication-grade document covering all 13 sections.
2. **[Project Report Source (Markdown)](docs/PROJECT_REPORT.md)**: Academic report source file.
3. **[Formal Test Verification Report](docs/TEST_VERIFICATION_REPORT.md)**: Structured audit of all 31 automated test cases.
4. **[Relational Data Dictionary](database/DATA_DICTIONARY.md)**: Detailed schema definitions for all 13 tables.
5. **[Entity-Relationship Model](database/ER_DIAGRAM.md)**: ER diagrams, cardinalities, and relationship matrices.
6. **[Database Verification Report](database/EXECUTION_AND_VERIFICATION_REPORT.md)**: Log of live migrations, row counts, and procedure runs.
7. **[Requirements Traceability Matrix](database/REQUIREMENTS_TRACEABILITY.md)**: Maps academic requirements to files and routes.
8. **[Advanced SQL Demonstration Guide](database/advanced/README.md)**: Details views, stored procedures, triggers, and ACID transactions.

---

## 11. Troubleshooting & Limitations

- **EPERM / mkdir errors on Windows**: If `npm run build` fails with transient `EPERM` errors on Windows, clean the `.next` directory (`Remove-Item -Recurse -Force .next`) and re-run.
- **Port Conflicts**: Ensure port `3306` (MySQL) and `27017` (MongoDB) are accessible by local Windows services (`MySQL80` and `MongoDB`).
- **Vector Search Scale**: The 64-dimensional semantic search operates in-memory; scaling to hundreds of thousands of documents would benefit from external vector stores (e.g., Qdrant, Pinecone, or PostgreSQL with pgvector).

---

## License & Academic Declaration

This project was developed for the **DBMS Experiential Learning Level 3** course at the Department of Computer Science and Engineering, PES University, Bengaluru.

All code, schemas, and documentation are original implementations satisfying the requirements set forth in the course specification.
