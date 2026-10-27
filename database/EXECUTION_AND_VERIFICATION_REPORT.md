# AutoCare Insight — Database Execution & Verification Report

**Execution Date:** October 27, 2026  
**MySQL Server:** 8.0.33 Win64 on `localhost:3306` (Windows Service `MySQL80`)  
**MongoDB Server:** 8.2.1 on `localhost:27017` (Windows Service `MongoDB`)  
**Target MySQL Database:** `autocare_insight` (`utf8mb4`, `utf8mb4_unicode_ci`)  
**Target MongoDB Database:** `autocare_db`, Collection: `repair_reports`  
**Execution Status:** ✅ **100% Verified and Live**

---

## 1. Execution Overview & Dependency Sequence

All database migration scripts were executed in strict dependency order against the live database engines:

| Step | Script File | Target Engine | Purpose | Execution Result |
| :---: | :--- | :--- | :--- | :--- |
| **1** | `01_create_database.sql` | MySQL | Database creation (`autocare_insight`) with utf8mb4 collation | ✅ Success (Code 0) |
| **2** | `02_create_tables.sql` | MySQL | DDL creation of all 13 core relational tables with PK/FK constraints | ✅ Success (Code 0) |
| **3** | `03_advanced_features.sql` | MySQL | 3 Views, 3 Stored Procedures, 2 Functions, 4 Triggers, Composite & Full-Text Indexes | ✅ Success (Code 0) |
| **4** | `import_csv_to_mysql.js` | MySQL | CSV data ingestion from 3 official vehicle datasets into `vehicle_catalogue` | ✅ Success (Code 0) |
| **5** | `05_sample_data.sql` | MySQL | Relational seed data insertion across all 13 tables | ✅ Success (Code 0) |
| **6** | `08_ddl_alter_drop_demo.sql` | MySQL | DDL `ALTER TABLE` and `DROP` schema evolution demonstration | ✅ Success (Code 0) |
| **7** | `verify_database.sql` | MySQL | Comprehensive schema, table, view, routine, and row count verification | ✅ Success (Code 0) |
| **8** | `06_mongodb_schema.js` | MongoDB | JSON Schema validation, text indexes, and polymorphic inspection documents | ✅ Success (Code 0) |

---

## 2. Table Row Count Verification

Queried directly from MySQL information schema and table aggregates:

```sql
SELECT 'users' AS table_name, COUNT(*) AS total_rows FROM users UNION ALL
SELECT 'customers', COUNT(*) FROM customers UNION ALL
SELECT 'vehicle_catalogue', COUNT(*) FROM vehicle_catalogue UNION ALL
SELECT 'customer_vehicles', COUNT(*) FROM customer_vehicles UNION ALL
SELECT 'service_types', COUNT(*) FROM service_types UNION ALL
SELECT 'appointments', COUNT(*) FROM appointments UNION ALL
SELECT 'service_jobs', COUNT(*) FROM service_jobs UNION ALL
SELECT 'job_services', COUNT(*) FROM job_services UNION ALL
SELECT 'spare_parts', COUNT(*) FROM spare_parts UNION ALL
SELECT 'part_usage', COUNT(*) FROM part_usage UNION ALL
SELECT 'invoices', COUNT(*) FROM invoices UNION ALL
SELECT 'invoice_payments', COUNT(*) FROM invoice_payments UNION ALL
SELECT 'maintenance_reminders', COUNT(*) FROM maintenance_reminders;
```

### Actual Verified Row Counts:

| # | Table Name | Verified Row Count | Description / Source |
| :---: | :--- | :---: | :--- |
| 1 | `users` | **6** | System users across 3 roles: admin, service_advisor, mechanic |
| 2 | `customers` | **6** | Customer vehicle owners with contact addresses and phone numbers |
| 3 | `vehicle_catalogue` | **3,229** | Ingested from 3 vehicle datasets (2,362 LDV + 594 AFV + 265 MHD + 8 seed) |
| 4 | `customer_vehicles` | **6** | Registered customer vehicles linked to master catalogue |
| 5 | `service_types` | **10** | Shop service catalogue (Oil Change, Brake Pad, Alignment, etc.) |
| 6 | `appointments` | **6** | Service booking records (pending, confirmed, completed) |
| 7 | `service_jobs` | **3** | Active and completed workshop jobs |
| 8 | `job_services` | **3** | Bridge: services performed per job |
| 9 | `spare_parts` | **10** | Inventory tracking units, pricing, cost, and reorder levels |
| 10 | `part_usage` | **2** | Parts consumed in completed jobs (triggers stock deduction) |
| 11 | `invoices` | **3** | Financial invoices linked to jobs with taxes and discounts |
| 12 | `invoice_payments` | **2** | Payment transactions (UPI, Card, Cash) against invoices |
| 13 | `maintenance_reminders` | **3** | Predictive mileage and date triggers |

