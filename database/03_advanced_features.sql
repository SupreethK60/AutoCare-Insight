-- ============================================================
-- AutoCare Insight — Vehicle Service Management System
-- Script 03: Advanced SQL — Views, Stored Procedures,
--            Functions, Triggers, and Transactions
-- Run after 02_create_tables.sql + 05_sample_data.sql
-- ============================================================

USE autocare_insight;

DELIMITER $$

-- ============================================================
-- SECTION A: VIEWS
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- VIEW 1: vw_service_summary
-- Full summary of every job: customer, vehicle, mechanic,
-- services performed, total invoice amount, and payment status.
-- Use Case: Management dashboard, customer history lookup.
-- ──────────────────────────────────────────────────────────
DROP VIEW IF EXISTS vw_service_summary$$

CREATE VIEW vw_service_summary AS
SELECT
    sj.job_id,
    sj.status                          AS job_status,
    sj.started_at,
    sj.completed_at,
    sj.mongo_report_id,

    -- Customer
    c.customer_id,
    c.full_name                        AS customer_name,
    c.phone                            AS customer_phone,

    -- Vehicle registered to customer
    cv.vehicle_id,
    cv.license_plate,
    cv.vin,
    CONCAT(vc.manufacturer,' ',vc.model,' (',vc.model_year,')') AS vehicle_description,
    vc.category                        AS vehicle_category,
    vc.fuel                            AS vehicle_fuel,

    -- Mechanic
    u.full_name                        AS mechanic_name,

    -- Invoice
    inv.invoice_id,
    inv.subtotal,
    inv.tax_amount,
    inv.discount_amount,
    inv.total_amount,
    inv.status                         AS invoice_status,

    -- Services (aggregated)
    GROUP_CONCAT(st.service_name ORDER BY st.service_name SEPARATOR ', ')
                                       AS services_performed

FROM service_jobs sj
    JOIN customer_vehicles cv   ON sj.vehicle_id   = cv.vehicle_id
    JOIN customers c            ON cv.customer_id  = c.customer_id
    LEFT JOIN vehicle_catalogue vc ON cv.catalogue_id = vc.catalogue_id
    LEFT JOIN users u           ON sj.mechanic_id  = u.user_id
    LEFT JOIN invoices inv      ON sj.job_id       = inv.job_id
    LEFT JOIN job_services js   ON sj.job_id       = js.job_id
    LEFT JOIN service_types st  ON js.service_type_id = st.service_type_id
GROUP BY
    sj.job_id, sj.status, sj.started_at, sj.completed_at, sj.mongo_report_id,
    c.customer_id, c.full_name, c.phone,
    cv.vehicle_id, cv.license_plate, cv.vin, vehicle_description, vehicle_category, vehicle_fuel,
    u.full_name,
    inv.invoice_id, inv.subtotal, inv.tax_amount, inv.discount_amount, inv.total_amount, inv.status$$


-- ──────────────────────────────────────────────────────────
-- VIEW 2: vw_inventory_low_stock
-- Parts where qty_in_stock is at or below the reorder_level.
-- Use Case: Purchasing team sees what needs restocking.
-- ──────────────────────────────────────────────────────────
DROP VIEW IF EXISTS vw_inventory_low_stock$$

CREATE VIEW vw_inventory_low_stock AS
SELECT
    part_id,
    part_number,
    part_name,
    category,
    brand,
    unit_cost,
    selling_price,
    qty_in_stock,
    reorder_level,
    (reorder_level - qty_in_stock)  AS units_short,
    location_code
FROM spare_parts
WHERE qty_in_stock <= reorder_level
  AND is_active = 1
ORDER BY units_short DESC$$


-- ──────────────────────────────────────────────────────────
-- VIEW 3: vw_pending_maintenance
-- Vehicles whose maintenance reminder is due (unsent, active).
-- Use Case: Service advisor sees who to call/SMS today.
-- ──────────────────────────────────────────────────────────
DROP VIEW IF EXISTS vw_pending_maintenance$$

