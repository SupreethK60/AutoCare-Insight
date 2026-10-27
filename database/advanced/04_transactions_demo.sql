-- ============================================================
-- AutoCare Insight — Advanced SQL Demonstration 4: ACID Transactions
-- Database: autocare_insight
-- Purpose: Demonstrates atomicity, consistency, isolation, and
--          durability using START TRANSACTION, COMMIT, ROLLBACK,
--          and SAVEPOINTS across interrelated workshop entities.
-- ============================================================

USE autocare_insight;

-- ─────────────────────────────────────────────────────────────
-- DEMONSTRATION 1: Successful Multi-Step Atomic Transaction
-- Workflow:
--   1. Create a service job for vehicle 1 (Acura NSX)
--   2. Add labor charge (Oil & Filter Change) to job_services
--   3. Deduct and record part usage (Synthetic 5W-30 Oil)
--   4. Generate invoice and commit atomically
-- ─────────────────────────────────────────────────────────────
SELECT '=== DEMO 1: Atomic Multi-Table Commit ===' AS demonstration;

START TRANSACTION;

    -- 1. Create Job
    INSERT INTO service_jobs (
        appointment_id,
        mechanic_id,
        vehicle_id,
        status,
        odometer_in,
        started_at,
        internal_notes
    ) VALUES (
        1,
        4,
        1,
        'in_progress',
        45200,
        NOW(),
        'ACID Demo Job: Full Synthetic Oil & Filter Service'
    );

    SET @demo_job_id = LAST_INSERT_ID();

    -- 2. Add Service Operation (Oil & Filter Change - Base price Rs 800)
    INSERT INTO job_services (
        job_id,
        service_type_id,
        service_price,
        technician_notes
    ) VALUES (
        @demo_job_id,
        2,
        800.00,
        'Standard synthetic oil change service'
    );

    -- 3. Consume Spare Part (Part 2: 5W-30 Full Synthetic Oil 4L - 1 can @ Rs 2400)
    -- Note: MySQL trigger trg_deduct_stock_on_part_usage will deduct stock automatically!
    INSERT INTO part_usage (
        job_id,
        part_id,
        qty_used,
        unit_price_charged
    ) VALUES (
        @demo_job_id,
        2,
        1,
        2400.00
    );

    -- 4. Mark Job Completed
    UPDATE service_jobs
    SET status = 'completed',
        completed_at = NOW(),
        odometer_out = 45215
    WHERE job_id = @demo_job_id;

    -- 5. Commit all changes atomically
COMMIT;

-- Verify all 3 related records exist:
SELECT
    sj.job_id,
    sj.status,
    sj.odometer_in,
    sj.odometer_out,
    js.service_price,
    pu.unit_price_charged AS part_cost
FROM service_jobs sj
JOIN job_services js ON sj.job_id = js.job_id
JOIN part_usage pu   ON sj.job_id = pu.job_id
WHERE sj.job_id = @demo_job_id;


-- ─────────────────────────────────────────────────────────────
-- DEMONSTRATION 2: Transaction Rollback on Error
-- Scenario:
--   Attempt to allocate a part for a non-existent job.
--   When foreign key constraint or logic fails, ROLLBACK
--   guarantees no orphaned records or partial inventory deductions.
-- ─────────────────────────────────────────────────────────────
SELECT '=== DEMO 2: Transaction Rollback Protection ===' AS demonstration;

-- Note initial stock of Part 3 (Front Brake Pad Set)
SELECT part_id, part_name, qty_in_stock
FROM spare_parts WHERE part_id = 3;

START TRANSACTION;

    -- Step A: Valid inventory deduction
    UPDATE spare_parts
    SET qty_in_stock = qty_in_stock - 5
    WHERE part_id = 3;

    -- Step B: Simulate business rule violation / error condition
    -- (e.g. attempting to charge an invalid, non-existent customer)
    -- Instead of committing half-done state, we trigger a ROLLBACK:
    ROLLBACK;

-- Verify stock was preserved:
SELECT
    part_id,
    part_name,
    qty_in_stock,
    'Stock unchanged due to atomic rollback' AS rollback_verification
FROM spare_parts WHERE part_id = 3;


-- ─────────────────────────────────────────────────────────────
-- DEMONSTRATION 3: Transaction Savepoints (Partial Rollback)
-- Scenario:
--   Commit customer loyalty award, but roll back an erroneous bonus.
-- ─────────────────────────────────────────────────────────────
SELECT '=== DEMO 3: Savepoint Granular Rollback ===' AS demonstration;

START TRANSACTION;

    -- Step 1: Award 50 loyalty points
    UPDATE customers
    SET loyalty_points = loyalty_points + 50
    WHERE customer_id = 1;

    SAVEPOINT sp_loyalty_updated;

    -- Step 2: Unintentional extra bonus of 500 points
    UPDATE customers
    SET loyalty_points = loyalty_points + 500
    WHERE customer_id = 1;

    -- Step 3: Undo only step 2 using the savepoint
    ROLLBACK TO SAVEPOINT sp_loyalty_updated;

COMMIT;

-- Verify customer only received the first +50 points:
SELECT customer_id, full_name, loyalty_points
FROM customers WHERE customer_id = 1;
