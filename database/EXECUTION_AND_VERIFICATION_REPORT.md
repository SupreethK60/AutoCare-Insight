# AutoCare Insight — MySQL Execution & Verification Report

**Date:** October 27, 2026  
**Target Database:** `autocare_insight` (MySQL Server 8.0.33 Win64)  
**Host/Port:** `localhost:3306`  
**Service:** Windows Service `MySQL80`  

---

## 1. Environment & Service Status Verification

| Check | Expected | Actual Result | Status |
|-------|----------|---------------|--------|
| MySQL CLI Installed | `mysql.exe` in PATH or Program Files | Located at `C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe` (v8.0.33) | ✅ Verified |
| MySQL Server Service | Active on port 3306 | Service `MySQL80` is running and listening on `127.0.0.1:3306` | ✅ Verified |
| Connection Authentication | Authenticated connection | `ERROR 1045 (28000): Access denied for user 'root'@'localhost'` — Server requires configured root password | ⚠️ Awaiting Password |

---

## 2. Intended Database Architecture & Script Dependency Order

The database scripts are organized in strict dependency order:

1. **`01_create_database.sql`**:
   - Creates database `autocare_insight` with `utf8mb4` character set and `utf8mb4_unicode_ci` collation.
2. **`02_create_tables.sql`**:
   - Creates all 13 core relational tables:
     - `users` (RBAC: admin, service_advisor, mechanic)
     - `customers`
     - `vehicle_catalogue` (Master CSV vehicle registry)
     - `customer_vehicles` (Customer registrations)
     - `service_types`
     - `appointments`
     - `service_jobs` (Links to MongoDB repair reports via `mongo_report_id`)
     - `job_services` (Job-service bridge)
     - `spare_parts` (Inventory management)
     - `part_usage` (Inventory consumption bridge)
     - `invoices`
     - `invoice_payments` (Partial payment tracking)
     - `maintenance_reminders` (Predictive mileage/date alerts)
3. **`03_advanced_features.sql`**:
   - **3 Views**: `vw_service_summary`, `vw_inventory_low_stock`, `vw_pending_maintenance`
   - **3 Stored Procedures**: `sp_book_appointment`, `sp_generate_invoice`, `sp_get_customer_vehicle_history`
   - **2 Stored Functions**: `fn_invoice_total_paid`, `fn_days_since_last_service`
   - **4 Triggers**: `trg_deduct_stock_on_part_usage`, `trg_restore_stock_on_part_usage_delete`, `trg_auto_reminder_on_job_complete`, `trg_mark_invoice_paid`
   - **Full-Text Search Indexes**: On `vehicle_catalogue(manufacturer, model, notes)`
4. **`04_import_csv_vehicle_catalogue.sql`**:
   - Ingestion mapping for 3 source CSV datasets:
     - `Light Duty Vehicles.csv` (3,521 models)
     - `Alternative Fuel Vehicles US.csv` (892 models)
     - `Medium and Heavy Duty Vehicles.csv` (292 models)
5. **`05_sample_data.sql`**:
   - Baseline relational seed data across all 13 tables.
6. **`08_ddl_alter_drop_demo.sql`**:
   - DDL schema evolution demonstrating `ALTER TABLE` (adding columns, modifying datatypes, adding check constraints, creating/dropping indexes) and `DROP` statements safely without data loss.
7. **`verify_database.sql`**:
   - Full automated verification querying table count, view existence, routines, triggers, constraints, and row count metrics.

---

## 3. Expected Baseline Row Counts

| Table Name | Initial Seed Row Count | Post-CSV Import Row Count |
|------------|------------------------|---------------------------|
| `users` | 6 | 6 |
| `customers` | 6 | 6 |
| `vehicle_catalogue` | 8 (seed) | 4,000+ (from 3 CSV datasets) |
| `customer_vehicles` | 6 | 6 |
| `service_types` | 10 | 10 |
| `appointments` | 6 | 6 |
| `service_jobs` | 3 | 3 |
| `job_services` | 3 | 3 |
| `spare_parts` | 10 | 10 |
| `part_usage` | 2 | 2 |
| `invoices` | 3 | 3 |
| `invoice_payments` | 2 | 2 |
| `maintenance_reminders` | 3 | 3 |

---

## 4. Current Execution Status & Blockers

- **Direct Automated CLI Execution:** Blocked pending entry of the local MySQL `root` password.
- **Root Cause:** MySQL Server 8.0 was installed with a custom administrator password set by the user during installation.
- **Resolution Steps for User:**
  Either:
  1. **Run via PowerShell Runner (Automated):**
     ```powershell
     cd D:\DBMS_Assignment\database
     .\run_all_migrations.ps1 -Password "<YOUR_MYSQL_ROOT_PASSWORD>"
     ```
  2. **Or Run via MySQL Workbench:**
     - Open MySQL Workbench -> Connect to "Local instance MySQL80".
     - Open and execute scripts in order: `01_create_database.sql`, `02_create_tables.sql`, `03_advanced_features.sql`, `05_sample_data.sql`, `08_ddl_alter_drop_demo.sql`, followed by `verify_database.sql`.

---

## 5. Resilient Application Architecture Note

While live MySQL database script execution awaits the user's password input, the Next.js application layer (`src/lib/db.ts`) incorporates a **resilient dual-driver pattern**:
- When MySQL credentials are authenticated, the app executes live SQL against MySQL 8.0.
- When running offline or prior to password provision, the app seamlessly provides the exact initial seed state and relational views, enabling complete frontend scaffolding and build verification without downtime.

