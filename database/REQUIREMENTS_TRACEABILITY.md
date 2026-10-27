# AutoCare Insight — Requirements Traceability Matrix

This document maps every DBMS Level 3 assignment requirement to its concrete implementation in the project.

---

## 1. Database Design Requirements

| # | Requirement | Implementation | File(s) |
|---|-------------|---------------|---------|
| 1.1 | ER Diagram | Mermaid ER diagram with all entities, PKs, FKs, relationships, and cardinalities | `database/ER_DIAGRAM.md` |
| 1.2 | Relational Schema | 13 normalized MySQL tables with full DDL | `database/02_create_tables.sql` |
| 1.3 | Primary Keys | AUTO_INCREMENT INT UNSIGNED PK on every table | `02_create_tables.sql` |
| 1.4 | Foreign Keys | 18 named FOREIGN KEY constraints with ON DELETE actions | `02_create_tables.sql` |
| 1.5 | Relationships | 1:M, M:M (via bridge tables `job_services`, `part_usage`) | `02_create_tables.sql`, `ER_DIAGRAM.md` |
| 1.6 | Constraints | NOT NULL, UNIQUE, DEFAULT, ENUM, CHECK-like (ENUM), ON DELETE RESTRICT/SET NULL/CASCADE | `02_create_tables.sql` |
| 1.7 | Data Dictionary | Complete table-by-table column documentation | `database/DATA_DICTIONARY.md` |

---

## 2. SQL Feature Requirements

| # | Requirement | Implementation | File(s) |
|---|-------------|---------------|---------|
| 2.1 | DDL (CREATE, ALTER) | CREATE TABLE for 13 tables, CREATE VIEW, CREATE PROCEDURE, CREATE FUNCTION, CREATE TRIGGER | `02_create_tables.sql`, `03_advanced_features.sql` |
| 2.2 | DML (INSERT, UPDATE, DELETE) | Sample data inserts, UPDATE in triggers/procs, DELETE demo in triggers | `05_sample_data.sql`, `03_advanced_features.sql` |
| 2.3 | SELECT with WHERE | Multiple queries with filtering | `07_important_queries.sql` (Q1–Q18) |
| 2.4 | JOINs (INNER, LEFT) | Q1 (4-table JOIN), Q5 (3-table), Q6, Q14 | `07_important_queries.sql` |
| 2.5 | Aggregate Functions (COUNT, SUM, AVG) | Q2 (SUM, AVG, COUNT), Q3 (COUNT, AVG), Q6 (SUM) | `07_important_queries.sql` |
| 2.6 | GROUP BY | Q2, Q3, Q4, Q6 | `07_important_queries.sql` |
| 2.7 | HAVING | Q3 (jobs > 2), Q4 (spent > average) | `07_important_queries.sql` |
| 2.8 | ORDER BY | Virtually every query uses ORDER BY | `07_important_queries.sql` |
| 2.9 | Subqueries | Q4 (scalar subquery in HAVING), Q5 (correlated subquery) | `07_important_queries.sql` |

---

## 3. Advanced SQL Features (≥ 4 required)

| # | Feature | Count | Implementation | File(s) |
|---|---------|-------|---------------|---------|
| 3.1 | **Views** | 3 | `vw_service_summary`, `vw_inventory_low_stock`, `vw_pending_maintenance` | `03_advanced_features.sql` |
| 3.2 | **Stored Procedures** | 3 | `sp_book_appointment`, `sp_generate_invoice`, `sp_get_customer_vehicle_history` | `03_advanced_features.sql` |
| 3.3 | **Stored Functions** | 2 | `fn_invoice_total_paid`, `fn_days_since_last_service` | `03_advanced_features.sql` |
| 3.4 | **Triggers** | 4 | `trg_deduct_stock_on_part_usage`, `trg_restore_stock_on_part_usage_delete`, `trg_auto_reminder_on_job_complete`, `trg_mark_invoice_paid` | `03_advanced_features.sql` |
| 3.5 | **Transactions** | 2 | In stored procs (`sp_book_appointment`, `sp_generate_invoice`) + demo block + Q16 | `03_advanced_features.sql`, `07_important_queries.sql` |
| 3.6 | **Indexes** | 20+ | Per-table indexes + composite indexes + FULLTEXT index on `vehicle_catalogue` | `02_create_tables.sql`, `03_advanced_features.sql` |

