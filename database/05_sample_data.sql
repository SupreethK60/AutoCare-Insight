-- ============================================================
-- AutoCare Insight â€” Vehicle Service Management System
-- Script 05: Sample / Seed Data
-- Run after 02_create_tables.sql (and optionally 03_advanced_features.sql)
-- ============================================================

USE autocare_insight;

-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- USERS (password_hash is a bcrypt placeholder â€” real app uses bcrypt)
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
INSERT INTO users (full_name, email, password_hash, role, phone) VALUES
('Admin User',          'admin@autocare.com',   '$2b$10$placeholder_admin_hash',    'admin',           '9800000001'),
('Rajesh Kumar',        'rajesh@autocare.com',  '$2b$10$placeholder_advisor1_hash', 'service_advisor', '9800000002'),
('Priya Nair',          'priya@autocare.com',   '$2b$10$placeholder_advisor2_hash', 'service_advisor', '9800000003'),
('Suresh Mehta',        'suresh@autocare.com',  '$2b$10$placeholder_mech1_hash',    'mechanic',        '9800000004'),
('Anjali Singh',        'anjali@autocare.com',  '$2b$10$placeholder_mech2_hash',    'mechanic',        '9800000005'),
('Vikram Patel',        'vikram@autocare.com',  '$2b$10$placeholder_mech3_hash',    'mechanic',        '9800000006');


-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- CUSTOMERS
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
INSERT INTO customers (full_name, email, phone, address, city, state, zip_code) VALUES
('Arjun Sharma',     'arjun.sharma@email.com',    '9811111111', '12, MG Road, Koramangala',       'Bengaluru', 'Karnataka', '560034'),
('Deepa Verma',      'deepa.verma@email.com',     '9822222222', '5, Anna Nagar, 4th Street',      'Chennai',   'Tamil Nadu','600040'),
('Mohammed Farhan',  'farhan@email.com',           '9833333333', 'Flat 3B, Al-Ameen Towers',       'Hyderabad', 'Telangana', '500032'),
('Sonal Khatri',     'sonal.khatri@email.com',    '9844444444', '22, Bhawani Peth',               'Pune',      'Maharashtra','411042'),
('Ravi Krishnamurthy','ravi.k@email.com',          '9855555555', 'House 7, RK Road',               'Mysuru',    'Karnataka', '570004'),
('Tanuja Iyer',      'tanuja.iyer@email.com',     '9866666666', 'Block D, Srinagar Colony',       'Bengaluru', 'Karnataka', '560085');


-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- VEHICLE CATALOGUE (8 sample rows for testing before CSV import)
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
INSERT INTO vehicle_catalogue (
    manufacturer, model, model_year, category, fuel, fuel_code,
    engine_type, engine_size, engine_cylinders, engine_description,
    transmission_type, drivetrain,
    conv_economy_city, conv_economy_hwy, conv_economy_combined,
    alt_economy_city, alt_economy_hwy, alt_economy_combined,
    electric_range, source_dataset, source_vehicle_id
) VALUES
('Acura',      'NSX',      2022, 'Sedan/Wagon',      'Hybrid Electric',         'HYBR', 'SI', '3.5L', 6,  '3.5L V6',      'Auto', 'AWD',  21.0, 22.0, 21.0, NULL,  NULL,  NULL,  NULL,   'LDV', 13044),
('Audi',       'A3',       2022, 'Sedan/Wagon',      'Hybrid Electric',         'HYBR', 'SI', '2.0L', 4,  '2.0L I4',      'Auto', 'FWD',  29.0, 38.0, 32.0, NULL,  NULL,  NULL,  NULL,   'LDV', 12854),
('Tesla',      'Model 3',  2022, 'Sedan/Wagon',      'Electric',                'ELEC', NULL, NULL,   NULL, NULL,          'Auto', 'RWD',  NULL, NULL, NULL,  148.0, 134.0, 141.0, 358.0, 'LDV', 14001),
('Toyota',     'Camry',    2022, 'Sedan/Wagon',      'Hybrid Electric',         'HYBR', 'SI', '2.5L', 4,  '2.5L I4',      'Auto', 'FWD',  51.0, 53.0, 52.0, NULL,  NULL,  NULL,  NULL,   'LDV', 13500),
('Ford',       'F-150',    2022, 'Pickup',           'Ethanol (E85)',            'E85_GSLN','SI','3.5L', 6,'3.5L V6 EcoBoost','Auto','4WD',15.0, 20.0, 17.0, 13.0,  17.0,  15.0,  NULL,   'LDV', 13600),
('Honda',      'CR-V',     2022, 'SUV',              'Plug-in Hybrid Electric', 'PHEV', 'SI', '2.0L', 4,  '2.0L I4',      'Auto', 'AWD',  40.0, 35.0, 38.0, NULL,  NULL,  NULL,  40.0,   'LDV', 13700),
('Chevrolet',  'Silverado',2022, 'Pickup',           'Hybrid Electric',         'HYBR', 'SI', '5.3L', 8,  '5.3L V8',      'Auto', 'RWD',  17.0, 23.0, 20.0, NULL,  NULL,  NULL,  NULL,   'LDV', 13800),
('Blue Bird',  'All American',2022,'Transit Bus',   'CNG - Compressed Natural Gas','CNG',NULL,NULL,  NULL, NULL,           NULL,   NULL,   NULL, NULL, NULL,  NULL,  NULL,  NULL,  NULL,   'MHD', 10900);