CREATE VIEW vw_pending_maintenance AS
SELECT
    mr.reminder_id,
    c.full_name                  AS customer_name,
    c.phone                      AS customer_phone,
    c.email                      AS customer_email,
    cv.license_plate,
    CONCAT(vc.manufacturer,' ',vc.model,' (',vc.model_year,')')
                                 AS vehicle_description,
    st.service_name              AS service_due,
    mr.reminder_type,
    mr.next_service_date,
    mr.next_service_odometer,
    cv.current_odometer,
    (mr.next_service_odometer - cv.current_odometer)
                                 AS km_remaining
FROM maintenance_reminders mr
    JOIN customer_vehicles cv    ON mr.vehicle_id      = cv.vehicle_id
    JOIN customers c             ON cv.customer_id     = c.customer_id
    LEFT JOIN vehicle_catalogue vc ON cv.catalogue_id  = vc.catalogue_id
    LEFT JOIN service_types st   ON mr.service_type_id = st.service_type_id
WHERE mr.is_active = 1
  AND mr.is_sent   = 0
  AND (
        mr.next_service_date <= CURDATE()
     OR mr.next_service_odometer <= cv.current_odometer
  )
ORDER BY mr.next_service_date ASC$$


-- ============================================================
-- SECTION B: STORED PROCEDURES
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- PROCEDURE 1: sp_book_appointment
-- Books a new appointment atomically.
-- Validates: customer exists, vehicle belongs to customer,
--            no double-booking for same vehicle on same day.
-- Usage: CALL sp_book_appointment(1, 3, 2, '2025-06-01 10:00:00', 1, 'Oil making noise', @appt_id, @msg);
-- ──────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_book_appointment$$

CREATE PROCEDURE sp_book_appointment(
    IN  p_customer_id      INT UNSIGNED,
    IN  p_vehicle_id       INT UNSIGNED,
    IN  p_advisor_id       INT UNSIGNED,
    IN  p_scheduled_at     DATETIME,
    IN  p_service_type_id  INT UNSIGNED,
    IN  p_customer_notes   TEXT,
    OUT p_appointment_id   INT UNSIGNED,
    OUT p_message          VARCHAR(255)
)
BEGIN
    DECLARE v_vehicle_owner  INT UNSIGNED DEFAULT 0;
    DECLARE v_conflict_count INT DEFAULT 0;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_appointment_id = 0;
        SET p_message = 'Error: An unexpected SQL error occurred. Appointment not booked.';
    END;

    -- 1. Verify vehicle belongs to this customer
    SELECT customer_id INTO v_vehicle_owner
    FROM customer_vehicles
    WHERE vehicle_id = p_vehicle_id AND is_active = 1;

    IF v_vehicle_owner != p_customer_id THEN
        SET p_appointment_id = 0;
        SET p_message = 'Error: Vehicle does not belong to this customer.';
        LEAVE sp_book_appointment;
    END IF;

    -- 2. Check for existing appointment for this vehicle on the same calendar day
    SELECT COUNT(*) INTO v_conflict_count
    FROM appointments
    WHERE vehicle_id = p_vehicle_id
      AND DATE(scheduled_at) = DATE(p_scheduled_at)
      AND status NOT IN ('cancelled','completed');

    IF v_conflict_count > 0 THEN
        SET p_appointment_id = 0;
        SET p_message = 'Error: Vehicle already has an appointment on that date.';
        LEAVE sp_book_appointment;
    END IF;

    -- 3. All checks passed — insert atomically
    START TRANSACTION;

        INSERT INTO appointments (customer_id, vehicle_id, advisor_id, scheduled_at,
                                  service_type_id, customer_notes, status)
        VALUES (p_customer_id, p_vehicle_id, p_advisor_id, p_scheduled_at,
                p_service_type_id, p_customer_notes, 'confirmed');

        SET p_appointment_id = LAST_INSERT_ID();

    COMMIT;

    SET p_message = CONCAT('Success: Appointment #', p_appointment_id, ' booked.');
END$$


-- ──────────────────────────────────────────────────────────
-- PROCEDURE 2: sp_generate_invoice
-- Calculates and inserts an invoice for a completed job.
-- Totals: service charges from job_services + parts costs
--         from part_usage, then applies tax and discount.
-- Usage: CALL sp_generate_invoice(5, 18.00, 0.00, @inv_id, @msg);
-- ──────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_generate_invoice$$