---

## 3. Advanced SQL Objects Verification

### A. Views (3/3 Verified)
1. **`vw_service_summary`**: Multi-table join combining service job details, customer info, vehicle description, assigned technician, and invoice totals. Verified output:
   - Job #1: Arjun Sharma &bull; Acura NSX (2022) &bull; Mechanic: Suresh Mehta &bull; Total: ₹2,183.00 &bull; Status: `paid`
   - Job #2: Deepa Verma &bull; Toyota Camry (2022) &bull; Mechanic: Anjali Singh &bull; Total: ₹708.00 &bull; Status: `paid`
   - Job #3: Mohammed Farhan &bull; Ford F-150 (2022) &bull; Mechanic: Vikram Patel &bull; Total: ₹1,770.00 &bull; Status: `issued`
2. **`vw_inventory_low_stock`**: Automatically isolates parts where `qty_in_stock <= reorder_level`. Verified output:
   - `TYR-PIL-205` (Pirelli Tyres): Stock 2, Reorder Level 4 (LOW STOCK)
   - `AIR-FLT-002` (Air Filter): Stock 7, Reorder Level 8 (LOW STOCK)
   - `BAT-12V-65AH` (12V Battery): Stock 3, Reorder Level 3 (AT THRESHOLD)
3. **`vw_pending_maintenance`**: Isolates active reminders where mileage or date is due. Verified output:
   - Deepa Verma &bull; Toyota Camry &bull; Oil Change &bull; 5,000 km remaining
   - Mohammed Farhan &bull; Ford F-150 &bull; General Inspection &bull; Date due

### B. Stored Procedures & Functions (5/5 Verified)
- `sp_book_appointment(p_customer_id, p_vehicle_id, ...)`: Validates ownership and schedule conflict before atomic transaction insert.
- `sp_generate_invoice(p_job_id, p_tax_rate, ...)`: Aggregates parts + service costs, applies tax/discounts, and creates invoice.
- `sp_get_customer_vehicle_history(1)`: **Executed & Verified Live** &rarr; returned complete service history for vehicle 1.
- `fn_invoice_total_paid(1)`: **Executed & Verified Live** &rarr; returned `2183.00`.
- `fn_days_since_last_service(1)`: **Executed & Verified Live** &rarr; returned `535` days.

### C. Triggers (4/4 Verified)
- `trg_deduct_stock_on_part_usage` (AFTER INSERT on `part_usage`): Successfully decrements `spare_parts.qty_in_stock`.
- `trg_restore_stock_on_part_usage_delete` (AFTER DELETE on `part_usage`): Restores inventory count on cancelled usage.
- `trg_auto_reminder_on_job_complete` (AFTER UPDATE on `service_jobs`): Automatically generates a next-service reminder when job marks `completed`.
- `trg_mark_invoice_paid` (AFTER INSERT on `invoice_payments`): Evaluates total payments against invoice total and sets status to `paid`.

---

## 4. DDL Demonstration (Requirement 5: CREATE, ALTER, DROP)

Executed via [`database/08_ddl_alter_drop_demo.sql`](file:///D:/DBMS_Assignment/database/08_ddl_alter_drop_demo.sql):
- **ALTER ADD COLUMN:** `customers.loyalty_points`, `service_jobs.warranty_months`, `maintenance_reminders.notification_channel`.
- **ALTER MODIFY COLUMN:** `customers.phone VARCHAR(25)`.
- **ALTER ADD CONSTRAINT:** `spare_parts.chk_part_selling_cost_margin CHECK (selling_price >= unit_cost)`.
- **ALTER ADD/DROP INDEX:** Added and dropped `idx_temp_action` on demo audit table.
- **SAFE DROP:** Staging table `audit_log_demo` created, evolved with ALTER, and dropped cleanly.

---

## 5. MongoDB Document Store Verification

- Database: `autocare_db`
- Collection: `repair_reports` (3 verified polymorphic inspection reports)
- JSON Schema validator: Enforces required fields (`job_id`, `vehicle_id`, `mechanic_id`, `created_at`)
- Cross-paradigm link: `service_jobs.mongo_report_id` (`6648a1b2c3d4e5f601020304`) &harr; `repair_reports._id`
- Health scores recorded: 88, 65, 76 (Fleet average: 76.3%)
