-- ============================================================
-- AutoCare Insight — Advanced SQL Demonstration 1: Views
-- Database: autocare_insight
-- Purpose: Demonstrates reporting views, aggregation views,
--          and multi-table join encapsulation.
-- ============================================================

USE autocare_insight;

-- ─────────────────────────────────────────────────────────────
-- VIEW 1: vw_customer_fleet_overview
-- Consolidates customer profiles with registered vehicle counts,
-- total appointments, completed jobs, and total lifetime spend.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW vw_customer_fleet_overview AS
SELECT
    c.customer_id,
    c.full_name,
    c.phone,
    c.email,
    c.city,
    c.loyalty_points,
    COUNT(DISTINCT cv.vehicle_id)       AS total_vehicles,
    COUNT(DISTINCT a.appointment_id)    AS total_appointments,
    COUNT(DISTINCT sj.job_id)           AS total_jobs,
    COALESCE(SUM(inv.total_amount), 0)  AS total_spend,
    COALESCE(SUM(pay.amount_paid), 0)   AS total_paid
FROM customers c
LEFT JOIN customer_vehicles cv  ON c.customer_id = cv.customer_id AND cv.is_active = 1
LEFT JOIN appointments a        ON c.customer_id = a.customer_id
LEFT JOIN service_jobs sj       ON cv.vehicle_id = sj.vehicle_id AND sj.status = 'completed'
LEFT JOIN invoices inv          ON c.customer_id = inv.customer_id AND inv.status != 'cancelled'
LEFT JOIN invoice_payments pay  ON inv.invoice_id = pay.invoice_id
GROUP BY
    c.customer_id,
    c.full_name,
    c.phone,
    c.email,
    c.city,
    c.loyalty_points;

-- ─────────────────────────────────────────────────────────────
-- VIEW 2: vw_technician_performance
-- Measures technician productivity, completed jobs, total labor,
-- and average job turnaround time in minutes.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW vw_technician_performance AS
SELECT
    u.user_id                                                   AS mechanic_id,
    u.full_name                                                 AS mechanic_name,
    u.email,
    COUNT(sj.job_id)                                            AS total_jobs_assigned,
    SUM(CASE WHEN sj.status = 'completed' THEN 1 ELSE 0 END)   AS jobs_completed,
    SUM(CASE WHEN sj.status = 'in_progress' THEN 1 ELSE 0 END) AS jobs_active,
    ROUND(AVG(CASE WHEN sj.status = 'completed' AND sj.completed_at IS NOT NULL
        THEN TIMESTAMPDIFF(MINUTE, sj.started_at, sj.completed_at)
        ELSE NULL END), 1)                                      AS avg_completion_mins,
    COUNT(DISTINCT pu.part_id)                                  AS distinct_parts_used,
    COALESCE(SUM(pu.qty_used), 0)                               AS total_parts_consumed
FROM users u
LEFT JOIN service_jobs sj ON u.user_id = sj.mechanic_id
LEFT JOIN part_usage pu   ON sj.job_id = pu.job_id
WHERE u.role = 'mechanic' AND u.is_active = 1
GROUP BY
    u.user_id,
    u.full_name,
    u.email;

-- ─────────────────────────────────────────────────────────────
-- VIEW 3: vw_invoice_settlement_audit
-- Real-time audit of invoice totals, cumulative payments,
-- outstanding balances, and settlement status flags.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW vw_invoice_settlement_audit AS
SELECT
    inv.invoice_id,
    inv.job_id,
    inv.customer_id,
    c.full_name                             AS customer_name,
    cv.license_plate,
    inv.subtotal,
    inv.tax_rate,
    inv.tax_amount,
    inv.discount_amount,
    inv.total_amount,
    COALESCE(SUM(pay.amount_paid), 0)       AS total_paid,
    ROUND(inv.total_amount - COALESCE(SUM(pay.amount_paid), 0), 2) AS balance_remaining,
    inv.status                              AS recorded_status,
    CASE
        WHEN COALESCE(SUM(pay.amount_paid), 0) >= inv.total_amount THEN 'SETTLED'
        WHEN COALESCE(SUM(pay.amount_paid), 0) > 0 THEN 'PARTIALLY_PAID'
        WHEN inv.due_date < CURDATE() THEN 'OVERDUE'
        ELSE 'PENDING'
    END                                     AS calculated_status,
    inv.issued_at,
    inv.due_date
FROM invoices inv
JOIN customers c          ON inv.customer_id = c.customer_id
JOIN service_jobs sj      ON inv.job_id = sj.job_id
JOIN customer_vehicles cv ON sj.vehicle_id = cv.vehicle_id
LEFT JOIN invoice_payments pay ON inv.invoice_id = pay.invoice_id
GROUP BY
    inv.invoice_id,
    inv.job_id,
    inv.customer_id,
    c.full_name,
    cv.license_plate,
    inv.subtotal,
    inv.tax_rate,
    inv.tax_amount,
    inv.discount_amount,
    inv.total_amount,
    inv.status,
    inv.issued_at,
    inv.due_date;

-- ─────────────────────────────────────────────────────────────
-- VERIFICATION QUERIES:
-- ─────────────────────────────────────────────────────────────
SELECT '--- VIEW: vw_customer_fleet_overview ---' AS check_title;
SELECT * FROM vw_customer_fleet_overview LIMIT 5;

SELECT '--- VIEW: vw_technician_performance ---' AS check_title;
SELECT * FROM vw_technician_performance;

SELECT '--- VIEW: vw_invoice_settlement_audit ---' AS check_title;
SELECT * FROM vw_invoice_settlement_audit LIMIT 5;