CREATE PROCEDURE sp_generate_invoice(
    IN  p_job_id          INT UNSIGNED,
    IN  p_tax_rate        DECIMAL(5,2),
    IN  p_discount_amount DECIMAL(10,2),
    OUT p_invoice_id      INT UNSIGNED,
    OUT p_message         VARCHAR(255)
)
BEGIN
    DECLARE v_customer_id  INT UNSIGNED DEFAULT 0;
    DECLARE v_job_status   VARCHAR(30);
    DECLARE v_existing_inv INT DEFAULT 0;
    DECLARE v_services_total DECIMAL(10,2) DEFAULT 0.00;
    DECLARE v_parts_total    DECIMAL(10,2) DEFAULT 0.00;
    DECLARE v_subtotal       DECIMAL(10,2);
    DECLARE v_tax_amount     DECIMAL(10,2);
    DECLARE v_total          DECIMAL(10,2);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_invoice_id = 0;
        SET p_message = 'Error: SQL exception during invoice generation.';
    END;

    -- 1. Validate job exists and is completed
    SELECT sj.status, cv.customer_id
    INTO   v_job_status, v_customer_id
    FROM service_jobs sj
    JOIN customer_vehicles cv ON sj.vehicle_id = cv.vehicle_id
    WHERE sj.job_id = p_job_id;

    IF v_customer_id = 0 THEN
        SET p_invoice_id = 0;
        SET p_message = 'Error: Job not found.';
        LEAVE sp_generate_invoice;
    END IF;

    IF v_job_status != 'completed' THEN
        SET p_invoice_id = 0;
        SET p_message = 'Error: Cannot invoice a job that is not completed.';
        LEAVE sp_generate_invoice;
    END IF;

    -- 2. Check invoice not already generated
    SELECT COUNT(*) INTO v_existing_inv FROM invoices WHERE job_id = p_job_id;
    IF v_existing_inv > 0 THEN
        SET p_invoice_id = 0;
        SET p_message = 'Error: Invoice already exists for this job.';
        LEAVE sp_generate_invoice;
    END IF;

    -- 3. Calculate totals
    SELECT COALESCE(SUM(service_price), 0) INTO v_services_total
    FROM job_services WHERE job_id = p_job_id;

    SELECT COALESCE(SUM(qty_used * unit_price_charged), 0) INTO v_parts_total
    FROM part_usage WHERE job_id = p_job_id;

    SET v_subtotal   = v_services_total + v_parts_total - p_discount_amount;
    SET v_tax_amount = ROUND(v_subtotal * p_tax_rate / 100, 2);
    SET v_total      = v_subtotal + v_tax_amount;

    -- 4. Insert invoice atomically
    START TRANSACTION;

        INSERT INTO invoices (job_id, customer_id, subtotal, tax_rate, tax_amount,
                              discount_amount, total_amount, status, issued_at, due_date)
        VALUES (p_job_id, v_customer_id, v_subtotal, p_tax_rate, v_tax_amount,
                p_discount_amount, v_total, 'issued', NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY));

        SET p_invoice_id = LAST_INSERT_ID();

    COMMIT;

    SET p_message = CONCAT('Success: Invoice #', p_invoice_id,
                           ' generated. Total: ', v_total);
END$$


-- ──────────────────────────────────────────────────────────
-- PROCEDURE 3: sp_get_customer_vehicle_history
-- Returns full service history for a given customer vehicle.
-- Usage: CALL sp_get_customer_vehicle_history(3);
-- ──────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_get_customer_vehicle_history$$

