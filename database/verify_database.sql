-- ============================================================
-- AutoCare Insight — Database Verification Script
-- Run against autocare_insight to verify schema, rows, and integrity
-- ============================================================

USE autocare_insight;

SELECT '=== 1. VERIFY ALL 13 TABLES EXIST ===' AS verification_step;
SHOW FULL TABLES WHERE Table_type = 'BASE TABLE';

SELECT '=== 2. VERIFY ALL 3 VIEWS EXIST ===' AS verification_step;
SHOW FULL TABLES WHERE Table_type = 'VIEW';

SELECT '=== 3. VERIFY STORED PROCEDURES & FUNCTIONS ===' AS verification_step;
SELECT routine_name, routine_type, data_type 
FROM information_schema.routines 
WHERE routine_schema = 'autocare_insight'
ORDER BY routine_type, routine_name;

SELECT '=== 4. VERIFY TRIGGERS ===' AS verification_step;
SELECT trigger_name, event_manipulation, event_object_table, action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'autocare_insight'
ORDER BY event_object_table, trigger_name;

SELECT '=== 5. VERIFY TABLE ROW COUNTS ===' AS verification_step;
SELECT 'users'                 AS table_name, COUNT(*) AS total_rows FROM users              UNION ALL
SELECT 'customers',                           COUNT(*)             FROM customers          UNION ALL
SELECT 'vehicle_catalogue',                   COUNT(*)             FROM vehicle_catalogue  UNION ALL
SELECT 'customer_vehicles',                   COUNT(*)             FROM customer_vehicles  UNION ALL
SELECT 'service_types',                       COUNT(*)             FROM service_types      UNION ALL
SELECT 'appointments',                        COUNT(*)             FROM appointments       UNION ALL
SELECT 'service_jobs',                        COUNT(*)             FROM service_jobs       UNION ALL
SELECT 'job_services',                        COUNT(*)             FROM job_services       UNION ALL
SELECT 'spare_parts',                         COUNT(*)             FROM spare_parts        UNION ALL
SELECT 'part_usage',                          COUNT(*)             FROM part_usage         UNION ALL
SELECT 'invoices',                            COUNT(*)             FROM invoices           UNION ALL
SELECT 'invoice_payments',                    COUNT(*)             FROM invoice_payments   UNION ALL
SELECT 'maintenance_reminders',               COUNT(*)             FROM maintenance_reminders;

SELECT '=== 6. VERIFY FOREIGN KEY CONSTRAINTS ===' AS verification_step;
SELECT 
    table_name,
    constraint_name,
    referenced_table_name
FROM information_schema.key_column_usage
WHERE table_schema = 'autocare_insight'
  AND referenced_table_name IS NOT NULL
ORDER BY table_name, constraint_name;

SELECT '=== 7. VERIFY VIEWS EXECUTION ===' AS verification_step;
SELECT 'vw_service_summary sample:' AS test;
SELECT job_id, customer_name, vehicle_description, mechanic_name, total_amount, invoice_status FROM vw_service_summary LIMIT 3;

SELECT 'vw_inventory_low_stock sample:' AS test;
SELECT part_number, part_name, qty_in_stock, reorder_level FROM vw_inventory_low_stock;

SELECT 'vw_pending_maintenance sample:' AS test;
SELECT reminder_id, customer_name, vehicle_description, service_due, reminder_type, km_remaining FROM vw_pending_maintenance;
