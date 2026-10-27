# AutoCare Insight — Implementation Plan
# Vehicle Service Management and Predictive Maintenance System

Generated: Phase 1 & 2 Execution (October 2026)

---

## Project Phases Overview

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Inspection, planning, CSV analysis | ✅ Complete |
| Phase 2 | MySQL schema DDL, MongoDB setup, ALTER/DROP, verification scripts | ⚠️ Scripts & Runner Ready (Awaiting MySQL Root Password) |
| Phase 3 | Next.js project scaffold, TypeScript, Tailwind, DB connectors | ✅ Complete |
| Phase 4 | Backend: Auth, Customers, Vehicles, Jobs, Inventory APIs | ⏳ Pending |
| Phase 5 | Frontend: Pages, UI, Dashboard | ⏳ Pending |
| Phase 6 | Advanced SQL: Views, Stored Procs, Triggers, Indexes, Transactions | ⏳ Pending |
| Phase 7 | MongoDB Aggregation, Documentation, README | ⏳ Pending |

---

## Tool Status

- Node.js: v22.20.0 ✅
- npm: v11.6.0 ✅
- Git: v2.53.0 ✅
- MySQL CLI: `C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe` (v8.0.33) ✅
- MySQL Service: Windows Service `MySQL80` (active on port 3306) ✅
- MongoDB (mongod): Server 8.2 installed ✅
- Next.js: v14.2.35 (Production build verified, HTTP 200 response verified) ✅

---

## Database Architecture Overview

### Intended Database Name: `autocare_insight`
- Character Set: `utf8mb4`
- Collation: `utf8mb4_unicode_ci`

### 13 Relational Tables:
1. `users` (id, full_name, email, password_hash, role, phone, is_active)
2. `customers` (id, full_name, email, phone, address, city, state, zip_code)
3. `vehicle_catalogue` (imported from 3 CSV datasets)
4. `customer_vehicles` (customer registrations linked to catalogue)
5. `service_types` (service menu & standard pricing)
6. `appointments` (customer service bookings)
7. `service_jobs` (workshop jobs linked to appointments & MongoDB report)
8. `job_services` (bridge: jobs to service types)
9. `spare_parts` (warehouse parts inventory & reorder levels)
10. `part_usage` (bridge: jobs to spare parts)
11. `invoices` (billing & tax calculation)
12. `invoice_payments` (payment transaction records)
13. `maintenance_reminders` (date/mileage predictive alerts)

### MongoDB Collection: `autocare_db.repair_reports`
- Flexible multi-point inspection notes, systems condition ratings, photos, narrative summaries, and fleet health scores.
- Linked to MySQL via `service_jobs.mongo_report_id` ↔ `repair_reports._id`.

---

## Migration Runner & Verification
To execute the database scripts once the MySQL root password is provided:
```powershell
cd D:\DBMS_Assignment\database
.\run_all_migrations.ps1 -Password "<YOUR_MYSQL_PASSWORD>"
```
Or run the scripts sequentially in MySQL Workbench (`Local instance MySQL80`).
Report available at `database/EXECUTION_AND_VERIFICATION_REPORT.md`.
