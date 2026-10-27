-- ============================================================
-- AutoCare Insight — Vehicle Service Management System
-- Script 04: CSV Import — vehicle_catalogue table
-- ============================================================
-- HOW TO RUN (Two options):
--
-- OPTION A — MySQL Workbench Import Wizard (Easiest)
--   1. Open MySQL Workbench
--   2. Connect to your MySQL80 server
--   3. In the Navigator, expand "autocare_insight" > Tables
--   4. Right-click "vehicle_catalogue" > "Table Data Import Wizard"
--   5. Follow the wizard: point to each CSV file, map columns as below
--
-- OPTION B — LOAD DATA INFILE (Fastest, requires FILE privilege)
--   Run the three blocks below after setting the correct CSV paths.
--   NOTE: Set global variable first:
--   SET GLOBAL local_infile = 1;
--   And connect with: mysql --local-infile=1 -u root -p autocare_insight
--
-- IMPORTANT: Do NOT modify or delete the original CSV files.
--            This script reads them as-is.
-- ============================================================

USE autocare_insight;

-- ─────────────────────────────────────────────────────────────
-- STEP 0: Enable local infile if using OPTION B
-- ─────────────────────────────────────────────────────────────
-- SET GLOBAL local_infile = 1;

-- ─────────────────────────────────────────────────────────────
-- IMPORT 1: Light Duty Vehicles.csv  (PRIMARY — run first)
-- Columns in order:
--   Vehicle ID, Fuel ID, Fuel Configuration ID, Manufacturer ID,
--   Category ID, Model, Model Year, Alternative Fuel Economy City,
--   Alternative Fuel Economy Highway, Alternative Fuel Economy Combined,
--   Conventional Fuel Economy City, Conventional Fuel Economy Highway,
--   Conventional Fuel Economy Combined, Transmission Type, Engine Type,
--   Engine Size, Engine Cylinder Count, Engine Description, Manufacturer,
--   Manufacturer URL, Category, Fuel Code, Fuel, Fuel Configuration Name,
--   Electric-Only Range, PHEV Total Range, PHEV Type, Notes, Drivetrain
-- ─────────────────────────────────────────────────────────────

/*  ← Remove this comment block start to activate OPTION B

LOAD DATA LOCAL INFILE 'D:/DBMS_Assignment/vehicle_management/Light Duty Vehicles.csv'
INTO TABLE vehicle_catalogue
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(
    source_vehicle_id,        -- Vehicle ID
    @fuel_id,                 -- Fuel ID (not imported — internal to CSV)
    @fuel_config_id,          -- Fuel Configuration ID (not imported)
    @manufacturer_id,         -- Manufacturer ID (not imported)
    @category_id,             -- Category ID (not imported)
    model,                    -- Model
    model_year,               -- Model Year
    @alt_city,                -- Alternative Fuel Economy City
    @alt_hwy,                 -- Alternative Fuel Economy Highway
    @alt_combined,            -- Alternative Fuel Economy Combined
    @conv_city,               -- Conventional Fuel Economy City
    @conv_hwy,                -- Conventional Fuel Economy Highway
    @conv_combined,           -- Conventional Fuel Economy Combined
    transmission_type,        -- Transmission Type
    engine_type,              -- Engine Type
    engine_size,              -- Engine Size
    engine_cylinders,         -- Engine Cylinder Count
    engine_description,       -- Engine Description
    manufacturer,             -- Manufacturer
    @mfr_url,                 -- Manufacturer URL (not imported)
    category,                 -- Category
    fuel_code,                -- Fuel Code
    fuel,                     -- Fuel
    @fuel_config_name,        -- Fuel Configuration Name (not imported)
    @elec_range,              -- Electric-Only Range
    @phev_range,              -- PHEV Total Range
    @phev_type,               -- PHEV Type
    notes,                    -- Notes
    drivetrain                -- Drivetrain
)
SET
    source_dataset       = 'LDV',
    alt_economy_city     = NULLIF(TRIM(@alt_city),     ''),
    alt_economy_hwy      = NULLIF(TRIM(@alt_hwy),      ''),
    alt_economy_combined = NULLIF(TRIM(@alt_combined), ''),
    conv_economy_city    = NULLIF(TRIM(@conv_city),    ''),
    conv_economy_hwy     = NULLIF(TRIM(@conv_hwy),     ''),
    conv_economy_combined= NULLIF(TRIM(@conv_combined),''),
    electric_range       = NULLIF(TRIM(@elec_range),   ''),
    phev_total_range     = NULLIF(TRIM(@phev_range),   ''),
    num_passengers       = NULL,
    heavy_duty_power_system = NULL;

*/   -- ← Remove this comment block end to activate OPTION B


-- ─────────────────────────────────────────────────────────────
-- IMPORT 2: Alternative Fuel Vehicles US.csv (SUPPLEMENTARY)
-- Columns in order:
--   Category, Model, Model Year, Manufacturer, Fuel,
--   All-Electric Range, PHEV Total Range,
--   Alternative Fuel Economy City, Alternative Fuel Economy Highway,
--   Alternative Fuel Economy Combined,
--   Conventional Fuel Economy City, Conventional Fuel Economy Highway,
--   Conventional Fuel Economy Combined,
--   Transmission Type, Transmission Make, Engine Type,
--   Engine Size, Engine Cylinder Count,
--   Number of Passengers, Heavy-Duty Power System, Notes, Drivetrain
-- ─────────────────────────────────────────────────────────────

