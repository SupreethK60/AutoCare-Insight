-- ============================================================
-- AutoCare Insight — Important SQL Queries
-- Demonstrates JOINs, aggregates, subqueries, GROUP BY,
-- HAVING, ORDER BY, and the advanced SQL features.
-- Run after loading sample data (05_sample_data.sql).
-- ============================================================

USE autocare_insight;

-- ─────────────────────────────────────────────────────────────
-- QUERY 1: Simple SELECT with JOIN
-- Full appointment list with customer name, vehicle, and advisor
-- ─────────────────────────────────────────────────────────────
SELECT
    a.appointment_id,
    c.full_name          AS customer,
    CONCAT(vc.manufacturer,' ',vc.model,' (',vc.model_year,')')
                         AS vehicle,
    cv.license_plate,
    u.full_name          AS advisor,
    st.service_name      AS service_requested,
    a.scheduled_at,
    a.status
FROM appointments a
    JOIN customers c          ON a.customer_id     = c.customer_id
    JOIN customer_vehicles cv ON a.vehicle_id      = cv.vehicle_id
    JOIN vehicle_catalogue vc ON cv.catalogue_id   = vc.catalogue_id
    JOIN users u              ON a.advisor_id      = u.user_id
    JOIN service_types st     ON a.service_type_id = st.service_type_id
ORDER BY a.scheduled_at;


-- ─────────────────────────────────────────────────────────────
-- QUERY 2: Aggregate — Total revenue per month
-- ─────────────────────────────────────────────────────────────
SELECT
    DATE_FORMAT(issued_at, '%Y-%m')    AS month,
    COUNT(*)                           AS invoices_issued,
    SUM(total_amount)                  AS gross_revenue,
    SUM(CASE WHEN status='paid'
             THEN total_amount ELSE 0 END) AS collected_revenue,
    AVG(total_amount)                  AS avg_invoice_value
FROM invoices
WHERE status != 'cancelled'
GROUP BY DATE_FORMAT(issued_at, '%Y-%m')
ORDER BY month DESC;


-- ─────────────────────────────────────────────────────────────
-- QUERY 3: GROUP BY + HAVING
-- Mechanics who have completed more than 2 jobs
-- ─────────────────────────────────────────────────────────────
SELECT
    u.full_name          AS mechanic,
    COUNT(sj.job_id)     AS jobs_completed,
    AVG(TIMESTAMPDIFF(MINUTE, sj.started_at, sj.completed_at))
                         AS avg_job_duration_mins
FROM service_jobs sj
    JOIN users u ON sj.mechanic_id = u.user_id
WHERE sj.status = 'completed'
GROUP BY u.user_id, u.full_name
HAVING jobs_completed > 2
ORDER BY jobs_completed DESC;


-- ─────────────────────────────────────────────────────────────
-- QUERY 4: Subquery — Customers who have spent more than
--          the average invoice amount
-- ─────────────────────────────────────────────────────────────
SELECT
    c.full_name                      AS customer,
    c.phone,
    SUM(inv.total_amount)            AS total_spent,
    COUNT(inv.invoice_id)            AS invoices
FROM invoices inv
    JOIN customers c ON inv.customer_id = c.customer_id
WHERE inv.status != 'cancelled'
GROUP BY c.customer_id, c.full_name, c.phone
HAVING total_spent > (
    SELECT AVG(total_amount)
    FROM invoices
    WHERE status != 'cancelled'
)
ORDER BY total_spent DESC;


-- ─────────────────────────────────────────────────────────────
-- QUERY 5: Correlated Subquery
-- For each vehicle, show the cost of its most recent completed job
-- ─────────────────────────────────────────────────────────────
SELECT
    cv.license_plate,
    CONCAT(vc.manufacturer,' ',vc.model)  AS vehicle,
    c.full_name                           AS owner,
    (
        SELECT inv.total_amount
        FROM service_jobs sj2
            JOIN invoices inv ON sj2.job_id = inv.job_id
        WHERE sj2.vehicle_id = cv.vehicle_id
          AND sj2.status = 'completed'
        ORDER BY sj2.completed_at DESC
        LIMIT 1
    )                                     AS last_job_cost
FROM customer_vehicles cv
    JOIN customers c           ON cv.customer_id  = c.customer_id
    JOIN vehicle_catalogue vc  ON cv.catalogue_id = vc.catalogue_id
ORDER BY cv.vehicle_id;


-- ─────────────────────────────────────────────────────────────
-- QUERY 6: Multi-table JOIN with aggregate
-- Top 5 most-used spare parts across all jobs
-- ─────────────────────────────────────────────────────────────
SELECT
    sp.part_number,
    sp.part_name,
    sp.category,
    SUM(pu.qty_used)                       AS total_units_consumed,
    SUM(pu.qty_used * pu.unit_price_charged) AS total_revenue_from_part
FROM part_usage pu
    JOIN spare_parts sp ON pu.part_id = sp.part_id
GROUP BY sp.part_id, sp.part_number, sp.part_name, sp.category
ORDER BY total_units_consumed DESC
LIMIT 5;


-- ─────────────────────────────────────────────────────────────
-- QUERY 7: VIEW usage — Service summary for all completed jobs
-- ─────────────────────────────────────────────────────────────
SELECT * FROM vw_service_summary
WHERE job_status = 'completed'
ORDER BY completed_at DESC;