-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- CUSTOMER VEHICLES
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
INSERT INTO customer_vehicles (customer_id, catalogue_id, license_plate, vin, color, purchase_year, current_odometer) VALUES
(1, 1, 'KA01AB1234', '1HGBH41JXMN109186', 'Midnight Black',  2021, 48000),
(2, 4, 'TN05CD5678', '2T1BURHE0JC025483', 'Pearl White',      2022, 22000),
(3, 5, 'TS09EF9012', '1FTFW1ET4DKD55785', 'Magnetic Grey',    2020, 75000),
(4, 6, 'MH12GH3456', '2HKRM4H79JH613207', 'Aegean Blue',      2022, 15000),
(5, 3, 'KA41IJ7890', '5YJ3E1EA8JF006984', 'Solid Red',        2021, 35000),
(6, 2, 'KA09KL2345', '1VWSA7A34LC012345', 'Glacier Silver',   2022, 8000);


-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- SERVICE TYPES
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
INSERT INTO service_types (service_name, description, estimated_duration_mins, base_price) VALUES
('Oil Change',                'Engine oil and filter replacement',              45,  850.00),
('Tyre Rotation',             'Rotate all 4 tyres to even out wear',            30,  400.00),
('Brake Inspection',          'Inspect brake pads, discs, and fluid',           60,  600.00),
('Battery Check',             'Test 12V battery and charging system',           30,  300.00),
('Wheel Alignment',           '4-wheel computerised alignment',                 60, 1200.00),
('Air Conditioning Service',  'AC gas refill and system check',                120, 2500.00),
('General Inspection',        'Full vehicle health check (65-point)',           90, 1500.00),
('Brake Pad Replacement',     'Replace front/rear brake pads',                  90, 2200.00),
('Spark Plug Replacement',    'Replace all spark plugs',                        60, 1800.00),
('Transmission Service',      'Transmission fluid flush and filter',            90, 3500.00);


-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- APPOINTMENTS
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
INSERT INTO appointments (customer_id, vehicle_id, advisor_id, scheduled_at, service_type_id, status, mileage_at_booking, customer_notes) VALUES
(1, 1, 2, '2025-05-10 10:00:00', 1, 'completed',  47500, 'Engine making slight ticking noise'),
(2, 2, 2, '2025-05-12 11:00:00', 3, 'completed',  21800, 'Squealing sound from front brakes'),
(3, 3, 3, '2025-05-14 09:30:00', 7, 'completed',  74800, 'Full inspection before long trip'),
(4, 4, 3, '2025-05-16 14:00:00', 5, 'confirmed',  14800, 'Steering feels slightly off'),
(5, 5, 2, '2025-05-18 10:00:00', 4, 'pending',    34900, 'Battery warning light appeared'),
(6, 6, 3, '2025-05-20 15:00:00', 2, 'pending',     7900, 'First tyre rotation since purchase');


-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- SERVICE JOBS (from completed appointments)
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
INSERT INTO service_jobs (appointment_id, mechanic_id, vehicle_id, status, odometer_in, odometer_out, started_at, completed_at, mongo_report_id, internal_notes) VALUES
(1, 4, 1, 'completed', 47500, 47510, '2025-05-10 10:15:00', '2025-05-10 11:10:00', '6648a1b2c3d4e5f601020304', 'Ticking was due to low oil. Resolved after oil change.'),
(2, 5, 2, 'completed', 21800, 21800, '2025-05-12 11:10:00', '2025-05-12 12:40:00', '6648a1b2c3d4e5f601020305', 'Front brake pads 20% life remaining. Customer opted for inspection only.'),
(3, 6, 3, 'completed', 74800, 74800, '2025-05-14 09:45:00', '2025-05-14 11:45:00', '6648a1b2c3d4e5f601020306', '65-point inspection done. Air filter needs replacing next visit.');


-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- JOB SERVICES
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
INSERT INTO job_services (job_id, service_type_id, service_price, technician_notes) VALUES
(1, 1,  850.00, 'Used 5W-30 synthetic oil. Filter replaced.'),
(2, 3,  600.00, 'Front pads measured at 4mm. Rear good at 8mm.'),
(3, 7, 1500.00, 'All systems checked. Lights, fluid levels, brakes, suspension.');