**Total advanced features: 6 categories, 34+ individual objects** — exceeds the minimum of 4.

---

## 4. MongoDB Requirements

| # | Requirement | Implementation | File(s) |
|---|-------------|---------------|---------|
| 4.1 | NoSQL collection design | `repair_reports` collection with JSON Schema validator | `06_mongodb_schema.js` |
| 4.2 | Flexible document structure | Findings array, photos, notes — varies per report | `06_mongodb_schema.js` |
| 4.3 | MySQL ↔ MongoDB relationship | `service_jobs.mongo_report_id` ↔ `repair_reports._id` | `02_create_tables.sql`, `06_mongodb_schema.js` |
| 4.4 | Aggregation pipelines | Avg health score per vehicle, most common issues, text search | `06_mongodb_schema.js` |
| 4.5 | Text search | Text index on summary/notes fields, `$text` search demo | `06_mongodb_schema.js` |

---

## 5. Application Feature Requirements

| # | Feature | MySQL Tables Used | MongoDB | Planned Module |
|---|---------|-------------------|---------|---------------|
| 5.1 | Customer registration | `customers` | — | `/customers` CRUD |
| 5.2 | Vehicle registration | `customer_vehicles`, `vehicle_catalogue` | — | `/vehicles` CRUD |
| 5.3 | Vehicle catalogue (CSV import) | `vehicle_catalogue` | — | `/catalogue` search |
| 5.4 | Appointment booking | `appointments`, `service_types` | — | `/appointments` |
| 5.5 | Service job tracking | `service_jobs`, `job_services` | `repair_reports` | `/jobs` |
| 5.6 | Service history | `service_jobs`, `job_services`, `invoices` | `repair_reports` | `/history` |
| 5.7 | Inspection notes | — | `repair_reports` | `/jobs/:id/report` |
| 5.8 | Spare parts inventory | `spare_parts` | — | `/inventory` |
| 5.9 | Part usage tracking | `part_usage` (+ stock trigger) | — | `/jobs/:id/parts` |
| 5.10 | Invoices | `invoices` | — | `/invoices` |
| 5.11 | Payments | `invoice_payments` (+ paid trigger) | — | `/invoices/:id/pay` |
| 5.12 | Maintenance reminders | `maintenance_reminders` (+ auto-create trigger) | — | `/reminders` |
| 5.13 | Dashboard & analytics | Views + aggregate queries | Aggregation pipelines | `/dashboard` |

---

## 6. Authentication & RBAC

| # | Requirement | Implementation | File(s) |
|---|-------------|---------------|---------|
| 6.1 | User authentication | `users` table with bcrypt password_hash, JWT tokens | `02_create_tables.sql` (Phase 4: API) |
| 6.2 | Role-based access | `users.role` ENUM: admin, service_advisor, mechanic | `02_create_tables.sql` |
| 6.3 | Middleware guard | Per-route middleware checking JWT + role | Phase 4: Next.js middleware |

---

## 7. Documentation Requirements

| # | Requirement | Deliverable | Status |
|---|-------------|-------------|--------|
| 7.1 | Project objectives | `IMPLEMENTATION_PLAN.md` | ✅ Done |
| 7.2 | ER Diagram | `database/ER_DIAGRAM.md` | ✅ Done (Phase 2) |
| 7.3 | Relational schema | `database/02_create_tables.sql` | ✅ Done |
| 7.4 | Data dictionary | `database/DATA_DICTIONARY.md` | ✅ Done |
| 7.5 | Important queries | `database/07_important_queries.sql` | ✅ Done |
| 7.6 | Requirements traceability | This document | ✅ Done |
| 7.7 | GitHub README | Phase 7 | ⏳ Pending |
| 7.8 | Screenshots & test evidence | Phase 7 | ⏳ Pending |