/*

LOAD DATA LOCAL INFILE 'D:/DBMS_Assignment/vehicle_management/Alternative Fuel Vehicles US.csv'
INTO TABLE vehicle_catalogue
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(
    category,               -- Category
    model,                  -- Model
    model_year,             -- Model Year
    manufacturer,           -- Manufacturer
    fuel,                   -- Fuel
    @elec_range,            -- All-Electric Range
    @phev_range,            -- PHEV Total Range
    @alt_city,              -- Alternative Fuel Economy City
    @alt_hwy,               -- Alternative Fuel Economy Highway
    @alt_combined,          -- Alternative Fuel Economy Combined
    @conv_city,             -- Conventional Fuel Economy City
    @conv_hwy,              -- Conventional Fuel Economy Highway
    @conv_combined,         -- Conventional Fuel Economy Combined
    transmission_type,      -- Transmission Type
    @trans_make,            -- Transmission Make (not stored separately)
    engine_type,            -- Engine Type
    engine_size,            -- Engine Size
    engine_cylinders,       -- Engine Cylinder Count
    @num_pass,              -- Number of Passengers
    @hd_power,              -- Heavy-Duty Power System
    notes,                  -- Notes
    drivetrain              -- Drivetrain
)
SET
    source_dataset           = 'AFV',
    fuel_code                = NULL,        -- AFV CSV has no Fuel Code column
    engine_description       = NULL,
    alt_economy_city         = NULLIF(TRIM(@alt_city),     ''),
    alt_economy_hwy          = NULLIF(TRIM(@alt_hwy),      ''),
    alt_economy_combined     = NULLIF(TRIM(@alt_combined), ''),
    conv_economy_city        = NULLIF(TRIM(@conv_city),    ''),
    conv_economy_hwy         = NULLIF(TRIM(@conv_hwy),     ''),
    conv_economy_combined    = NULLIF(TRIM(@conv_combined),''),
    electric_range           = NULLIF(TRIM(@elec_range),   ''),
    phev_total_range         = NULLIF(TRIM(@phev_range),   ''),
    num_passengers           = NULLIF(TRIM(@num_pass),     ''),
    heavy_duty_power_system  = NULLIF(TRIM(@hd_power),     ''),
    source_vehicle_id        = NULL;

*/


-- ─────────────────────────────────────────────────────────────
-- IMPORT 3: Medium and Heavy Duty Vehicles.csv (SUPPLEMENTARY)
-- Columns in order:
--   Vehicle ID, Model, Manufacturer, Transmission Make,
--   Num Passengers, Power System Ids, Fuels,
--   Application Categories, Transmission Types
-- ─────────────────────────────────────────────────────────────

/*

LOAD DATA LOCAL INFILE 'D:/DBMS_Assignment/vehicle_management/Medium and Heavy Duty Vehicles.csv'
INTO TABLE vehicle_catalogue
FIELDS TERMINATED BY ','
OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(
    source_vehicle_id,          -- Vehicle ID
    model,                      -- Model
    manufacturer,               -- Manufacturer
    @trans_make,                -- Transmission Make
    @num_pass,                  -- Num Passengers
    @power_sys_ids,             -- Power System Ids (array format, skip)
    fuel,                       -- Fuels (pipe-delimited — stored as-is)
    category,                   -- Application Categories
    transmission_type           -- Transmission Types
)
SET
    source_dataset           = 'MHD',
    model_year               = 2022,        -- MHD CSV has no year column; use 2022 as default
    fuel_code                = NULL,
    engine_type              = NULL,
    engine_size              = NULL,
    engine_cylinders         = NULL,
    engine_description       = NULL,
    drivetrain               = NULL,
    alt_economy_city         = NULL,
    alt_economy_hwy          = NULL,
    alt_economy_combined     = NULL,
    conv_economy_city        = NULL,
    conv_economy_hwy         = NULL,
    conv_economy_combined    = NULL,
    electric_range           = NULL,
    phev_total_range         = NULL,
    num_passengers           = NULLIF(TRIM(@num_pass), ''),
    heavy_duty_power_system  = NULLIF(TRIM(@power_sys_ids), ''),
    notes                    = NULL;

*/


-- ─────────────────────────────────────────────────────────────
-- STEP 2: Verify import counts
-- ─────────────────────────────────────────────────────────────
/*
SELECT source_dataset, COUNT(*) AS row_count
FROM vehicle_catalogue
GROUP BY source_dataset;

-- Expected approximate results (after deduplication):
--   LDV  →  ~3521 rows
--   AFV  →  ~0-100 rows (most are already in LDV)
--   MHD  →  ~292 rows
*/

-- ─────────────────────────────────────────────────────────────
-- STEP 3: Update fuel_code for AFV rows using the fuel column
-- (Because AFV CSV has no Fuel Code column)
-- ─────────────────────────────────────────────────────────────
/*
UPDATE vehicle_catalogue
SET fuel_code = CASE
    WHEN fuel LIKE '%Hybrid Electric%'        THEN 'HYBR'
    WHEN fuel LIKE '%Plug-in Hybrid%'         THEN 'PHEV'
    WHEN fuel LIKE '%Electric%'               THEN 'ELEC'
    WHEN fuel LIKE '%Biodiesel%'              THEN 'BD'
    WHEN fuel LIKE '%Ethanol%'               THEN 'E85_GSLN'
    WHEN fuel LIKE '%Hydrogen%'              THEN 'H2'
    WHEN fuel LIKE '%Compressed Natural Gas%' THEN 'CNG'
    WHEN fuel LIKE '%Liquified Natural Gas%'  THEN 'LNG'
    WHEN fuel LIKE '%Propane%'               THEN 'LPG'
    ELSE 'OTHER'
END
WHERE source_dataset IN ('AFV','MHD') AND fuel_code IS NULL;
*/
