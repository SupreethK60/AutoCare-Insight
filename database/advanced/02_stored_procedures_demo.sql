-- ============================================================
-- AutoCare Insight — Advanced SQL Demonstration 2: Stored Procedures
-- Database: autocare_insight
-- Purpose: Demonstrates parameterized procedures, input validation,
--          out parameters, and automated business workflows.
-- ============================================================

USE autocare_insight;

DELIMITER $$

-- ─────────────────────────────────────────────────────────────
-- PROCEDURE 1: sp_mechanic_workload_summary
-- Analyzes individual mechanic throughput, assigned jobs,
-- parts consumed, and completion rates within a date range.
-- ─────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_mechanic_workload_summary$$

CREATE PROCEDURE sp_mechanic_workload_summary(
    IN p_mechanic_id INT,
    IN p_days_back INT
)
sp_block: BEGIN
    -- Input validation
    IF p_mechanic_id IS NULL OR p_mechanic_id <= 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Error: Valid mechanic_id is required';
    END IF;

    IF p_days_back IS NULL OR p_days_back <= 0 THEN
        SET p_days_back = 30;
    END IF;

    SELECT
        u.user_id                                                   AS mechanic_id,
        u.full_name                                                 AS mechanic_name,
        COUNT(sj.job_id)                                            AS jobs_handled,
        SUM(CASE WHEN sj.status = 'completed' THEN 1 ELSE 0 END)   AS jobs_completed,
        SUM(CASE WHEN sj.status = 'in_progress' THEN 1 ELSE 0 END) AS jobs_in_progress,
        ROUND(AVG(CASE WHEN sj.status = 'completed'
            THEN TIMESTAMPDIFF(MINUTE, sj.started_at, sj.completed_at)
            ELSE NULL END), 1)                                      AS avg_completion_minutes,
        COALESCE(SUM(pu.qty_used * pu.unit_price_charged), 0)       AS total_parts_value_installed
    FROM users u
    LEFT JOIN service_jobs sj
        ON u.user_id = sj.mechanic_id
        AND sj.created_at >= DATE_SUB(NOW(), INTERVAL p_days_back DAY)
    LEFT JOIN part_usage pu
        ON sj.job_id = pu.job_id
    WHERE u.user_id = p_mechanic_id AND u.role = 'mechanic'
    GROUP BY u.user_id, u.full_name;

END sp_block$$

-- ─────────────────────────────────────────────────────────────
-- PROCEDURE 2: sp_replenish_low_stock_parts
-- Automatically increments stock for all spare parts that are
-- at or below their reorder level, simulating an intake shipment.
-- ─────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS sp_replenish_low_stock_parts$$

CREATE PROCEDURE sp_replenish_low_stock_parts(
    IN p_restock_units INT,
    OUT p_parts_updated INT,
    OUT p_total_units_added INT
)
replenish_block: BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_part_id INT;
    DECLARE v_stock INT;
    DECLARE v_reorder INT;

    -- Cursor to iterate over all low stock parts
    DECLARE cur_low_stock CURSOR FOR
        SELECT part_id, qty_in_stock, reorder_level
        FROM spare_parts
        WHERE qty_in_stock <= reorder_level AND is_active = 1;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    IF p_restock_units IS NULL OR p_restock_units <= 0 THEN
        SET p_restock_units = 10;
    END IF;

    SET p_parts_updated = 0;
    SET p_total_units_added = 0;

    OPEN cur_low_stock;

    read_loop: LOOP
        FETCH cur_low_stock INTO v_part_id, v_stock, v_reorder;
        IF done THEN
            LEAVE read_loop;
        END IF;

        UPDATE spare_parts
        SET qty_in_stock = qty_in_stock + p_restock_units,
            updated_at = NOW()
        WHERE part_id = v_part_id;

        SET p_parts_updated = p_parts_updated + 1;
        SET p_total_units_added = p_total_units_added + p_restock_units;
    END LOOP;

    CLOSE cur_low_stock;

END replenish_block$$

DELIMITER ;

-- ─────────────────────────────────────────────────────────────
-- DEMONSTRATION & VERIFICATION CALLS
-- ─────────────────────────────────────────────────────────────
SELECT '--- Procedure 1: sp_mechanic_workload_summary for mechanic ID 4 (Suresh Mehta) ---' AS check_title;
CALL sp_mechanic_workload_summary(4, 90);

SELECT '--- Procedure 2: sp_replenish_low_stock_parts demonstration ---' AS check_title;
CALL sp_replenish_low_stock_parts(5, @updated_count, @units_added);
SELECT @updated_count AS low_stock_parts_restocked, @units_added AS total_units_replenished;

