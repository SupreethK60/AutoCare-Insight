# AutoCare Insight — Advanced SQL & Transaction Demonstration

This directory contains production-ready advanced SQL demonstrations for the **AutoCare Insight** DBMS project, showcasing views, stored procedures, triggers, audit logging, and ACID transaction semantics.

---

## 1. Script Inventory & Execution Order

| Step | Script File | Description | Features Covered |
|---|---|---|---|
| 1 | `01_views_demo.sql` | Reporting & Aggregation Views | `CREATE OR REPLACE VIEW`, multi-table LEFT JOINs, derived aggregations (`vw_customer_fleet_overview`, `vw_technician_performance`, `vw_invoice_settlement_audit`) |
| 2 | `02_stored_procedures_demo.sql` | Parameterized Stored Procedures | `sp_mechanic_workload_summary` with date ranges, `sp_replenish_low_stock_parts` with CURSOR iteration and OUT parameters |
| 3 | `03_triggers_demo.sql` | Automated Inventory Auditing | `AFTER UPDATE` trigger `trg_audit_spare_part_changes` writing to `spare_parts_audit` table |
| 4 | `04_transactions_demo.sql` | ACID Transactions & Savepoints | Multi-table atomic commit, rollback on error, and `SAVEPOINT` partial rollbacks |

---

## 2. Prerequisites
- **MySQL Server 8.0+** running with InnoDB storage engine.
- Schema initialized via `01_create_database.sql` and `02_create_tables.sql`.
- Ingested vehicle catalogue and sample data from `04_import_csv_vehicle_catalogue.sql` and `05_sample_data.sql`.

---

## 3. How to Execute

Using the MySQL CLI:
```bash
mysql -u root -p autocare_insight < database/advanced/01_views_demo.sql
mysql -u root -p autocare_insight < database/advanced/02_stored_procedures_demo.sql
mysql -u root -p autocare_insight < database/advanced/03_triggers_demo.sql
mysql -u root -p autocare_insight < database/advanced/04_transactions_demo.sql
```

Or run all four sequentially via PowerShell:
```powershell
Get-ChildItem database/advanced/*.sql | ForEach-Object {
    & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p"Simha@1234" autocare_insight -e "source $($_.FullName)"
}
```

---

## 4. Verification Queries

```sql
-- 1. Check all views
SHOW FULL TABLES WHERE Table_type = 'VIEW';

-- 2. Verify audit trigger records
SELECT * FROM spare_parts_audit ORDER BY audit_id DESC LIMIT 5;

-- 3. Verify procedure output
CALL sp_mechanic_workload_summary(4, 60);

-- 4. Check low stock parts
SELECT * FROM vw_inventory_low_stock;
```