-- ─────────────────────────────────────────────────────────────
-- QUERY 8: VIEW usage — Low stock items
-- ─────────────────────────────────────────────────────────────
SELECT * FROM vw_inventory_low_stock;


-- ─────────────────────────────────────────────────────────────
-- QUERY 9: VIEW usage — Vehicles with pending maintenance
-- ─────────────────────────────────────────────────────────────
SELECT * FROM vw_pending_maintenance;


-- ─────────────────────────────────────────────────────────────
-- QUERY 10: Stored PROCEDURE call — Book an appointment
-- ─────────────────────────────────────────────────────────────
CALL sp_book_appointment(
    4,                        -- customer_id  (Sonal Khatri)
    4,                        -- vehicle_id   (her Honda CR-V)
    3,                        -- advisor_id   (Priya Nair)
    '2025-06-01 14:00:00',    -- scheduled_at
    5,                        -- service_type_id (Wheel Alignment)
    'Steering pulling left.',  -- customer_notes
    @appt_id,
    @appt_msg
);
SELECT @appt_id AS appointment_id, @appt_msg AS message;


-- ─────────────────────────────────────────────────────────────
-- QUERY 11: Stored PROCEDURE call — Generate invoice for job 3
-- (after marking it completed if not already)
-- ─────────────────────────────────────────────────────────────
CALL sp_generate_invoice(3, 18.00, 0.00, @inv_id, @inv_msg);
SELECT @inv_id AS invoice_id, @inv_msg AS message;


-- ─────────────────────────────────────────────────────────────
-- QUERY 12: Stored PROCEDURE — Vehicle service history
-- ─────────────────────────────────────────────────────────────
CALL sp_get_customer_vehicle_history(1);  -- Arjun's Acura NSX


-- ─────────────────────────────────────────────────────────────
-- QUERY 13: FUNCTION usage — Amount paid on invoice 3
-- ─────────────────────────────────────────────────────────────
SELECT
    invoice_id,
    total_amount,
    fn_invoice_total_paid(invoice_id)                       AS paid_so_far,
    total_amount - fn_invoice_total_paid(invoice_id)        AS balance_due
FROM invoices
WHERE invoice_id = 3;


-- ─────────────────────────────────────────────────────────────
-- QUERY 14: FUNCTION usage — Days since last service per vehicle
-- ─────────────────────────────────────────────────────────────
SELECT
    cv.license_plate,
    CONCAT(vc.manufacturer,' ',vc.model)  AS vehicle,
    fn_days_since_last_service(cv.vehicle_id) AS days_since_last_service
FROM customer_vehicles cv
    JOIN vehicle_catalogue vc ON cv.catalogue_id = vc.catalogue_id
ORDER BY days_since_last_service DESC;


-- ─────────────────────────────────────────────────────────────
-- QUERY 15: Demonstrate TRIGGER effect
-- Insert a part usage row and verify stock was deducted
-- ─────────────────────────────────────────────────────────────
-- Before:
SELECT part_id, part_name, qty_in_stock
FROM spare_parts WHERE part_id = 3;   -- Front Brake Pad Set

-- Simulate adding brake pads to job 2 (brake inspection job)
INSERT INTO part_usage (job_id, part_id, qty_used, unit_price_charged)
VALUES (2, 3, 1, 2000.00);

-- After trigger fires (trg_deduct_stock_on_part_usage):
SELECT part_id, part_name, qty_in_stock
FROM spare_parts WHERE part_id = 3;   -- Should be 1 less than before


-- ─────────────────────────────────────────────────────────────
-- QUERY 16: TRANSACTION demo — Record payment and auto-mark paid
-- (trg_mark_invoice_paid trigger fires automatically)
-- ─────────────────────────────────────────────────────────────
START TRANSACTION;

    INSERT INTO invoice_payments (invoice_id, amount_paid, payment_method, recorded_by)
    VALUES (3, 1770.00, 'cash', 2);

COMMIT;

-- Check invoice status (should now be 'paid' thanks to trigger):
SELECT invoice_id, total_amount, status FROM invoices WHERE invoice_id = 3;


-- ─────────────────────────────────────────────────────────────
-- QUERY 17: Vehicle Catalogue search (using FULLTEXT INDEX)
-- ─────────────────────────────────────────────────────────────
SELECT manufacturer, model, model_year, category, fuel, electric_range
FROM vehicle_catalogue
WHERE MATCH(manufacturer, model, category, fuel)
      AGAINST ('Tesla Electric' IN NATURAL LANGUAGE MODE);


-- ─────────────────────────────────────────────────────────────
-- QUERY 18: Unpaid invoices older than 7 days (overdue check)
-- ─────────────────────────────────────────────────────────────
SELECT
    inv.invoice_id,
    c.full_name       AS customer,
    c.phone,
    inv.total_amount,
    inv.issued_at,
    inv.due_date,
    DATEDIFF(CURDATE(), inv.due_date) AS days_overdue
FROM invoices inv
    JOIN customers c ON inv.customer_id = c.customer_id
WHERE inv.status = 'issued'
  AND inv.due_date < CURDATE()
ORDER BY days_overdue DESC;
