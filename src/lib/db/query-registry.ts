export interface QueryParameter {
  name: string;
  label: string;
  type: 'string' | 'number' | 'date';
  defaultValue: any;
  description: string;
}

export interface SqlQueryDefinition {
  id: string;
  title: string;
  description: string;
  category: 'Joins & Basic' | 'Aggregates & Grouping' | 'Subqueries & CTEs' | 'Window Functions' | 'Views & Procedures' | 'Business Intelligence';
  concepts: string[];
  parameters?: QueryParameter[];
  sql: string;
  buildQuery: (params: Record<string, any>) => { sql: string; values: any[] };
}

export const SQL_QUERY_REGISTRY: Record<string, SqlQueryDefinition> = {
  q01_appointments_detailed_join: {
    id: 'q01_appointments_detailed_join',
    title: '1. Multi-Table Appointment Directory (5-Table INNER JOIN)',
    description: 'Retrieves active and scheduled appointments by joining customer, vehicle, catalogue, user (advisor), and service type tables.',
    category: 'Joins & Basic',
    concepts: ['INNER JOIN', 'CONCAT()', 'ORDER BY', 'Aliases'],
    sql: `SELECT
    a.appointment_id,
    c.full_name AS customer_name,
    c.phone AS customer_phone,
    cv.license_plate,
    CONCAT(vc.manufacturer, ' ', vc.model, ' (', vc.model_year, ')') AS vehicle_spec,
    u.full_name AS service_advisor,
    st.service_name,
    st.base_price,
    a.scheduled_at,
    a.status
FROM appointments a
JOIN customers c          ON a.customer_id = c.customer_id
JOIN customer_vehicles cv ON a.vehicle_id = cv.vehicle_id
JOIN vehicle_catalogue vc ON cv.catalogue_id = vc.catalogue_id
JOIN users u              ON a.advisor_id = u.user_id
JOIN service_types st     ON a.service_type_id = st.service_type_id
ORDER BY a.scheduled_at DESC
LIMIT 20;`,
    buildQuery: () => ({
      sql: `SELECT
    a.appointment_id,
    c.full_name AS customer_name,
    c.phone AS customer_phone,
    cv.license_plate,
    CONCAT(vc.manufacturer, ' ', vc.model, ' (', vc.model_year, ')') AS vehicle_spec,
    u.full_name AS service_advisor,
    st.service_name,
    st.base_price,
    a.scheduled_at,
    a.status
FROM appointments a
JOIN customers c          ON a.customer_id = c.customer_id
JOIN customer_vehicles cv ON a.vehicle_id = cv.vehicle_id
JOIN vehicle_catalogue vc ON cv.catalogue_id = vc.catalogue_id
JOIN users u              ON a.advisor_id = u.user_id
JOIN service_types st     ON a.service_type_id = st.service_type_id
ORDER BY a.scheduled_at DESC
LIMIT 20;`,
      values: []
    })
  },

  q02_revenue_by_month_aggregates: {
    id: 'q02_revenue_by_month_aggregates',
    title: '2. Monthly Revenue & Settlement Performance (SUM, AVG, CASE)',
    description: 'Calculates gross invoice volume, collected payments, and average invoice ticket size grouped by month.',
    category: 'Aggregates & Grouping',
    concepts: ['SUM()', 'AVG()', 'COUNT()', 'DATE_FORMAT()', 'Conditional CASE'],
    sql: `SELECT
    DATE_FORMAT(inv.issued_at, '%Y-%m') AS billing_month,
    COUNT(inv.invoice_id)               AS total_invoices,
    SUM(inv.total_amount)               AS gross_billed_revenue,
    SUM(CASE WHEN inv.status = 'paid' THEN inv.total_amount ELSE 0 END) AS settled_revenue,
    ROUND(AVG(inv.total_amount), 2)     AS average_invoice_value
FROM invoices inv
WHERE inv.status != 'cancelled'
GROUP BY DATE_FORMAT(inv.issued_at, '%Y-%m')
ORDER BY billing_month DESC;`,
    buildQuery: () => ({
      sql: `SELECT
    DATE_FORMAT(inv.issued_at, '%Y-%m') AS billing_month,
    COUNT(inv.invoice_id)               AS total_invoices,
    SUM(inv.total_amount)               AS gross_billed_revenue,
    SUM(CASE WHEN inv.status = 'paid' THEN inv.total_amount ELSE 0 END) AS settled_revenue,
    ROUND(AVG(inv.total_amount), 2)     AS average_invoice_value
FROM invoices inv
WHERE inv.status != 'cancelled'
GROUP BY DATE_FORMAT(inv.issued_at, '%Y-%m')
ORDER BY billing_month DESC;`,
      values: []
    })
  },

  q03_mechanic_workload_having: {
    id: 'q03_mechanic_workload_having',
    title: '3. Technician Productivity & Turnaround Time (GROUP BY + HAVING)',
    description: 'Aggregates completed service jobs per mechanic, filtering technicians who completed at least a threshold number of jobs.',
    category: 'Aggregates & Grouping',
    concepts: ['GROUP BY', 'HAVING', 'TIMESTAMPDIFF()', 'AVG()'],
    parameters: [
      {
        name: 'min_jobs',
        label: 'Minimum Jobs Completed',
        type: 'number',
        defaultValue: 1,
        description: 'Filter mechanics with at least this many completed jobs'
      }
    ],
    sql: `SELECT
    u.user_id                                                   AS mechanic_id,
    u.full_name                                                 AS mechanic_name,
    COUNT(sj.job_id)                                            AS jobs_completed,
    ROUND(AVG(TIMESTAMPDIFF(MINUTE, sj.started_at, sj.completed_at)), 1) AS avg_turnaround_mins
FROM service_jobs sj
JOIN users u ON sj.mechanic_id = u.user_id
WHERE sj.status = 'completed'
GROUP BY u.user_id, u.full_name
HAVING jobs_completed >= ?
ORDER BY jobs_completed DESC;`,
    buildQuery: (params) => ({
      sql: `SELECT
    u.user_id                                                   AS mechanic_id,
    u.full_name                                                 AS mechanic_name,
    COUNT(sj.job_id)                                            AS jobs_completed,
    ROUND(AVG(TIMESTAMPDIFF(MINUTE, sj.started_at, sj.completed_at)), 1) AS avg_turnaround_mins
FROM service_jobs sj
JOIN users u ON sj.mechanic_id = u.user_id
WHERE sj.status = 'completed'
GROUP BY u.user_id, u.full_name
HAVING jobs_completed >= ?
ORDER BY jobs_completed DESC;`,
      values: [Number(params.min_jobs) || 1]
    })
  },

  q04_high_value_customers_subquery: {
    id: 'q04_high_value_customers_subquery',
    title: '4. High-Value Customers Exceeding Fleet Average (Subquery)',
    description: 'Finds customers whose total invoice spend exceeds the overall fleet average invoice amount.',
    category: 'Subqueries & CTEs',
    concepts: ['Scalar Subquery', 'GROUP BY', 'HAVING', 'SUM()'],
    sql: `SELECT
    c.customer_id,
    c.full_name               AS customer_name,
    c.phone,
    SUM(inv.total_amount)     AS total_spent,
    COUNT(inv.invoice_id)     AS total_invoices
FROM invoices inv
JOIN customers c ON inv.customer_id = c.customer_id
WHERE inv.status != 'cancelled'
GROUP BY c.customer_id, c.full_name, c.phone
HAVING total_spent > (
    SELECT AVG(total_amount)
    FROM invoices
    WHERE status != 'cancelled'
)
ORDER BY total_spent DESC;`,
    buildQuery: () => ({
      sql: `SELECT
    c.customer_id,
    c.full_name               AS customer_name,
    c.phone,
    SUM(inv.total_amount)     AS total_spent,
    COUNT(inv.invoice_id)     AS total_invoices
FROM invoices inv
JOIN customers c ON inv.customer_id = c.customer_id
WHERE inv.status != 'cancelled'
GROUP BY c.customer_id, c.full_name, c.phone
HAVING total_spent > (
    SELECT AVG(total_amount)
    FROM invoices
    WHERE status != 'cancelled'
)
ORDER BY total_spent DESC;`,
      values: []
    })
  },

  q05_correlated_subquery_recent_job: {
    id: 'q05_correlated_subquery_recent_job',
    title: '5. Latest Completed Job Cost per Vehicle (Correlated Subquery)',
    description: 'Retrieves each vehicle and executes a correlated subquery to isolate the exact billed cost of its most recent completed workshop service.',
    category: 'Subqueries & CTEs',
    concepts: ['Correlated Subquery', 'LEFT JOIN', 'LIMIT 1 Subquery'],
    sql: `SELECT
    cv.vehicle_id,
    cv.license_plate,
    c.full_name                          AS owner_name,
    CONCAT(vc.manufacturer, ' ', vc.model) AS vehicle_model,
    (
        SELECT inv.total_amount
        FROM service_jobs sj2
        JOIN invoices inv ON sj2.job_id = inv.job_id
        WHERE sj2.vehicle_id = cv.vehicle_id AND sj2.status = 'completed'
        ORDER BY sj2.completed_at DESC
        LIMIT 1
    )                                    AS last_service_billed_amount
FROM customer_vehicles cv
JOIN customers c          ON cv.customer_id = c.customer_id
LEFT JOIN vehicle_catalogue vc ON cv.catalogue_id = vc.catalogue_id
WHERE cv.is_active = 1
ORDER BY cv.vehicle_id;`,
    buildQuery: () => ({
      sql: `SELECT
    cv.vehicle_id,
    cv.license_plate,
    c.full_name                          AS owner_name,
    CONCAT(vc.manufacturer, ' ', vc.model) AS vehicle_model,
    (
        SELECT inv.total_amount
        FROM service_jobs sj2
        JOIN invoices inv ON sj2.job_id = inv.job_id
        WHERE sj2.vehicle_id = cv.vehicle_id AND sj2.status = 'completed'
        ORDER BY sj2.completed_at DESC
        LIMIT 1
    )                                    AS last_service_billed_amount
FROM customer_vehicles cv
JOIN customers c          ON cv.customer_id = c.customer_id
LEFT JOIN vehicle_catalogue vc ON cv.catalogue_id = vc.catalogue_id
WHERE cv.is_active = 1
ORDER BY cv.vehicle_id;`,
      values: []
    })
  },

  q06_top_consumed_spare_parts: {
    id: 'q06_top_consumed_spare_parts',
    title: '6. Top Consumed Spare Parts & Revenue Impact (Multi-Table Aggregation)',
    description: 'Calculates the top 5 most frequently replaced spare parts across all service jobs and their total revenue generated.',
    category: 'Aggregates & Grouping',
    concepts: ['JOIN', 'SUM()', 'Derived Multiplication', 'ORDER BY DESC', 'LIMIT'],
    sql: `SELECT
    sp.part_id,
    sp.part_number,
    sp.part_name,
    sp.category,
    sp.qty_in_stock,
    SUM(pu.qty_used)                               AS total_units_consumed,
    SUM(pu.qty_used * pu.unit_price_charged)       AS gross_part_revenue
FROM part_usage pu
JOIN spare_parts sp ON pu.part_id = sp.part_id
GROUP BY sp.part_id, sp.part_number, sp.part_name, sp.category, sp.qty_in_stock
ORDER BY total_units_consumed DESC
LIMIT 5;`,
    buildQuery: () => ({
      sql: `SELECT
    sp.part_id,
    sp.part_number,
    sp.part_name,
    sp.category,
    sp.qty_in_stock,
    SUM(pu.qty_used)                               AS total_units_consumed,
    SUM(pu.qty_used * pu.unit_price_charged)       AS gross_part_revenue
FROM part_usage pu
JOIN spare_parts sp ON pu.part_id = sp.part_id
GROUP BY sp.part_id, sp.part_number, sp.part_name, sp.category, sp.qty_in_stock
ORDER BY total_units_consumed DESC
LIMIT 5;`,
      values: []
    })
  },

  q07_cte_vehicle_service_frequency: {
    id: 'q07_cte_vehicle_service_frequency',
    title: '7. Vehicle Service Tier Classification (Common Table Expression - CTE)',
    description: 'Uses a WITH clause to calculate service counts per vehicle, then assigns an engagement tier (High, Moderate, Low Frequency).',
    category: 'Subqueries & CTEs',
    concepts: ['Common Table Expression (WITH)', 'CASE Expression', 'LEFT JOIN'],
    sql: `WITH VehicleServiceCounts AS (
    SELECT
        cv.vehicle_id,
        cv.license_plate,
        c.full_name AS owner_name,
        COUNT(sj.job_id) AS service_count,
        MAX(sj.completed_at) AS last_service_date
    FROM customer_vehicles cv
    JOIN customers c ON cv.customer_id = c.customer_id
    LEFT JOIN service_jobs sj ON cv.vehicle_id = sj.vehicle_id AND sj.status = 'completed'
    GROUP BY cv.vehicle_id, cv.license_plate, c.full_name
)
SELECT
    vehicle_id,
    license_plate,
    owner_name,
    service_count,
    last_service_date,
    CASE
        WHEN service_count >= 3 THEN 'Frequent Servicing (Loyal)'
        WHEN service_count BETWEEN 1 AND 2 THEN 'Standard Maintenance'
        ELSE 'Due for Onboarding'
    END AS service_frequency_tier
FROM VehicleServiceCounts
ORDER BY service_count DESC, license_plate ASC;`,
    buildQuery: () => ({
      sql: `WITH VehicleServiceCounts AS (
    SELECT
        cv.vehicle_id,
        cv.license_plate,
        c.full_name AS owner_name,
        COUNT(sj.job_id) AS service_count,
        MAX(sj.completed_at) AS last_service_date
    FROM customer_vehicles cv
    JOIN customers c ON cv.customer_id = c.customer_id
    LEFT JOIN service_jobs sj ON cv.vehicle_id = sj.vehicle_id AND sj.status = 'completed'
    GROUP BY cv.vehicle_id, cv.license_plate, c.full_name
)
SELECT
    vehicle_id,
    license_plate,
    owner_name,
    service_count,
    last_service_date,
    CASE
        WHEN service_count >= 3 THEN 'Frequent Servicing (Loyal)'
        WHEN service_count BETWEEN 1 AND 2 THEN 'Standard Maintenance'
        ELSE 'Due for Onboarding'
    END AS service_frequency_tier
FROM VehicleServiceCounts
ORDER BY service_count DESC, license_plate ASC;`,
      values: []
    })
  },

  q08_window_function_rank_jobs: {
    id: 'q08_window_function_rank_jobs',
    title: '8. Job Labor & Billing Ranking (Window Function: RANK() & ROW_NUMBER())',
    description: 'Ranks all invoices by total amount and assigns a row number partitioned by status using MySQL 8.0 window functions.',
    category: 'Window Functions',
    concepts: ['RANK() OVER()', 'ROW_NUMBER() OVER()', 'PARTITION BY'],
    sql: `SELECT
    inv.invoice_id,
    inv.customer_id,
    c.full_name AS customer_name,
    inv.total_amount,
    inv.status,
    RANK() OVER (ORDER BY inv.total_amount DESC) AS overall_spend_rank,
    ROW_NUMBER() OVER (PARTITION BY inv.status ORDER BY inv.total_amount DESC) AS rank_within_status
FROM invoices inv
JOIN customers c ON inv.customer_id = c.customer_id
ORDER BY inv.total_amount DESC;`,
    buildQuery: () => ({
      sql: `SELECT
    inv.invoice_id,
    inv.customer_id,
    c.full_name AS customer_name,
    inv.total_amount,
    inv.status,
    RANK() OVER (ORDER BY inv.total_amount DESC) AS overall_spend_rank,
    ROW_NUMBER() OVER (PARTITION BY inv.status ORDER BY inv.total_amount DESC) AS rank_within_status
FROM invoices inv
JOIN customers c ON inv.customer_id = c.customer_id
ORDER BY inv.total_amount DESC;`,
      values: []
    })
  },

  q09_window_function_running_total: {
    id: 'q09_window_function_running_total',
    title: '9. Cumulative Running Revenue by Date (Window Function: SUM() OVER())',
    description: 'Computes a continuous running revenue accumulation curve across issued invoices over chronological time.',
    category: 'Window Functions',
    concepts: ['SUM() OVER(ORDER BY ...)', 'Running Total', 'Window Frame'],
    sql: `SELECT
    inv.invoice_id,
    inv.issued_at,
    c.full_name AS customer_name,
    inv.total_amount,
    SUM(inv.total_amount) OVER (
        ORDER BY inv.issued_at ASC
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS running_cumulative_revenue
FROM invoices inv
JOIN customers c ON inv.customer_id = c.customer_id
WHERE inv.status != 'cancelled'
ORDER BY inv.issued_at ASC;`,
    buildQuery: () => ({
      sql: `SELECT
    inv.invoice_id,
    inv.issued_at,
    c.full_name AS customer_name,
    inv.total_amount,
    SUM(inv.total_amount) OVER (
        ORDER BY inv.issued_at ASC
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS running_cumulative_revenue
FROM invoices inv
JOIN customers c ON inv.customer_id = c.customer_id
WHERE inv.status != 'cancelled'
ORDER BY inv.issued_at ASC;`,
      values: []
    })
  },

  q10_low_stock_inventory_alert: {
    id: 'q10_low_stock_inventory_alert',
    title: '10. Low-Stock Safety Threshold Evaluation (Stock <= Reorder)',
    description: 'Identifies inventory parts that have fallen at or below safety reorder levels to prevent workshop bay downtime.',
    category: 'Business Intelligence',
    concepts: ['Arithmetic Comparison', 'Inventory Reorder', 'Ordering'],
    sql: `SELECT
    part_id,
    part_number,
    part_name,
    category,
    location_code,
    qty_in_stock,
    reorder_level,
    (reorder_level - qty_in_stock) AS units_deficit,
    selling_price
FROM spare_parts
WHERE qty_in_stock <= reorder_level AND is_active = 1
ORDER BY units_deficit DESC;`,
    buildQuery: () => ({
      sql: `SELECT
    part_id,
    part_number,
    part_name,
    category,
    location_code,
    qty_in_stock,
    reorder_level,
    (reorder_level - qty_in_stock) AS units_deficit,
    selling_price
FROM spare_parts
WHERE qty_in_stock <= reorder_level AND is_active = 1
ORDER BY units_deficit DESC;`,
      values: []
    })
  },

  q11_overdue_invoice_aging: {
    id: 'q11_overdue_invoice_aging',
    title: '11. Overdue Invoice Aging & Outstanding Receivables (DATEDIFF)',
    description: 'Tracks unpaid accounts receivable, calculating exact days overdue past invoice due dates.',
    category: 'Business Intelligence',
    concepts: ['DATEDIFF()', 'CURDATE()', 'Aging Buckets', 'INNER JOIN'],
    sql: `SELECT
    inv.invoice_id,
    c.full_name                               AS customer_name,
    c.phone                                   AS customer_phone,
    inv.total_amount,
    inv.issued_at,
    inv.due_date,
    DATEDIFF(CURDATE(), inv.due_date)         AS days_overdue,
    CASE
        WHEN DATEDIFF(CURDATE(), inv.due_date) > 30 THEN '30+ Days Critical'
        WHEN DATEDIFF(CURDATE(), inv.due_date) > 14 THEN '15-30 Days Notice'
        WHEN DATEDIFF(CURDATE(), inv.due_date) > 0  THEN '1-14 Days Grace'
        ELSE 'Current (Not Overdue)'
    END                                       AS aging_category
FROM invoices inv
JOIN customers c ON inv.customer_id = c.customer_id
WHERE inv.status = 'issued'
ORDER BY days_overdue DESC;`,
    buildQuery: () => ({
      sql: `SELECT
    inv.invoice_id,
    c.full_name                               AS customer_name,
    c.phone                                   AS customer_phone,
    inv.total_amount,
    inv.issued_at,
    inv.due_date,
    DATEDIFF(CURDATE(), inv.due_date)         AS days_overdue,
    CASE
        WHEN DATEDIFF(CURDATE(), inv.due_date) > 30 THEN '30+ Days Critical'
        WHEN DATEDIFF(CURDATE(), inv.due_date) > 14 THEN '15-30 Days Notice'
        WHEN DATEDIFF(CURDATE(), inv.due_date) > 0  THEN '1-14 Days Grace'
        ELSE 'Current (Not Overdue)'
    END                                       AS aging_category
FROM invoices inv
JOIN customers c ON inv.customer_id = c.customer_id
WHERE inv.status = 'issued'
ORDER BY days_overdue DESC;`,
      values: []
    })
  },

  q12_view_service_summary: {
    id: 'q12_view_service_summary',
    title: '12. View Query: Completed Service Orders (vw_service_summary)',
    description: 'Executes a query against the production MySQL view vw_service_summary to inspect completed jobs and invoice linkages.',
    category: 'Views & Procedures',
    concepts: ['View Query', 'Relational Encapsulation'],
    sql: `SELECT *
FROM vw_service_summary
WHERE job_status = 'completed'
ORDER BY job_id DESC
LIMIT 15;`,
    buildQuery: () => ({
      sql: `SELECT *
FROM vw_service_summary
WHERE job_status = 'completed'
ORDER BY job_id DESC
LIMIT 15;`,
      values: []
    })
  },

  q13_stored_function_total_paid: {
    id: 'q13_stored_function_total_paid',
    title: '13. Stored Function: Cumulative Settlement Calculation (fn_invoice_total_paid)',
    description: 'Demonstrates invoking user-defined function fn_invoice_total_paid(invoice_id) to calculate net settlement and balance due.',
    category: 'Views & Procedures',
    concepts: ['User Defined Function (UDF)', 'fn_invoice_total_paid'],
    sql: `SELECT
    inv.invoice_id,
    c.full_name                                                AS customer_name,
    inv.total_amount,
    fn_invoice_total_paid(inv.invoice_id)                      AS paid_so_far,
    (inv.total_amount - fn_invoice_total_paid(inv.invoice_id)) AS remaining_balance,
    inv.status
FROM invoices inv
JOIN customers c ON inv.customer_id = c.customer_id
ORDER BY inv.invoice_id ASC;`,
    buildQuery: () => ({
      sql: `SELECT
    inv.invoice_id,
    c.full_name                                                AS customer_name,
    inv.total_amount,
    fn_invoice_total_paid(inv.invoice_id)                      AS paid_so_far,
    (inv.total_amount - fn_invoice_total_paid(inv.invoice_id)) AS remaining_balance,
    inv.status
FROM invoices inv
JOIN customers c ON inv.customer_id = c.customer_id
ORDER BY inv.invoice_id ASC;`,
      values: []
    })
  },

  q14_stored_function_days_since_service: {
    id: 'q14_stored_function_days_since_service',
    title: '14. Stored Function: Days Elapsed Since Service (fn_days_since_last_service)',
    description: 'Executes stored function fn_days_since_last_service(vehicle_id) to identify vehicles overdue for maintenance inspection.',
    category: 'Views & Procedures',
    concepts: ['User Defined Function', 'fn_days_since_last_service'],
    sql: `SELECT
    cv.vehicle_id,
    cv.license_plate,
    c.full_name AS owner_name,
    CONCAT(vc.manufacturer, ' ', vc.model) AS vehicle_model,
    fn_days_since_last_service(cv.vehicle_id) AS days_elapsed_since_service
FROM customer_vehicles cv
JOIN customers c ON cv.customer_id = c.customer_id
LEFT JOIN vehicle_catalogue vc ON cv.catalogue_id = vc.catalogue_id
WHERE cv.is_active = 1
ORDER BY days_elapsed_since_service DESC;`,
    buildQuery: () => ({
      sql: `SELECT
    cv.vehicle_id,
    cv.license_plate,
    c.full_name AS owner_name,
    CONCAT(vc.manufacturer, ' ', vc.model) AS vehicle_model,
    fn_days_since_last_service(cv.vehicle_id) AS days_elapsed_since_service
FROM customer_vehicles cv
JOIN customers c ON cv.customer_id = c.customer_id
LEFT JOIN vehicle_catalogue vc ON cv.catalogue_id = vc.catalogue_id
WHERE cv.is_active = 1
ORDER BY days_elapsed_since_service DESC;`,
      values: []
    })
  },

  q15_fulltext_catalogue_search: {
    id: 'q15_fulltext_catalogue_search',
    title: '15. Full-Text Search on Vehicle Catalogue (MATCH ... AGAINST)',
    description: 'Uses the MySQL FULLTEXT index on vehicle_catalogue (manufacturer, model, category, fuel) for natural-language search.',
    category: 'Business Intelligence',
    concepts: ['FULLTEXT Index', 'MATCH() ... AGAINST()', 'Natural Language Mode'],
    parameters: [
      {
        name: 'keyword',
        label: 'Search Terms',
        type: 'string',
        defaultValue: 'Tesla Electric',
        description: 'Keywords to search across manufacturer, model, class, and fuel'
      }
    ],
    sql: `SELECT
    catalogue_id,
    manufacturer,
    model,
    model_year,
    category,
    fuel,
    electric_range,
    alt_economy_combined
FROM vehicle_catalogue
WHERE MATCH(manufacturer, model, category, fuel)
      AGAINST (? IN NATURAL LANGUAGE MODE)
LIMIT 15;`,
    buildQuery: (params) => ({
      sql: `SELECT
    catalogue_id,
    manufacturer,
    model,
    model_year,
    category,
    fuel,
    electric_range,
    alt_economy_combined
FROM vehicle_catalogue
WHERE MATCH(manufacturer, model, category, fuel)
      AGAINST (? IN NATURAL LANGUAGE MODE)
LIMIT 15;`,
      values: [String(params.keyword || 'Tesla Electric')]
    })
  },

  q16_pending_maintenance_reminders: {
    id: 'q16_pending_maintenance_reminders',
    title: '16. Pending Maintenance Reminders View (vw_pending_maintenance)',
    description: 'Queries the vw_pending_maintenance view, which tracks automatic reminders generated by MySQL triggers for vehicles nearing service intervals.',
    category: 'Views & Procedures',
    concepts: ['Trigger-Generated Alerts', 'View Query'],
    sql: `SELECT *
FROM vw_pending_maintenance
ORDER BY next_service_date ASC;`,
    buildQuery: () => ({
      sql: `SELECT *
FROM vw_pending_maintenance
ORDER BY next_service_date ASC;`,
      values: []
    })
  },

  q17_part_usage_margin_analysis: {
    id: 'q17_part_usage_margin_analysis',
    title: '17. Spare Part Profit Margin & Markup Breakdown',
    description: 'Analyzes profitability margins on allocated spare parts, comparing unit cost against customer selling price.',
    category: 'Business Intelligence',
    concepts: ['Profit Margin Formula', 'Arithmetic Projections', 'ORDER BY'],
    sql: `SELECT
    part_id,
    part_number,
    part_name,
    category,
    unit_cost,
    selling_price,
    ROUND(selling_price - unit_cost, 2) AS gross_profit_per_unit,
    ROUND(((selling_price - unit_cost) / unit_cost) * 100, 1) AS markup_percentage
FROM spare_parts
WHERE is_active = 1
ORDER BY markup_percentage DESC;`,
    buildQuery: () => ({
      sql: `SELECT
    part_id,
    part_number,
    part_name,
    category,
    unit_cost,
    selling_price,
    ROUND(selling_price - unit_cost, 2) AS gross_profit_per_unit,
    ROUND(((selling_price - unit_cost) / unit_cost) * 100, 1) AS markup_percentage
FROM spare_parts
WHERE is_active = 1
ORDER BY markup_percentage DESC;`,
      values: []
    })
  },

  q18_customer_loyalty_ranking: {
    id: 'q18_customer_loyalty_ranking',
    title: '18. Customer Engagement & Loyalty Points Ranking',
    description: 'Ranks all customers by loyalty points and active vehicles to support targeted retention campaigns.',
    category: 'Business Intelligence',
    concepts: ['COUNT()', 'GROUP BY', 'ORDER BY DESC'],
    sql: `SELECT
    c.customer_id,
    c.full_name,
    c.phone,
    c.city,
    c.loyalty_points,
    COUNT(cv.vehicle_id) AS registered_vehicles
FROM customers c
LEFT JOIN customer_vehicles cv ON c.customer_id = cv.customer_id AND cv.is_active = 1
GROUP BY c.customer_id, c.full_name, c.phone, c.city, c.loyalty_points
ORDER BY c.loyalty_points DESC, registered_vehicles DESC;`,
    buildQuery: () => ({
      sql: `SELECT
    c.customer_id,
    c.full_name,
    c.phone,
    c.city,
    c.loyalty_points,
    COUNT(cv.vehicle_id) AS registered_vehicles
FROM customers c
LEFT JOIN customer_vehicles cv ON c.customer_id = cv.customer_id AND cv.is_active = 1
GROUP BY c.customer_id, c.full_name, c.phone, c.city, c.loyalty_points
ORDER BY c.loyalty_points DESC, registered_vehicles DESC;`,
      values: []
    })
  },

  q19_technician_performance_view: {
    id: 'q19_technician_performance_view',
    title: '19. Advanced View: Technician Productivity (vw_technician_performance)',
    description: 'Queries the newly deployed vw_technician_performance view to analyze jobs completed and parts consumed per mechanic.',
    category: 'Views & Procedures',
    concepts: ['View Query', 'Composite Technician Performance'],
    sql: `SELECT *
FROM vw_technician_performance
ORDER BY jobs_completed DESC;`,
    buildQuery: () => ({
      sql: `SELECT *
FROM vw_technician_performance
ORDER BY jobs_completed DESC;`,
      values: []
    })
  },

  q20_invoice_settlement_audit_view: {
    id: 'q20_invoice_settlement_audit_view',
    title: '20. Advanced View: Invoice Settlement Audit (vw_invoice_settlement_audit)',
    description: 'Queries the audit view to review billed totals, payments received, remaining balances, and calculated settlement flags.',
    category: 'Views & Procedures',
    concepts: ['Audit View', 'Financial Settlement Status'],
    sql: `SELECT *
FROM vw_invoice_settlement_audit
ORDER BY invoice_id DESC
LIMIT 15;`,
    buildQuery: () => ({
      sql: `SELECT *
FROM vw_invoice_settlement_audit
ORDER BY invoice_id DESC
LIMIT 15;`,
      values: []
    })
  }
};
