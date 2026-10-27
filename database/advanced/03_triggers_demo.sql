-- ============================================================
-- AutoCare Insight — Advanced SQL Demonstration 3: Triggers & Audit
-- Database: autocare_insight
-- Purpose: Demonstrates automated audit logging using AFTER UPDATE
--          triggers to record stock and pricing adjustments.
-- ============================================================

USE autocare_insight;

-- ─────────────────────────────────────────────────────────────
-- STEP 1: Audit Table for Inventory Modifications
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS spare_parts_audit (
    audit_id        INT AUTO_INCREMENT PRIMARY KEY,
    part_id         INT NOT NULL,
    part_number     VARCHAR(50) NOT NULL,
    old_qty         INT NOT NULL,
    new_qty         INT NOT NULL,
    old_price       DECIMAL(10,2) NOT NULL,
    new_price       DECIMAL(10,2) NOT NULL,
    change_type     ENUM('STOCK_ADJUSTMENT', 'PRICE_CHANGE', 'BOTH', 'OTHER') NOT NULL,
    changed_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    changed_by_user VARCHAR(100) DEFAULT 'system_trigger',
    INDEX idx_audit_part (part_id),
    INDEX idx_audit_time (changed_at)
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────
-- STEP 2: Audit Trigger Implementation
-- ─────────────────────────────────────────────────────────────
DELIMITER $$

DROP TRIGGER IF EXISTS trg_audit_spare_part_changes$$

CREATE TRIGGER trg_audit_spare_part_changes
AFTER UPDATE ON spare_parts
FOR EACH ROW
BEGIN
    DECLARE v_change_type VARCHAR(20);

    IF OLD.qty_in_stock != NEW.qty_in_stock AND OLD.selling_price != NEW.selling_price THEN
        SET v_change_type = 'BOTH';
    ELSEIF OLD.qty_in_stock != NEW.qty_in_stock THEN
        SET v_change_type = 'STOCK_ADJUSTMENT';
    ELSEIF OLD.selling_price != NEW.selling_price THEN
        SET v_change_type = 'PRICE_CHANGE';
    ELSE
        SET v_change_type = 'OTHER';
    END IF;

    -- Only record if significant field was modified
    IF v_change_type != 'OTHER' THEN
        INSERT INTO spare_parts_audit (
            part_id,
            part_number,
            old_qty,
            new_qty,
            old_price,
            new_price,
            change_type,
            changed_at
        ) VALUES (
            OLD.part_id,
            OLD.part_number,
            OLD.qty_in_stock,
            NEW.qty_in_stock,
            OLD.selling_price,
            NEW.selling_price,
            v_change_type,
            NOW()
        );
    END IF;
END$$

DELIMITER ;

-- ─────────────────────────────────────────────────────────────
-- STEP 3: Demonstration of Trigger Execution
-- ─────────────────────────────────────────────────────────────
-- Check initial part data (Part 1: Engine Oil Filter)
SELECT part_id, part_number, part_name, qty_in_stock, selling_price
FROM spare_parts WHERE part_id = 1;

-- Trigger update (modify price & stock)
UPDATE spare_parts
SET qty_in_stock = qty_in_stock + 10,
    selling_price = selling_price + 50.00
WHERE part_id = 1;

-- Verify Audit Table has recorded the trigger event
SELECT '--- TRIGGER VERIFICATION: spare_parts_audit table ---' AS test_status;
SELECT
    audit_id,
    part_id,
    part_number,
    old_qty,
    new_qty,
    old_price,
    new_price,
    change_type,
    changed_at
FROM spare_parts_audit
ORDER BY audit_id DESC
LIMIT 5;

-- Revert part back to original for data integrity
UPDATE spare_parts
SET qty_in_stock = qty_in_stock - 10,
    selling_price = selling_price - 50.00
WHERE part_id = 1;

