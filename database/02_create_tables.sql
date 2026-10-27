-- ============================================================
-- AutoCare Insight — Vehicle Service Management System
-- Script 02: Create All Tables
-- Run after 01_create_database.sql
-- ============================================================

USE autocare_insight;

-- ─────────────────────────────────────────────────────────────
-- TABLE 1: users
-- Stores system users: admin, service_advisor, mechanic
-- ─────────────────────────────────────────────────────────────
CREATE TABLE users (
    user_id      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    full_name    VARCHAR(100)  NOT NULL,
    email        VARCHAR(150)  NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role         ENUM('admin','service_advisor','mechanic') NOT NULL DEFAULT 'mechanic',
    phone        VARCHAR(20),
    is_active    TINYINT(1)   NOT NULL DEFAULT 1,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_email (email),
    INDEX idx_users_role  (role)
) ENGINE=InnoDB COMMENT='System users with role-based access control';


-- ─────────────────────────────────────────────────────────────
-- TABLE 2: customers
-- Stores vehicle owners / clients
-- ─────────────────────────────────────────────────────────────
CREATE TABLE customers (
    customer_id  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    full_name    VARCHAR(100) NOT NULL,
    email        VARCHAR(150) UNIQUE,
    phone        VARCHAR(20)  NOT NULL,
    address      TEXT,
    city         VARCHAR(80),
    state        VARCHAR(80),
    zip_code     VARCHAR(20),
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_customers_phone (phone),
    INDEX idx_customers_email (email)
) ENGINE=InnoDB COMMENT='Vehicle owners and shop clients';


-- ─────────────────────────────────────────────────────────────
-- TABLE 3: vehicle_catalogue
-- Master catalogue imported from the 3 CSV datasets.
-- Source column tracks which file each row came from.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE vehicle_catalogue (
    catalogue_id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- Core identity (from all 3 CSVs)
    manufacturer         VARCHAR(100) NOT NULL,
    model                VARCHAR(100) NOT NULL,
    model_year           SMALLINT UNSIGNED NOT NULL,
    category             VARCHAR(100),          -- e.g. Sedan/Wagon, SUV, Transit Bus

    -- Fuel data (from LDV & AFV CSVs)
    fuel                 VARCHAR(100),          -- e.g. Hybrid Electric, Electric, CNG
    fuel_code            VARCHAR(20),           -- e.g. HYBR, ELEC, PHEV, BD, E85_GSLN

    -- Engine data (from LDV & AFV CSVs)
    engine_type          VARCHAR(50),           -- e.g. SI, CI
    engine_size          VARCHAR(20),           -- e.g. 3.5L
    engine_cylinders     TINYINT UNSIGNED,
    engine_description   VARCHAR(100),          -- e.g. "3.5L V6" (LDV only)
    transmission_type    VARCHAR(50),           -- e.g. Auto, Manual, CVT
    drivetrain           VARCHAR(20),           -- e.g. AWD, FWD, RWD, 4WD

    -- Fuel economy (MPGe or MPG)
    alt_economy_city     DECIMAL(6,2),
    alt_economy_hwy      DECIMAL(6,2),
    alt_economy_combined DECIMAL(6,2),
    conv_economy_city    DECIMAL(6,2),
    conv_economy_hwy     DECIMAL(6,2),
    conv_economy_combined DECIMAL(6,2),

    -- EV/PHEV specific
    electric_range       DECIMAL(7,2),          -- miles (All-Electric Range)
    phev_total_range     DECIMAL(7,2),

    -- Heavy Duty specific (from MHD CSV)
    num_passengers       SMALLINT UNSIGNED,
    heavy_duty_power_system VARCHAR(100),

    -- Source tracking
    source_dataset       ENUM('LDV','AFV','MHD') NOT NULL DEFAULT 'LDV',
    source_vehicle_id    INT UNSIGNED,          -- original Vehicle ID from CSV
    notes                TEXT,

    created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Prevent duplicate rows from same source
    UNIQUE KEY uk_catalogue (manufacturer, model, model_year, fuel_code, source_dataset),

    INDEX idx_cat_manufacturer (manufacturer),
    INDEX idx_cat_model        (model),
    INDEX idx_cat_year         (model_year),
    INDEX idx_cat_fuel         (fuel_code),
    INDEX idx_cat_category     (category)
) ENGINE=InnoDB COMMENT='Master vehicle catalogue imported from all 3 CSV datasets';


