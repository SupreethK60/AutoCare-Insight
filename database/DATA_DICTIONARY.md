# AutoCare Insight — Data Dictionary

## Overview
This document describes every table and column in the `autocare_insight` MySQL database and the `autocare_db` MongoDB database.

---

## MySQL Tables

### 1. `users` — System users with RBAC
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| user_id | INT UNSIGNED | PK, AUTO_INCREMENT | Unique user identifier |
| full_name | VARCHAR(100) | NOT NULL | Full name of the user |
| email | VARCHAR(150) | NOT NULL, UNIQUE | Login email address |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt-hashed password |
| role | ENUM('admin','service_advisor','mechanic') | NOT NULL, DEFAULT 'mechanic' | Access control role |
| phone | VARCHAR(20) | | Contact phone number |
| is_active | TINYINT(1) | NOT NULL, DEFAULT 1 | Soft-delete flag (1=active) |
| created_at | DATETIME | NOT NULL, DEFAULT NOW | Record creation timestamp |
| updated_at | DATETIME | NOT NULL, ON UPDATE NOW | Last modification timestamp |

---

### 2. `customers` — Vehicle owners / shop clients
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| customer_id | INT UNSIGNED | PK, AUTO_INCREMENT | Unique customer identifier |
| full_name | VARCHAR(100) | NOT NULL | Customer's full name |
| email | VARCHAR(150) | UNIQUE | Email address |
| phone | VARCHAR(20) | NOT NULL | Primary phone number |
| address | TEXT | | Street address |
| city | VARCHAR(80) | | City |
| state | VARCHAR(80) | | State / province |
| zip_code | VARCHAR(20) | | PIN / ZIP code |
| created_at | DATETIME | NOT NULL | Record creation timestamp |
| updated_at | DATETIME | NOT NULL | Last modification timestamp |

---

### 3. `vehicle_catalogue` — Master vehicle catalogue (from CSVs)
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| catalogue_id | INT UNSIGNED | PK, AUTO_INCREMENT | Unique catalogue entry ID |
| manufacturer | VARCHAR(100) | NOT NULL | Vehicle manufacturer (e.g. Toyota) |
| model | VARCHAR(100) | NOT NULL | Vehicle model (e.g. Camry) |
| model_year | SMALLINT UNSIGNED | NOT NULL | Model year (e.g. 2022) |
| category | VARCHAR(100) | | Vehicle category (e.g. Sedan/Wagon, SUV) |
| fuel | VARCHAR(100) | | Fuel type (e.g. Hybrid Electric, CNG) |
| fuel_code | VARCHAR(20) | | Short fuel code (e.g. HYBR, ELEC, PHEV) |
| engine_type | VARCHAR(50) | | Engine type (SI, CI, etc.) |
| engine_size | VARCHAR(20) | | Engine displacement (e.g. 3.5L) |
| engine_cylinders | TINYINT UNSIGNED | | Number of cylinders |
| engine_description | VARCHAR(100) | | Full engine description (e.g. 3.5L V6) |
| transmission_type | VARCHAR(50) | | Transmission (Auto, Manual, CVT) |
| drivetrain | VARCHAR(20) | | AWD, FWD, RWD, 4WD |
| alt_economy_city | DECIMAL(6,2) | | Alternative fuel economy — city (MPGe) |
| alt_economy_hwy | DECIMAL(6,2) | | Alternative fuel economy — highway |
| alt_economy_combined | DECIMAL(6,2) | | Alternative fuel economy — combined |
| conv_economy_city | DECIMAL(6,2) | | Conventional fuel economy — city (MPG) |
| conv_economy_hwy | DECIMAL(6,2) | | Conventional fuel economy — highway |
| conv_economy_combined | DECIMAL(6,2) | | Conventional fuel economy — combined |
| electric_range | DECIMAL(7,2) | | All-electric driving range (miles) |
| phev_total_range | DECIMAL(7,2) | | Total PHEV range (electric + gas) |
| num_passengers | SMALLINT UNSIGNED | | Passenger capacity (MHD vehicles) |
| heavy_duty_power_system | VARCHAR(100) | | Power system info (MHD vehicles) |
| source_dataset | ENUM('LDV','AFV','MHD') | NOT NULL, DEFAULT 'LDV' | Source CSV file identifier |
| source_vehicle_id | INT UNSIGNED | | Original Vehicle ID from CSV |
| notes | TEXT | | Additional notes from source CSV |
| created_at | DATETIME | NOT NULL | Import timestamp |