-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- SPARE PARTS
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
INSERT INTO spare_parts (part_number, part_name, description, category, brand, unit_cost, selling_price, qty_in_stock, reorder_level, location_code) VALUES
('OIL-FLT-001',  'Engine Oil Filter',         'Universal spin-on oil filter',                'Engine',      'Bosch',   120.00, 200.00, 45, 10, 'A1-S1'),
('OIL-5W30-4L',  '5W-30 Synthetic Oil 4L',    '5W-30 full synthetic engine oil, 4L can',     'Engine',      'Castrol', 680.00, 850.00, 30,  8, 'A1-S2'),
('BRK-PAD-F01',  'Front Brake Pad Set',       'Ceramic front brake pad set (pair)',           'Brakes',      'Brembo', 1400.00,2000.00, 12,  5, 'B2-S1'),
('BRK-PAD-R01',  'Rear Brake Pad Set',        'Semi-metallic rear brake pad set (pair)',      'Brakes',      'Brembo',  900.00,1400.00,  8,  5, 'B2-S2'),
('SPK-PLG-NGK',  'NGK Spark Plug',            'NGK iridium spark plug (each)',               'Ignition',    'NGK',     220.00, 350.00, 60, 15, 'C3-S1'),
('AIR-FLT-002',  'Air Filter',               'Panel air filter for petrol/hybrid vehicles',  'Engine',      'Mann',    180.00, 280.00,  7,  8, 'A2-S1'),
('BAT-12V-65AH', '12V Car Battery 65Ah',      '65Ah maintenance-free lead-acid battery',     'Electrical',  'Amaron', 3800.00,5000.00,  3,  3, 'D4-S1'),
('TYR-PIL-205',  'Tyre Pirelli 205/55 R16',  'Pirelli P7 Cinturato 205/55 R16 all-season', 'Tyres',       'Pirelli', 4200.00,5800.00,  2,  4, 'E5-S1'),
('WPR-BLD-22',   'Wiper Blade 22"',           '22 inch flat wiper blade',                    'Accessories', 'Bosch',   250.00, 380.00, 20,  6, 'F1-S1'),
('CLT-FLD-1L',   'Coolant 1L',               'OAT coolant concentrate 1L, mix 50:50',       'Cooling',     'Havoline', 180.00,280.00, 15,  8, 'A3-S1');


-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- PART USAGE (Job 1: Oil Change used oil filter + oil)
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
INSERT INTO part_usage (job_id, part_id, qty_used, unit_price_charged) VALUES
(1, 1, 1, 200.00),   -- 1x Oil Filter
(1, 2, 1, 850.00);   -- 1x 5W-30 Synthetic Oil 4L


-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- INVOICES (auto-generated for 3 completed jobs)
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
INSERT INTO invoices (job_id, customer_id, subtotal, tax_rate, tax_amount, discount_amount, total_amount, status, issued_at, due_date) VALUES
(1, 1, 1850.00, 18.00, 333.00, 0.00, 2183.00, 'paid',   '2025-05-10 11:15:00', '2025-05-17'),
(2, 2,  600.00, 18.00, 108.00, 0.00,  708.00, 'paid',   '2025-05-12 12:45:00', '2025-05-19'),
(3, 3, 1500.00, 18.00, 270.00, 0.00, 1770.00, 'issued', '2025-05-14 11:50:00', '2025-05-21');


-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- PAYMENTS
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
INSERT INTO invoice_payments (invoice_id, amount_paid, payment_method, reference_number, recorded_by) VALUES
(1, 2183.00, 'upi',  'UPI2025051099001', 2),
(2,  708.00, 'card', 'TXN2025051299002', 2);


-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- MAINTENANCE REMINDERS
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
INSERT INTO maintenance_reminders (vehicle_id, service_type_id, reminder_type, next_service_date, next_service_odometer, interval_km, interval_days, created_by) VALUES
(2, 1, 'interval', '2025-08-12', 27000, 5000, 180, 2),  -- Deepa's Toyota â€” oil change
(3, 7, 'date',     '2025-11-14', NULL,   NULL, 180, 3),  -- Farhan's Ford â€” general inspection
(5, 4, 'mileage',  NULL,        40000,  NULL, NULL, 2);  -- Ravi's Tesla â€” battery check at 40k


-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- VERIFY: Row counts for all tables
-- â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
SELECT 'users'                 AS tbl, COUNT(*) AS total_rows FROM users              UNION ALL
SELECT 'customers',                    COUNT(*)          FROM customers          UNION ALL
SELECT 'vehicle_catalogue',            COUNT(*)          FROM vehicle_catalogue  UNION ALL
SELECT 'customer_vehicles',            COUNT(*)          FROM customer_vehicles  UNION ALL
SELECT 'service_types',                COUNT(*)          FROM service_types      UNION ALL
SELECT 'appointments',                 COUNT(*)          FROM appointments       UNION ALL
SELECT 'service_jobs',                 COUNT(*)          FROM service_jobs       UNION ALL
SELECT 'job_services',                 COUNT(*)          FROM job_services       UNION ALL
SELECT 'spare_parts',                  COUNT(*)          FROM spare_parts        UNION ALL
SELECT 'part_usage',                   COUNT(*)          FROM part_usage         UNION ALL
SELECT 'invoices',                     COUNT(*)          FROM invoices           UNION ALL
SELECT 'invoice_payments',             COUNT(*)          FROM invoice_payments   UNION ALL
SELECT 'maintenance_reminders',        COUNT(*)          FROM maintenance_reminders;