-- ─────────────────────────────────────────────────────────────
-- TABLE 4: customer_vehicles
-- Specific vehicles owned and registered by customers
-- ─────────────────────────────────────────────────────────────
CREATE TABLE customer_vehicles (
    vehicle_id      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    customer_id     INT UNSIGNED NOT NULL,
    catalogue_id    INT UNSIGNED,              -- NULL if catalogue entry not found
    license_plate   VARCHAR(20)  NOT NULL,
    vin             VARCHAR(17)  UNIQUE,       -- Vehicle Identification Number
    color           VARCHAR(40),
    purchase_year   SMALLINT UNSIGNED,
    current_odometer INT UNSIGNED DEFAULT 0,  -- in km or miles, defined by settings
    fuel_override   VARCHAR(60),              -- if different from catalogue fuel
    notes           TEXT,
    is_active       TINYINT(1) NOT NULL DEFAULT 1,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_cv_customer  FOREIGN KEY (customer_id)  REFERENCES customers(customer_id) ON DELETE RESTRICT,
    CONSTRAINT fk_cv_catalogue FOREIGN KEY (catalogue_id) REFERENCES vehicle_catalogue(catalogue_id) ON DELETE SET NULL,

    INDEX idx_cv_customer     (customer_id),
    INDEX idx_cv_licence_plate (license_plate),
    INDEX idx_cv_vin           (vin)
) ENGINE=InnoDB COMMENT='Customer-owned vehicles linked to the catalogue';


-- ─────────────────────────────────────────────────────────────
-- TABLE 5: service_types
-- Lookup table for types of service offered by the shop
-- ─────────────────────────────────────────────────────────────
CREATE TABLE service_types (
    service_type_id   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    service_name      VARCHAR(100) NOT NULL UNIQUE,
    description       TEXT,
    estimated_duration_mins SMALLINT UNSIGNED DEFAULT 60,
    base_price        DECIMAL(10,2) DEFAULT 0.00,
    is_active         TINYINT(1) NOT NULL DEFAULT 1,
    created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_st_name (service_name)
) ENGINE=InnoDB COMMENT='Catalogue of services the shop offers (oil change, brake job, etc.)';


-- ─────────────────────────────────────────────────────────────
-- TABLE 6: appointments
-- Bookings made by customers for a vehicle service
-- ─────────────────────────────────────────────────────────────
CREATE TABLE appointments (
    appointment_id  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    customer_id     INT UNSIGNED NOT NULL,
    vehicle_id      INT UNSIGNED NOT NULL,
    advisor_id      INT UNSIGNED,              -- REFERENCES users(user_id), role=service_advisor
    scheduled_at    DATETIME NOT NULL,
    status          ENUM('pending','confirmed','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending',
    service_type_id INT UNSIGNED,
    mileage_at_booking INT UNSIGNED,
    customer_notes  TEXT,
    advisor_notes   TEXT,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_appt_customer     FOREIGN KEY (customer_id)     REFERENCES customers(customer_id)     ON DELETE RESTRICT,
    CONSTRAINT fk_appt_vehicle      FOREIGN KEY (vehicle_id)      REFERENCES customer_vehicles(vehicle_id) ON DELETE RESTRICT,
    CONSTRAINT fk_appt_advisor      FOREIGN KEY (advisor_id)      REFERENCES users(user_id)             ON DELETE SET NULL,
    CONSTRAINT fk_appt_service_type FOREIGN KEY (service_type_id) REFERENCES service_types(service_type_id) ON DELETE SET NULL,

    INDEX idx_appt_customer    (customer_id),
    INDEX idx_appt_vehicle     (vehicle_id),
    INDEX idx_appt_scheduled   (scheduled_at),
    INDEX idx_appt_status      (status)
) ENGINE=InnoDB COMMENT='Service appointment bookings';


-- ─────────────────────────────────────────────────────────────
-- TABLE 7: service_jobs
-- An actual workshop job created from a confirmed appointment.
-- mongo_report_id stores the ObjectId of the MongoDB repair report.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE service_jobs (
    job_id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    appointment_id   INT UNSIGNED,             -- NULL if walk-in
    mechanic_id      INT UNSIGNED,
    vehicle_id       INT UNSIGNED NOT NULL,
    status           ENUM('assigned','in_progress','on_hold','completed','cancelled') NOT NULL DEFAULT 'assigned',
    odometer_in      INT UNSIGNED,
    odometer_out     INT UNSIGNED,
    started_at       DATETIME,
    completed_at     DATETIME,
    mongo_report_id  VARCHAR(24),              -- MongoDB ObjectId (24-char hex string)
    internal_notes   TEXT,
    created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_job_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id) ON DELETE SET NULL,
    CONSTRAINT fk_job_mechanic    FOREIGN KEY (mechanic_id)    REFERENCES users(user_id)               ON DELETE SET NULL,
    CONSTRAINT fk_job_vehicle     FOREIGN KEY (vehicle_id)     REFERENCES customer_vehicles(vehicle_id) ON DELETE RESTRICT,

    INDEX idx_job_appointment (appointment_id),
    INDEX idx_job_mechanic    (mechanic_id),
    INDEX idx_job_vehicle     (vehicle_id),
    INDEX idx_job_status      (status)
) ENGINE=InnoDB COMMENT='Workshop jobs (repairs, maintenance, inspections)';