**Unique Key:** `(manufacturer, model, model_year, fuel_code, source_dataset)` — prevents duplicate imports.

---

### 4. `customer_vehicles` — Customer-registered vehicles
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| vehicle_id | INT UNSIGNED | PK, AUTO_INCREMENT | Unique registration ID |
| customer_id | INT UNSIGNED | NOT NULL, FK → customers | Owner of the vehicle |
| catalogue_id | INT UNSIGNED | FK → vehicle_catalogue | Link to master catalogue (NULL if not found) |
| license_plate | VARCHAR(20) | NOT NULL | Registration plate number |
| vin | VARCHAR(17) | UNIQUE | Vehicle Identification Number |
| color | VARCHAR(40) | | Vehicle color |
| purchase_year | SMALLINT UNSIGNED | | Year customer purchased the vehicle |
| current_odometer | INT UNSIGNED | DEFAULT 0 | Latest odometer reading |
| fuel_override | VARCHAR(60) | | If fuel differs from catalogue entry |
| notes | TEXT | | Additional notes |
| is_active | TINYINT(1) | NOT NULL, DEFAULT 1 | Soft-delete flag |
| created_at | DATETIME | NOT NULL | Record creation timestamp |
| updated_at | DATETIME | NOT NULL | Last modification timestamp |

---

### 5. `service_types` — Catalogue of available services
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| service_type_id | INT UNSIGNED | PK, AUTO_INCREMENT | Unique service ID |
| service_name | VARCHAR(100) | NOT NULL, UNIQUE | Name (e.g. Oil Change) |
| description | TEXT | | Detailed description |
| estimated_duration_mins | SMALLINT UNSIGNED | DEFAULT 60 | Expected time in minutes |
| base_price | DECIMAL(10,2) | DEFAULT 0.00 | Standard price |
| is_active | TINYINT(1) | NOT NULL, DEFAULT 1 | Active flag |
| created_at | DATETIME | NOT NULL | Record creation timestamp |

---

### 6. `appointments` — Service booking records
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| appointment_id | INT UNSIGNED | PK, AUTO_INCREMENT | Unique booking ID |
| customer_id | INT UNSIGNED | NOT NULL, FK → customers | Who made the booking |
| vehicle_id | INT UNSIGNED | NOT NULL, FK → customer_vehicles | Which vehicle is coming in |
| advisor_id | INT UNSIGNED | FK → users | Assigned service advisor |
| scheduled_at | DATETIME | NOT NULL | Appointment date/time |
| status | ENUM('pending','confirmed','in_progress','completed','cancelled') | NOT NULL, DEFAULT 'pending' | Current booking status |
| service_type_id | INT UNSIGNED | FK → service_types | Requested service |
| mileage_at_booking | INT UNSIGNED | | Odometer at booking time |
| customer_notes | TEXT | | Customer's description of the issue |
| advisor_notes | TEXT | | Service advisor's internal notes |
| created_at | DATETIME | NOT NULL | Record creation timestamp |
| updated_at | DATETIME | NOT NULL | Last modification timestamp |

---

### 7. `service_jobs` — Workshop repair/maintenance jobs
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| job_id | INT UNSIGNED | PK, AUTO_INCREMENT | Unique job ID |
| appointment_id | INT UNSIGNED | FK → appointments | Source appointment (NULL if walk-in) |
| mechanic_id | INT UNSIGNED | FK → users | Assigned mechanic |
| vehicle_id | INT UNSIGNED | NOT NULL, FK → customer_vehicles | Vehicle being worked on |
| status | ENUM('assigned','in_progress','on_hold','completed','cancelled') | NOT NULL, DEFAULT 'assigned' | Job status |
| odometer_in | INT UNSIGNED | | Odometer reading at check-in |
| odometer_out | INT UNSIGNED | | Odometer reading at checkout |
| started_at | DATETIME | | When work started |
| completed_at | DATETIME | | When work finished |
| mongo_report_id | VARCHAR(24) | | MongoDB ObjectId of the repair report |
| internal_notes | TEXT | | Mechanic's internal notes |
| created_at | DATETIME | NOT NULL | Record creation timestamp |
| updated_at | DATETIME | NOT NULL | Last modification timestamp |