CREATE PROCEDURE sp_get_customer_vehicle_history(
    IN p_vehicle_id INT UNSIGNED
)
BEGIN
    SELECT
        sj.job_id,
        sj.started_at,
        sj.completed_at,
        sj.odometer_in,
        sj.odometer_out,
        sj.status           AS job_status,
        u.full_name         AS mechanic,
        GROUP_CONCAT(st.service_name SEPARATOR ', ')
                            AS services,
        inv.total_amount    AS invoice_total,
        inv.status          AS payment_status,
        sj.mongo_report_id  AS inspection_report_id
    FROM service_jobs sj
        LEFT JOIN users u           ON sj.mechanic_id  = u.user_id
        LEFT JOIN job_services js   ON sj.job_id       = js.job_id
        LEFT JOIN service_types st  ON js.service_type_id = st.service_type_id
        LEFT JOIN invoices inv      ON sj.job_id       = inv.job_id
    WHERE sj.vehicle_id = p_vehicle_id
    GROUP BY sj.job_id, sj.started_at, sj.completed_at,
             sj.odometer_in, sj.odometer_out, sj.status,
             u.full_name, inv.total_amount, inv.status, sj.mongo_report_id
    ORDER BY sj.started_at DESC;
END$$


-- ============================================================
-- SECTION C: STORED FUNCTIONS
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- FUNCTION 1: fn_invoice_total_paid
-- Returns total amount paid so far against an invoice.
-- ──────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS fn_invoice_total_paid$$