-- ─────────────────────────────────────────────────────────────
-- TABLE 8: job_services
-- Which service_types were actually performed in a job
-- (One job can cover multiple services, e.g. oil change + wheel alignment)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE job_services (
    job_service_id  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    job_id          INT UNSIGNED NOT NULL,
    service_type_id INT UNSIGNED NOT NULL,
    service_price   DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    technician_notes TEXT,

    CONSTRAINT fk_js_job          FOREIGN KEY (job_id)          REFERENCES service_jobs(job_id)       ON DELETE CASCADE,
    CONSTRAINT fk_js_service_type FOREIGN KEY (service_type_id) REFERENCES service_types(service_type_id) ON DELETE RESTRICT,

    UNIQUE KEY uk_job_service (job_id, service_type_id),
    INDEX idx_js_job          (job_id),
    INDEX idx_js_service_type (service_type_id)
) ENGINE=InnoDB COMMENT='Services performed within each job (job-to-service_type bridge)';


-- ─────────────────────────────────────────────────────────────
-- TABLE 9: spare_parts
-- Inventory of spare parts stocked in the workshop
-- ─────────────────────────────────────────────────────────────
CREATE TABLE spare_parts (
    part_id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    part_number    VARCHAR(60)  NOT NULL UNIQUE,
    part_name      VARCHAR(150) NOT NULL,
    description    TEXT,
    category       VARCHAR(80),               -- e.g. Brakes, Engine, Electrical
    brand          VARCHAR(80),
    unit_cost      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    selling_price  DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    qty_in_stock   INT UNSIGNED NOT NULL DEFAULT 0,
    reorder_level  INT UNSIGNED NOT NULL DEFAULT 5,
    location_code  VARCHAR(30),               -- shelf/bin code in the warehouse
    is_active      TINYINT(1) NOT NULL DEFAULT 1,
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_parts_number   (part_number),
    INDEX idx_parts_category (category),
    INDEX idx_parts_stock    (qty_in_stock)
) ENGINE=InnoDB COMMENT='Spare parts inventory';


-- ─────────────────────────────────────────────────────────────
-- TABLE 10: part_usage
-- Records which parts were used in which job (and how many)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE part_usage (
    usage_id      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    job_id        INT UNSIGNED NOT NULL,
    part_id       INT UNSIGNED NOT NULL,
    qty_used      SMALLINT UNSIGNED NOT NULL DEFAULT 1,
    unit_price_charged DECIMAL(10,2) NOT NULL,  -- price at time of use
    used_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_pu_job  FOREIGN KEY (job_id)  REFERENCES service_jobs(job_id) ON DELETE RESTRICT,
    CONSTRAINT fk_pu_part FOREIGN KEY (part_id) REFERENCES spare_parts(part_id) ON DELETE RESTRICT,

    INDEX idx_pu_job  (job_id),
    INDEX idx_pu_part (part_id)
) ENGINE=InnoDB COMMENT='Parts used per service job — drives inventory deduction';


