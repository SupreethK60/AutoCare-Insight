-- ============================================================
-- AutoCare Insight — Vehicle Service Management System
-- Script 08: DDL Demonstration — ALTER and DROP Statements
-- Demonstrates schema evolution, constraint addition, and drop operations
-- Required by DBMS Level 3 Rubric (Requirement 5: CREATE, ALTER, DROP)
-- ============================================================

USE autocare_insight;

-- ─────────────────────────────────────────────────────────────
-- SECTION 1: ALTER TABLE — Adding New Columns
-- ─────────────────────────────────────────────────────────────

-- 1.1 Add loyalty points tracking to customers table
ALTER TABLE customers
    ADD COLUMN loyalty_points INT UNSIGNED NOT NULL DEFAULT 0
    AFTER zip_code;

-- 1.2 Add warranty coverage duration (months) to service_jobs
ALTER TABLE service_jobs
    ADD COLUMN warranty_months TINYINT UNSIGNED NOT NULL DEFAULT 3
    AFTER internal_notes;

-- 1.3 Add preferred notification channel for maintenance reminders
ALTER TABLE maintenance_reminders
    ADD COLUMN notification_channel ENUM('sms', 'email', 'whatsapp') NOT NULL DEFAULT 'sms'
    AFTER is_sent;


-- ─────────────────────────────────────────────────────────────
-- SECTION 2: ALTER TABLE — Modifying Column Definitions
-- ─────────────────────────────────────────────────────────────

-- 2.1 Increase phone column length to accommodate international dialing formats
ALTER TABLE customers
    MODIFY COLUMN phone VARCHAR(25) NOT NULL;

-- 2.2 Add comment to vehicle catalogue fuel column
ALTER TABLE vehicle_catalogue
    MODIFY COLUMN fuel VARCHAR(100) COMMENT 'Primary fuel or powertrain classification';


-- ─────────────────────────────────────────────────────────────
-- SECTION 3: ALTER TABLE — Adding Constraints & Indexes
-- ─────────────────────────────────────────────────────────────

-- 3.1 Add CHECK constraint ensuring selling price is at least unit cost
ALTER TABLE spare_parts
    ADD CONSTRAINT chk_part_selling_cost_margin
    CHECK (selling_price >= unit_cost);

-- 3.2 Add index for faster customer vehicle plate search
ALTER TABLE customer_vehicles
    ADD INDEX idx_cv_license_upper ((UPPER(license_plate)));


-- ─────────────────────────────────────────────────────────────
-- SECTION 4: ALTER TABLE — Dropping Columns and Constraints
-- ─────────────────────────────────────────────────────────────

-- 4.1 Create temporary demo table for non-destructive ALTER/DROP showcase
DROP TABLE IF EXISTS audit_log_demo;

CREATE TABLE audit_log_demo (
    audit_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    action_name VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    temp_flag VARCHAR(50),
    logged_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='Staging table to demonstrate column and constraint DROP';

-- 4.2 Alter table to drop the unused temporary flag column
ALTER TABLE audit_log_demo
    DROP COLUMN temp_flag;

-- 4.3 Add a temporary index then drop it via ALTER TABLE
ALTER TABLE audit_log_demo
    ADD INDEX idx_temp_action (action_name);

ALTER TABLE audit_log_demo
    DROP INDEX idx_temp_action;


-- ─────────────────────────────────────────────────────────────
-- SECTION 5: DROP TABLE / VIEW / PROCEDURE / TRIGGER Demonstrations
-- ─────────────────────────────────────────────────────────────

-- 5.1 Drop demonstration staging table
DROP TABLE IF EXISTS audit_log_demo;

-- 5.2 Conditional drop for views, procs, triggers (safeguard pattern)
DROP VIEW IF EXISTS vw_temp_demo_view;
DROP PROCEDURE IF EXISTS sp_temp_demo_proc;
DROP TRIGGER IF EXISTS trg_temp_demo_trigger;

SELECT 'Script 08: DDL ALTER & DROP statements executed successfully.' AS status;