CREATE FUNCTION fn_invoice_total_paid(p_invoice_id INT UNSIGNED)
RETURNS DECIMAL(10,2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_paid DECIMAL(10,2) DEFAULT 0.00;
    SELECT COALESCE(SUM(amount_paid), 0)
    INTO   v_paid
    FROM invoice_payments
    WHERE invoice_id = p_invoice_id;
    RETURN v_paid;
END$$


-- ──────────────────────────────────────────────────────────
-- FUNCTION 2: fn_days_since_last_service
-- Returns how many days ago a vehicle last had a completed job.
-- ──────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS fn_days_since_last_service$$

CREATE FUNCTION fn_days_since_last_service(p_vehicle_id INT UNSIGNED)
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_last_date DATETIME DEFAULT NULL;
    SELECT MAX(completed_at)
    INTO   v_last_date
    FROM service_jobs
    WHERE vehicle_id = p_vehicle_id
      AND status = 'completed';

    IF v_last_date IS NULL THEN
        RETURN -1;  -- Never serviced
    END IF;
    RETURN DATEDIFF(CURDATE(), DATE(v_last_date));
END$$


-- ============================================================
-- SECTION D: TRIGGERS
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- TRIGGER 1: trg_deduct_stock_on_part_usage
-- AFTER INSERT on part_usage:
-- Automatically reduces spare_parts.qty_in_stock by qty_used.
-- ──────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_deduct_stock_on_part_usage$$

CREATE TRIGGER trg_deduct_stock_on_part_usage
AFTER INSERT ON part_usage
FOR EACH ROW
BEGIN
    UPDATE spare_parts
    SET    qty_in_stock = qty_in_stock - NEW.qty_used,
           updated_at   = NOW()
    WHERE  part_id = NEW.part_id;
END$$


-- ──────────────────────────────────────────────────────────
-- TRIGGER 2: trg_restore_stock_on_part_usage_delete
-- AFTER DELETE on part_usage:
-- Restores stock if a part usage row is removed (e.g. job cancelled).
-- ──────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_restore_stock_on_part_usage_delete$$

CREATE TRIGGER trg_restore_stock_on_part_usage_delete
AFTER DELETE ON part_usage
FOR EACH ROW
BEGIN
    UPDATE spare_parts
    SET    qty_in_stock = qty_in_stock + OLD.qty_used,
           updated_at   = NOW()
    WHERE  part_id = OLD.part_id;
END$$


-- ──────────────────────────────────────────────────────────
-- TRIGGER 3: trg_auto_reminder_on_job_complete
-- AFTER UPDATE on service_jobs:
-- When a job status changes to 'completed', automatically
-- create a maintenance reminder for the next oil change
-- (3000 km / 90 days from now), if none already active.
-- ──────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_auto_reminder_on_job_complete$$

CREATE TRIGGER trg_auto_reminder_on_job_complete
AFTER UPDATE ON service_jobs
FOR EACH ROW
BEGIN
    DECLARE v_oil_change_type_id INT UNSIGNED;
    DECLARE v_existing_reminder  INT DEFAULT 0;

    -- Only run when status changes TO 'completed'
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN

        -- Find 'Oil Change' service type (if it exists)
        SELECT service_type_id INTO v_oil_change_type_id
        FROM service_types
        WHERE service_name LIKE '%Oil Change%'
        LIMIT 1;

        -- Check if reminder already exists for this vehicle
        SELECT COUNT(*) INTO v_existing_reminder
        FROM maintenance_reminders
        WHERE vehicle_id    = NEW.vehicle_id
          AND service_type_id = v_oil_change_type_id
          AND is_active     = 1
          AND is_sent       = 0;

        IF v_oil_change_type_id IS NOT NULL AND v_existing_reminder = 0 THEN
            INSERT INTO maintenance_reminders
                (vehicle_id, service_type_id, reminder_type,
                 next_service_date, next_service_odometer,
                 interval_km, interval_days, is_active)
            VALUES
                (NEW.vehicle_id, v_oil_change_type_id, 'interval',
                 DATE_ADD(NOW(), INTERVAL 90 DAY),
                 IFNULL(NEW.odometer_out, 0) + 3000,
                 3000, 90, 1);
        END IF;

    END IF;
END$$


-- ──────────────────────────────────────────────────────────
-- TRIGGER 4: trg_mark_invoice_paid
-- AFTER INSERT on invoice_payments:
-- If total paid >= invoice total, automatically marks the
-- invoice status as 'paid'.
-- ──────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_mark_invoice_paid$$

CREATE TRIGGER trg_mark_invoice_paid
AFTER INSERT ON invoice_payments
FOR EACH ROW
BEGIN
    DECLARE v_total_due   DECIMAL(10,2) DEFAULT 0.00;
    DECLARE v_total_paid  DECIMAL(10,2) DEFAULT 0.00;

    SELECT total_amount INTO v_total_due
    FROM invoices WHERE invoice_id = NEW.invoice_id;

    SELECT COALESCE(SUM(amount_paid), 0) INTO v_total_paid
    FROM invoice_payments WHERE invoice_id = NEW.invoice_id;

    IF v_total_paid >= v_total_due THEN
        UPDATE invoices
        SET status     = 'paid',
            updated_at = NOW()
        WHERE invoice_id = NEW.invoice_id;
    END IF;
END$$


-- ============================================================
-- SECTION E: INDEXES (Additional composite indexes)
-- ============================================================
DELIMITER ;

-- Speeds up appointment lookups by date range for dashboard calendar
CREATE INDEX idx_appt_scheduled_status
ON appointments (scheduled_at, status);

-- Speeds up revenue reports grouped by month
CREATE INDEX idx_inv_issued_status
ON invoices (issued_at, status);

-- Speeds up part usage cost reports per job
CREATE INDEX idx_pu_job_part
ON part_usage (job_id, part_id);

-- Speeds up catalogue full-text search
CREATE FULLTEXT INDEX idx_cat_fulltext
ON vehicle_catalogue (manufacturer, model, category, fuel);


-- ============================================================
-- SECTION F: DEMONSTRATION TRANSACTION
-- Shows an atomic transaction used in a real workflow:
-- "Complete a job, deduct stock, generate invoice — all or nothing"
-- ============================================================
-- NOTE: This is a DEMONSTRATION block. Run manually to test.
-- Replace the IDs with real values after inserting sample data.
/*
START TRANSACTION;

-- Step 1: Mark job as completed
UPDATE service_jobs
SET status       = 'completed',
    completed_at = NOW(),
    odometer_out = 52000
WHERE job_id = 1;

-- Step 2: Record a part used
INSERT INTO part_usage (job_id, part_id, qty_used, unit_price_charged)
VALUES (1, 1, 2, 450.00);   -- 2x oil filters @ ₹450 each

-- Step 3: Generate invoice (calls stored procedure)
CALL sp_generate_invoice(1, 18.00, 0.00, @inv_id, @msg);
SELECT @inv_id AS invoice_id, @msg AS message;

-- If all steps succeed, commit; if anything fails, rollback
COMMIT;
-- On error: ROLLBACK;
*/

SELECT 'Script 03: Advanced SQL features created successfully.' AS status;
