# AutoCare Insight — ER Diagram

## Entity-Relationship Diagram

```mermaid
erDiagram

    %% ============================
    %% ENTITIES AND ATTRIBUTES
    %% ============================

    users {
        INT user_id PK
        VARCHAR full_name
        VARCHAR email UK
        VARCHAR password_hash
        ENUM role "admin | service_advisor | mechanic"
        VARCHAR phone
        TINYINT is_active
        DATETIME created_at
        DATETIME updated_at
    }

    customers {
        INT customer_id PK
        VARCHAR full_name
        VARCHAR email UK
        VARCHAR phone
        TEXT address
        VARCHAR city
        VARCHAR state
        VARCHAR zip_code
        DATETIME created_at
        DATETIME updated_at
    }

    vehicle_catalogue {
        INT catalogue_id PK
        VARCHAR manufacturer
        VARCHAR model
        SMALLINT model_year
        VARCHAR category
        VARCHAR fuel
        VARCHAR fuel_code
        VARCHAR engine_type
        VARCHAR engine_size
        TINYINT engine_cylinders
        VARCHAR engine_description
        VARCHAR transmission_type
        VARCHAR drivetrain
        DECIMAL alt_economy_city
        DECIMAL alt_economy_hwy
        DECIMAL alt_economy_combined
        DECIMAL conv_economy_city
        DECIMAL conv_economy_hwy
        DECIMAL conv_economy_combined
        DECIMAL electric_range
        DECIMAL phev_total_range
        SMALLINT num_passengers
        VARCHAR heavy_duty_power_system
        ENUM source_dataset "LDV | AFV | MHD"
        INT source_vehicle_id
        TEXT notes
    }

    customer_vehicles {
        INT vehicle_id PK
        INT customer_id FK
        INT catalogue_id FK
        VARCHAR license_plate
        VARCHAR vin UK
        VARCHAR color
        SMALLINT purchase_year
        INT current_odometer
        VARCHAR fuel_override
        TEXT notes
        TINYINT is_active
    }

    service_types {
        INT service_type_id PK
        VARCHAR service_name UK
        TEXT description
        SMALLINT estimated_duration_mins
        DECIMAL base_price
        TINYINT is_active
    }

    appointments {
        INT appointment_id PK
        INT customer_id FK
        INT vehicle_id FK
        INT advisor_id FK
        DATETIME scheduled_at
        ENUM status "pending | confirmed | in_progress | completed | cancelled"
        INT service_type_id FK
        INT mileage_at_booking
        TEXT customer_notes
        TEXT advisor_notes
    }

    service_jobs {
        INT job_id PK
        INT appointment_id FK
        INT mechanic_id FK
        INT vehicle_id FK
        ENUM status "assigned | in_progress | on_hold | completed | cancelled"
        INT odometer_in
        INT odometer_out
        DATETIME started_at
        DATETIME completed_at
        VARCHAR mongo_report_id "MongoDB ObjectId"
        TEXT internal_notes
    }

    job_services {
        INT job_service_id PK
        INT job_id FK
        INT service_type_id FK
        DECIMAL service_price
        TEXT technician_notes
    }

    spare_parts {
        INT part_id PK
        VARCHAR part_number UK
        VARCHAR part_name
        TEXT description
        VARCHAR category
        VARCHAR brand
        DECIMAL unit_cost
        DECIMAL selling_price
        INT qty_in_stock
        INT reorder_level
        VARCHAR location_code
        TINYINT is_active
    }

    part_usage {
        INT usage_id PK
        INT job_id FK
        INT part_id FK
        SMALLINT qty_used
        DECIMAL unit_price_charged
        DATETIME used_at
    }

    invoices {
        INT invoice_id PK
        INT job_id FK "UNIQUE"
        INT customer_id FK
        DECIMAL subtotal
        DECIMAL tax_rate
        DECIMAL tax_amount
        DECIMAL discount_amount
        DECIMAL total_amount
        ENUM status "draft | issued | paid | overdue | cancelled"
        DATE due_date
        DATETIME issued_at
    }

    invoice_payments {
        INT payment_id PK
        INT invoice_id FK
        DECIMAL amount_paid
        ENUM payment_method "cash | card | upi | bank_transfer | cheque | other"
        VARCHAR reference_number
        DATETIME paid_at
        INT recorded_by FK
    }

    maintenance_reminders {
        INT reminder_id PK
        INT vehicle_id FK
        INT service_type_id FK
        ENUM reminder_type "date | mileage | interval"
        DATE next_service_date
        INT next_service_odometer
        INT interval_km
        SMALLINT interval_days
        TINYINT is_sent
        TINYINT is_active
        INT created_by FK
    }

    %% ============================
    %% RELATIONSHIPS
    %% ============================

    customers         ||--o{ customer_vehicles     : "owns"
    vehicle_catalogue ||--o{ customer_vehicles     : "described by"

    customers         ||--o{ appointments           : "books"
    customer_vehicles ||--o{ appointments           : "scheduled for"
    users             ||--o{ appointments           : "advised by"
    service_types     ||--o{ appointments           : "requests"

    appointments      ||--o| service_jobs            : "creates"
    users             ||--o{ service_jobs            : "assigned to (mechanic)"
    customer_vehicles ||--o{ service_jobs            : "serviced"

    service_jobs      ||--o{ job_services            : "includes"
    service_types     ||--o{ job_services            : "performed"

    service_jobs      ||--o{ part_usage              : "consumes"
    spare_parts       ||--o{ part_usage              : "used in"

    service_jobs      ||--o| invoices                : "billed as"
    customers         ||--o{ invoices                : "billed to"

    invoices          ||--o{ invoice_payments        : "paid via"
    users             ||--o{ invoice_payments        : "recorded by"

    customer_vehicles ||--o{ maintenance_reminders   : "scheduled"
    service_types     ||--o{ maintenance_reminders   : "reminds for"
    users             ||--o{ maintenance_reminders   : "created by"
```