---

### 8. `job_services` — Services performed per job (bridge table)
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| job_service_id | INT UNSIGNED | PK, AUTO_INCREMENT | Row ID |
| job_id | INT UNSIGNED | NOT NULL, FK → service_jobs | Parent job |
| service_type_id | INT UNSIGNED | NOT NULL, FK → service_types | Specific service performed |
| service_price | DECIMAL(10,2) | NOT NULL, DEFAULT 0.00 | Price charged for this service |
| technician_notes | TEXT | | Service-specific notes |

**Unique Key:** `(job_id, service_type_id)` — prevents duplicate service entries per job.

---

### 9. `spare_parts` — Inventory of spare parts
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| part_id | INT UNSIGNED | PK, AUTO_INCREMENT | Unique part ID |
| part_number | VARCHAR(60) | NOT NULL, UNIQUE | Internal part number/SKU |
| part_name | VARCHAR(150) | NOT NULL | Display name |
| description | TEXT | | Detailed part description |
| category | VARCHAR(80) | | Category (Brakes, Engine, etc.) |
| brand | VARCHAR(80) | | Manufacturer/brand name |
| unit_cost | DECIMAL(10,2) | NOT NULL, DEFAULT 0.00 | Purchase cost per unit |
| selling_price | DECIMAL(10,2) | NOT NULL, DEFAULT 0.00 | Customer price per unit |
| qty_in_stock | INT UNSIGNED | NOT NULL, DEFAULT 0 | Current stock quantity |
| reorder_level | INT UNSIGNED | NOT NULL, DEFAULT 5 | Alert when stock drops to this |
| location_code | VARCHAR(30) | | Warehouse shelf/bin code |
| is_active | TINYINT(1) | NOT NULL, DEFAULT 1 | Active flag |
| created_at | DATETIME | NOT NULL | Record creation timestamp |
| updated_at | DATETIME | NOT NULL | Last modification timestamp |

---

### 10. `part_usage` — Parts consumed per job
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| usage_id | INT UNSIGNED | PK, AUTO_INCREMENT | Row ID |
| job_id | INT UNSIGNED | NOT NULL, FK → service_jobs | Job that consumed the part |
| part_id | INT UNSIGNED | NOT NULL, FK → spare_parts | Part that was used |
| qty_used | SMALLINT UNSIGNED | NOT NULL, DEFAULT 1 | Quantity consumed |
| unit_price_charged | DECIMAL(10,2) | NOT NULL | Price at time of use |
| used_at | DATETIME | NOT NULL, DEFAULT NOW | Timestamp of usage |

---

### 11. `invoices` — Financial invoices per job
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| invoice_id | INT UNSIGNED | PK, AUTO_INCREMENT | Unique invoice ID |
| job_id | INT UNSIGNED | NOT NULL, UNIQUE, FK → service_jobs | One invoice per job |
| customer_id | INT UNSIGNED | NOT NULL, FK → customers | Billed customer |
| subtotal | DECIMAL(10,2) | NOT NULL, DEFAULT 0.00 | Services + parts − discount |
| tax_rate | DECIMAL(5,2) | NOT NULL, DEFAULT 18.00 | Tax percentage (e.g. 18% GST) |
| tax_amount | DECIMAL(10,2) | NOT NULL, DEFAULT 0.00 | Calculated tax amount |
| discount_amount | DECIMAL(10,2) | NOT NULL, DEFAULT 0.00 | Discount applied |
| total_amount | DECIMAL(10,2) | NOT NULL, DEFAULT 0.00 | Grand total (subtotal + tax) |
| status | ENUM('draft','issued','paid','overdue','cancelled') | NOT NULL, DEFAULT 'draft' | Payment status |
| due_date | DATE | | Payment due date |
| issued_at | DATETIME | | When the invoice was issued |
| created_at | DATETIME | NOT NULL | Record creation timestamp |
| updated_at | DATETIME | NOT NULL | Last modification timestamp |

