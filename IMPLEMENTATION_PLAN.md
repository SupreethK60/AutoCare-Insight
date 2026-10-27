# AutoCare Insight — Implementation Plan
# Vehicle Service Management and Predictive Maintenance System

Generated: Phase 1 Inspection (October 2026)

---

## Project Phases Overview

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Inspection, planning, CSV analysis | ✅ Complete |
| Phase 2 | MySQL schema DDL, MongoDB setup, Git/GitHub | ⏳ Pending approval |
| Phase 3 | Next.js project scaffold, DB connections | ⏳ Pending |
| Phase 4 | Backend: Auth, Customers, Vehicles, Jobs, Inventory APIs | ⏳ Pending |
| Phase 5 | Frontend: Pages, UI, Dashboard | ⏳ Pending |
| Phase 6 | Advanced SQL: Views, Stored Procs, Triggers, Indexes, Transactions | ⏳ Pending |
| Phase 7 | MongoDB Aggregation, Documentation, README | ⏳ Pending |

---

## Tool Status (Phase 1 Check)

- Node.js: v22.20.0 ✅
- npm: v11.6.0 ✅
- Git: v2.53.0 ✅
- MySQL CLI: ❌ Not in PATH — MySQL Server needs verification
- MongoDB (mongod): ✅ Detected
- mongosh: v2.5.8 ✅

---

## Dataset Summary

### Alternative Fuel Vehicles US.csv (892 rows)
Columns: Category, Model, Model Year, Manufacturer, Fuel, All-Electric Range, PHEV Total Range,
Alternative Fuel Economy City/Highway/Combined, Conventional Fuel Economy City/Highway/Combined,
Transmission Type, Transmission Make, Engine Type, Engine Size, Engine Cylinder Count,
Number of Passengers, Heavy-Duty Power System, Notes, Drivetrain

### Light Duty Vehicles.csv (3521 rows) — PRIMARY CATALOGUE
Columns: Vehicle ID, Fuel ID, Fuel Configuration ID, Manufacturer ID, Category ID, Model, Model Year,
Alternative Fuel Economy City/Highway/Combined, Conventional Fuel Economy City/Highway/Combined,
Transmission Type, Engine Type, Engine Size, Engine Cylinder Count, Engine Description,
Manufacturer, Manufacturer URL, Category, Fuel Code, Fuel, Fuel Configuration Name,
Electric-Only Range, PHEV Total Range, PHEV Type, Notes, Drivetrain

### Medium and Heavy Duty Vehicles.csv (292 rows) — SUPPLEMENTARY
Columns: Vehicle ID, Model, Manufacturer, Transmission Make, Num Passengers,
Power System Ids, Fuels, Application Categories, Transmission Types

---

## Proposed MySQL Schema (Tables)

1. users (id, name, email, password_hash, role, created_at)
2. customers (id, name, email, phone, address, created_at)
3. vehicle_catalogue (imported from CSVs)
4. vehicles (customer vehicle registrations)
5. appointments
6. service_jobs
7. job_parts
8. inventory_parts
9. invoices
10. payments
11. maintenance_reminders

## MongoDB Collection

- repair_reports (flexible inspection notes, findings, photos, repair summaries per job)

---

## Requirements Checklist

See implementation_plan.md artifact for the full checklist.

## Next Steps

Before Phase 2, please:
1. Verify MySQL Server is running (open MySQL Workbench)
2. Note your MySQL root password (for .env file only)
3. Reply "proceed to Phase 2" to continue