---

## Relationship Summary

| Parent Entity | Child Entity | Cardinality | FK Column | ON DELETE |
|---------------|-------------|-------------|-----------|-----------|
| customers | customer_vehicles | 1:M | customer_id | RESTRICT |
| vehicle_catalogue | customer_vehicles | 1:M | catalogue_id | SET NULL |
| customers | appointments | 1:M | customer_id | RESTRICT |
| customer_vehicles | appointments | 1:M | vehicle_id | RESTRICT |
| users (advisor) | appointments | 1:M | advisor_id | SET NULL |
| service_types | appointments | 1:M | service_type_id | SET NULL |
| appointments | service_jobs | 1:0..1 | appointment_id | SET NULL |
| users (mechanic) | service_jobs | 1:M | mechanic_id | SET NULL |
| customer_vehicles | service_jobs | 1:M | vehicle_id | RESTRICT |
| service_jobs | job_services | 1:M | job_id | CASCADE |
| service_types | job_services | 1:M | service_type_id | RESTRICT |
| service_jobs | part_usage | 1:M | job_id | RESTRICT |
| spare_parts | part_usage | 1:M | part_id | RESTRICT |
| service_jobs | invoices | 1:0..1 | job_id (UNIQUE) | RESTRICT |
| customers | invoices | 1:M | customer_id | RESTRICT |
| invoices | invoice_payments | 1:M | invoice_id | RESTRICT |
| users (staff) | invoice_payments | 1:M | recorded_by | SET NULL |
| customer_vehicles | maintenance_reminders | 1:M | vehicle_id | CASCADE |
| service_types | maintenance_reminders | 1:M | service_type_id | SET NULL |
| users | maintenance_reminders | 1:M | created_by | SET NULL |

---

## MongoDB Relationship

```mermaid
graph LR
    A["MySQL: service_jobs"] -- "mongo_report_id (ObjectId hex)" --> B["MongoDB: repair_reports"]
    B -- "job_id (integer)" --> A
    style A fill:#3b82f6,color:#fff
    style B fill:#10b981,color:#fff
```

The `service_jobs` table stores the MongoDB `_id` as a 24-character hex string in `mongo_report_id`. The MongoDB document stores the MySQL `job_id` as an integer for bidirectional lookup.