---

### 12. `invoice_payments` — Payment records (supports partial payments)
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| payment_id | INT UNSIGNED | PK, AUTO_INCREMENT | Unique payment ID |
| invoice_id | INT UNSIGNED | NOT NULL, FK → invoices | Invoice being paid |
| amount_paid | DECIMAL(10,2) | NOT NULL | Amount of this payment |
| payment_method | ENUM('cash','card','upi','bank_transfer','cheque','other') | NOT NULL, DEFAULT 'cash' | How the customer paid |
| reference_number | VARCHAR(100) | | UPI ref, cheque no., txn ID |
| paid_at | DATETIME | NOT NULL, DEFAULT NOW | When payment was received |
| recorded_by | INT UNSIGNED | FK → users | Staff who recorded the payment |
| notes | TEXT | | Payment notes |

---

### 13. `maintenance_reminders` — Predictive maintenance alerts
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| reminder_id | INT UNSIGNED | PK, AUTO_INCREMENT | Unique reminder ID |
| vehicle_id | INT UNSIGNED | NOT NULL, FK → customer_vehicles | Vehicle this reminder is for |
| service_type_id | INT UNSIGNED | FK → service_types | Which service is due |
| reminder_type | ENUM('date','mileage','interval') | NOT NULL, DEFAULT 'date' | Trigger type |
| next_service_date | DATE | | Date-based trigger |
| next_service_odometer | INT UNSIGNED | | Mileage-based trigger |
| interval_km | INT UNSIGNED | | Repeat every N km |
| interval_days | SMALLINT UNSIGNED | | Repeat every N days |
| is_sent | TINYINT(1) | NOT NULL, DEFAULT 0 | Whether reminder has been sent |
| is_active | TINYINT(1) | NOT NULL, DEFAULT 1 | Active flag |
| created_by | INT UNSIGNED | FK → users | User who created this reminder |
| created_at | DATETIME | NOT NULL | Record creation timestamp |
| updated_at | DATETIME | NOT NULL | Last modification timestamp |

---

## MongoDB Collection

### `autocare_db.repair_reports` — Flexible inspection & repair reports

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| _id | ObjectId | Auto | MongoDB document ID |
| job_id | int | ✅ Yes | FK to MySQL `service_jobs.job_id` |
| vehicle_id | int | ✅ Yes | FK to MySQL `customer_vehicles.vehicle_id` |
| mechanic_id | int | ✅ Yes | FK to MySQL `users.user_id` |
| created_at | Date | ✅ Yes | Report creation timestamp |
| mileage_at_service | int | No | Odometer at time of service |
| customer_complaints | string | No | Customer's description of the problem |
| inspection_summary | string | No | Brief overall inspection summary |
| findings | array of objects | No | Individual system-by-system findings |
| findings[].system | string | Yes* | System inspected (e.g. Brakes, Engine) |
| findings[].condition | string (enum) | Yes* | Good / Fair / Worn / Damaged / Critical |
| findings[].action_taken | string | No | What was done |
| findings[].recommendation | string | No | Advice for next service |
| parts_replaced | array of objects | No | Parts used (cross-ref with MySQL) |
| parts_replaced[].part_id | int | No | FK to `spare_parts.part_id` |
| parts_replaced[].part_name | string | No | Part name for readability |
| parts_replaced[].qty | int | No | Quantity replaced |
| photo_urls | array of strings | No | Inspection photo URLs/paths |
| repair_summary | string | No | Mechanic's narrative of work done |
| next_service_recommendations | string | No | Suggestions for next visit |
| test_drive_notes | string | No | Post-repair test drive observations |
| overall_health_score | int (0–100) | No | Vehicle health score |

*Required within each `findings` array element.

### MySQL ↔ MongoDB Relationship
- `service_jobs.mongo_report_id` in MySQL stores the `_id` (ObjectId hex string) of the corresponding MongoDB document.
- `repair_reports.job_id` in MongoDB stores the `service_jobs.job_id` integer for reverse lookup.
- This two-way link allows the application to fetch the structured job data from MySQL and the unstructured inspection notes from MongoDB together.