-- ─────────────────────────────────────────────────────────────
-- TABLE 11: invoices
-- Financial summary for a completed service job
-- ─────────────────────────────────────────────────────────────
CREATE TABLE invoices (
    invoice_id      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    job_id          INT UNSIGNED NOT NULL UNIQUE,
    customer_id     INT UNSIGNED NOT NULL,
    subtotal        DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    tax_rate        DECIMAL(5,2)  NOT NULL DEFAULT 18.00,  -- GST % or local tax
    tax_amount      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_amount    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status          ENUM('draft','issued','paid','overdue','cancelled') NOT NULL DEFAULT 'draft',
    due_date        DATE,
    issued_at       DATETIME,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_inv_job      FOREIGN KEY (job_id)      REFERENCES service_jobs(job_id)    ON DELETE RESTRICT,
    CONSTRAINT fk_inv_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id)  ON DELETE RESTRICT,

    INDEX idx_inv_customer (customer_id),
    INDEX idx_inv_status   (status),
    INDEX idx_inv_issued   (issued_at)
) ENGINE=InnoDB COMMENT='Invoices generated for completed service jobs';


-- ─────────────────────────────────────────────────────────────
-- TABLE 12: invoice_payments
-- Individual payment instalments against an invoice
-- ─────────────────────────────────────────────────────────────
CREATE TABLE invoice_payments (
    payment_id      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    invoice_id      INT UNSIGNED NOT NULL,
    amount_paid     DECIMAL(10,2) NOT NULL,
    payment_method  ENUM('cash','card','upi','bank_transfer','cheque','other') NOT NULL DEFAULT 'cash',
    reference_number VARCHAR(100),             -- UPI ref, cheque no., etc.
    paid_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    recorded_by     INT UNSIGNED,             -- user_id of staff who recorded it
    notes           TEXT,

    CONSTRAINT fk_pay_invoice  FOREIGN KEY (invoice_id)  REFERENCES invoices(invoice_id)  ON DELETE RESTRICT,
    CONSTRAINT fk_pay_staff    FOREIGN KEY (recorded_by) REFERENCES users(user_id)         ON DELETE SET NULL,

    INDEX idx_pay_invoice (invoice_id),
    INDEX idx_pay_paid_at (paid_at)
) ENGINE=InnoDB COMMENT='Payments received against invoices (supports partial payments)';


-- ─────────────────────────────────────────────────────────────
-- TABLE 13: maintenance_reminders
-- Predictive/scheduled reminders tied to a customer vehicle
-- ─────────────────────────────────────────────────────────────
CREATE TABLE maintenance_reminders (
    reminder_id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    vehicle_id          INT UNSIGNED NOT NULL,
    service_type_id     INT UNSIGNED,
    reminder_type       ENUM('date','mileage','interval') NOT NULL DEFAULT 'date',
    next_service_date   DATE,
    next_service_odometer INT UNSIGNED,        -- trigger odometer reading
    interval_km         INT UNSIGNED,          -- repeat every N km
    interval_days       SMALLINT UNSIGNED,     -- repeat every N days
    is_sent             TINYINT(1) NOT NULL DEFAULT 0,
    is_active           TINYINT(1) NOT NULL DEFAULT 1,
    created_by          INT UNSIGNED,          -- user who set the reminder
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_mr_vehicle      FOREIGN KEY (vehicle_id)      REFERENCES customer_vehicles(vehicle_id) ON DELETE CASCADE,
    CONSTRAINT fk_mr_service_type FOREIGN KEY (service_type_id) REFERENCES service_types(service_type_id) ON DELETE SET NULL,
    CONSTRAINT fk_mr_created_by   FOREIGN KEY (created_by)      REFERENCES users(user_id)                ON DELETE SET NULL,

    INDEX idx_mr_vehicle      (vehicle_id),
    INDEX idx_mr_next_date    (next_service_date),
    INDEX idx_mr_active_unsent (is_active, is_sent)
) ENGINE=InnoDB COMMENT='Predictive maintenance reminders per vehicle';


-- ─────────────────────────────────────────────────────────────
-- Confirm
-- ─────────────────────────────────────────────────────────────
SELECT table_name, table_comment
FROM information_schema.tables
WHERE table_schema = 'autocare_insight'
ORDER BY table_name;
