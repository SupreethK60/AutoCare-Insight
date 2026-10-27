import {
  User, Customer, VehicleCatalogueItem, CustomerVehicle,
  ServiceType, Appointment, ServiceJob, JobService, SparePart,
  PartUsage, Invoice, InvoicePayment, MaintenanceReminder, MongoRepairReport
} from '../types';

export const initialUsers: User[] = [
  { user_id: 1, full_name: 'Admin User', email: 'admin@autocare.com', role: 'admin', phone: '9800000001', is_active: 1 },
  { user_id: 2, full_name: 'Rajesh Kumar', email: 'rajesh@autocare.com', role: 'service_advisor', phone: '9800000002', is_active: 1 },
  { user_id: 3, full_name: 'Priya Nair', email: 'priya@autocare.com', role: 'service_advisor', phone: '9800000003', is_active: 1 },
  { user_id: 4, full_name: 'Suresh Mehta', email: 'suresh@autocare.com', role: 'mechanic', phone: '9800000004', is_active: 1 },
  { user_id: 5, full_name: 'Anjali Singh', email: 'anjali@autocare.com', role: 'mechanic', phone: '9800000005', is_active: 1 },
  { user_id: 6, full_name: 'Vikram Patel', email: 'vikram@autocare.com', role: 'mechanic', phone: '9800000006', is_active: 1 },
];

export const initialCustomers: Customer[] = [
  { customer_id: 1, full_name: 'Arjun Sharma', email: 'arjun.sharma@email.com', phone: '9811111111', address: '12, MG Road, Koramangala', city: 'Bengaluru', state: 'Karnataka', zip_code: '560034', loyalty_points: 150 },
  { customer_id: 2, full_name: 'Deepa Verma', email: 'deepa.verma@email.com', phone: '9822222222', address: '5, Anna Nagar, 4th Street', city: 'Chennai', state: 'Tamil Nadu', zip_code: '600040', loyalty_points: 80 },
  { customer_id: 3, full_name: 'Mohammed Farhan', email: 'farhan@email.com', phone: '9833333333', address: 'Flat 3B, Al-Ameen Towers', city: 'Hyderabad', state: 'Telangana', zip_code: '500032', loyalty_points: 220 },
  { customer_id: 4, full_name: 'Sonal Khatri', email: 'sonal.khatri@email.com', phone: '9844444444', address: '22, Bhawani Peth', city: 'Pune', state: 'Maharashtra', zip_code: '411042', loyalty_points: 40 },
  { customer_id: 5, full_name: 'Ravi Krishnamurthy', email: 'ravi.k@email.com', phone: '9855555555', address: 'House 7, RK Road', city: 'Mysuru', state: 'Karnataka', zip_code: '570004', loyalty_points: 310 },
  { customer_id: 6, full_name: 'Tanuja Iyer', email: 'tanuja.iyer@email.com', phone: '9866666666', address: 'Block D, Srinagar Colony', city: 'Bengaluru', state: 'Karnataka', zip_code: '560085', loyalty_points: 95 }
];

export const initialCatalogue: VehicleCatalogueItem[] = [
  { catalogue_id: 1, manufacturer: 'Acura', model: 'NSX', model_year: 2022, category: 'Sedan/Wagon', fuel: 'Hybrid Electric', fuel_code: 'HYBR', engine_type: 'SI', engine_size: '3.5L', engine_cylinders: 6, engine_description: '3.5L V6', transmission_type: 'Auto', drivetrain: 'AWD', conv_economy_city: 21, conv_economy_hwy: 22, conv_economy_combined: 21, source_dataset: 'LDV', source_vehicle_id: 13044 },
  { catalogue_id: 2, manufacturer: 'Audi', model: 'A3', model_year: 2022, category: 'Sedan/Wagon', fuel: 'Hybrid Electric', fuel_code: 'HYBR', engine_type: 'SI', engine_size: '2.0L', engine_cylinders: 4, engine_description: '2.0L I4', transmission_type: 'Auto', drivetrain: 'FWD', conv_economy_city: 29, conv_economy_hwy: 38, conv_economy_combined: 32, source_dataset: 'LDV', source_vehicle_id: 12854 },
  { catalogue_id: 3, manufacturer: 'Tesla', model: 'Model 3', model_year: 2022, category: 'Sedan/Wagon', fuel: 'Electric', fuel_code: 'ELEC', transmission_type: 'Auto', drivetrain: 'RWD', alt_economy_city: 148, alt_economy_hwy: 134, alt_economy_combined: 141, electric_range: 358, source_dataset: 'LDV', source_vehicle_id: 14001 },
  { catalogue_id: 4, manufacturer: 'Toyota', model: 'Camry', model_year: 2022, category: 'Sedan/Wagon', fuel: 'Hybrid Electric', fuel_code: 'HYBR', engine_type: 'SI', engine_size: '2.5L', engine_cylinders: 4, engine_description: '2.5L I4', transmission_type: 'Auto', drivetrain: 'FWD', conv_economy_city: 51, conv_economy_hwy: 53, conv_economy_combined: 52, source_dataset: 'LDV', source_vehicle_id: 13500 },
  { catalogue_id: 5, manufacturer: 'Ford', model: 'F-150', model_year: 2022, category: 'Pickup', fuel: 'Ethanol (E85)', fuel_code: 'E85_GSLN', engine_type: 'SI', engine_size: '3.5L', engine_cylinders: 6, engine_description: '3.5L V6 EcoBoost', transmission_type: 'Auto', drivetrain: '4WD', conv_economy_city: 15, conv_economy_hwy: 20, conv_economy_combined: 17, alt_economy_city: 13, alt_economy_hwy: 17, alt_economy_combined: 15, source_dataset: 'LDV', source_vehicle_id: 13600 },
  { catalogue_id: 6, manufacturer: 'Honda', model: 'CR-V', model_year: 2022, category: 'SUV', fuel: 'Plug-in Hybrid Electric', fuel_code: 'PHEV', engine_type: 'SI', engine_size: '2.0L', engine_cylinders: 4, engine_description: '2.0L I4', transmission_type: 'Auto', drivetrain: 'AWD', conv_economy_city: 40, conv_economy_hwy: 35, conv_economy_combined: 38, electric_range: 40, source_dataset: 'LDV', source_vehicle_id: 13700 },
  { catalogue_id: 7, manufacturer: 'Chevrolet', model: 'Silverado', model_year: 2022, category: 'Pickup', fuel: 'Hybrid Electric', fuel_code: 'HYBR', engine_type: 'SI', engine_size: '5.3L', engine_cylinders: 8, engine_description: '5.3L V8', transmission_type: 'Auto', drivetrain: 'RWD', conv_economy_city: 17, conv_economy_hwy: 23, conv_economy_combined: 20, source_dataset: 'LDV', source_vehicle_id: 13800 },
  { catalogue_id: 8, manufacturer: 'Blue Bird', model: 'All American', model_year: 2022, category: 'Transit Bus', fuel: 'CNG - Compressed Natural Gas', fuel_code: 'CNG', num_passengers: 72, heavy_duty_power_system: 'CNG Engine', source_dataset: 'MHD', source_vehicle_id: 10900 },
  { catalogue_id: 9, manufacturer: 'Hyundai', model: 'Ioniq 5', model_year: 2023, category: 'SUV', fuel: 'Electric', fuel_code: 'ELEC', transmission_type: 'Auto', drivetrain: 'AWD', alt_economy_combined: 110, electric_range: 303, source_dataset: 'AFV', source_vehicle_id: 15120 },
  { catalogue_id: 10, manufacturer: 'BMW', model: 'i4 eDrive40', model_year: 2023, category: 'Sedan/Wagon', fuel: 'Electric', fuel_code: 'ELEC', transmission_type: 'Auto', drivetrain: 'RWD', alt_economy_combined: 109, electric_range: 301, source_dataset: 'LDV', source_vehicle_id: 15234 },
  { catalogue_id: 11, manufacturer: 'Nissan', model: 'Leaf', model_year: 2022, category: 'Sedan/Wagon', fuel: 'Electric', fuel_code: 'ELEC', transmission_type: 'Auto', drivetrain: 'FWD', alt_economy_combined: 111, electric_range: 212, source_dataset: 'LDV', source_vehicle_id: 14210 },
  { catalogue_id: 12, manufacturer: 'Kia', model: 'EV6', model_year: 2023, category: 'SUV', fuel: 'Electric', fuel_code: 'ELEC', transmission_type: 'Auto', drivetrain: 'AWD', alt_economy_combined: 117, electric_range: 310, source_dataset: 'AFV', source_vehicle_id: 15302 }
];

export const initialCustomerVehicles: CustomerVehicle[] = [
  { vehicle_id: 1, customer_id: 1, catalogue_id: 1, license_plate: 'KA01AB1234', vin: '1HGBH41JXMN109186', color: 'Midnight Black', purchase_year: 2021, current_odometer: 48000, is_active: 1, customer_name: 'Arjun Sharma', customer_phone: '9811111111', manufacturer: 'Acura', model: 'NSX', model_year: 2022, category: 'Sedan/Wagon', fuel: 'Hybrid Electric' },
  { vehicle_id: 2, customer_id: 2, catalogue_id: 4, license_plate: 'TN05CD5678', vin: '2T1BURHE0JC025483', color: 'Pearl White', purchase_year: 2022, current_odometer: 22000, is_active: 1, customer_name: 'Deepa Verma', customer_phone: '9822222222', manufacturer: 'Toyota', model: 'Camry', model_year: 2022, category: 'Sedan/Wagon', fuel: 'Hybrid Electric' },
  { vehicle_id: 3, customer_id: 3, catalogue_id: 5, license_plate: 'TS09EF9012', vin: '1FTFW1ET4DKD55785', color: 'Magnetic Grey', purchase_year: 2020, current_odometer: 75000, is_active: 1, customer_name: 'Mohammed Farhan', customer_phone: '9833333333', manufacturer: 'Ford', model: 'F-150', model_year: 2022, category: 'Pickup', fuel: 'Ethanol (E85)' },
  { vehicle_id: 4, customer_id: 4, catalogue_id: 6, license_plate: 'MH12GH3456', vin: '2HKRM4H79JH613207', color: 'Aegean Blue', purchase_year: 2022, current_odometer: 15000, is_active: 1, customer_name: 'Sonal Khatri', customer_phone: '9844444444', manufacturer: 'Honda', model: 'CR-V', model_year: 2022, category: 'SUV', fuel: 'Plug-in Hybrid Electric' },
  { vehicle_id: 5, customer_id: 5, catalogue_id: 3, license_plate: 'KA41IJ7890', vin: '5YJ3E1EA8JF006984', color: 'Solid Red', purchase_year: 2021, current_odometer: 35000, is_active: 1, customer_name: 'Ravi Krishnamurthy', customer_phone: '9855555555', manufacturer: 'Tesla', model: 'Model 3', model_year: 2022, category: 'Sedan/Wagon', fuel: 'Electric' },
  { vehicle_id: 6, customer_id: 6, catalogue_id: 2, license_plate: 'KA09KL2345', vin: '1VWSA7A34LC012345', color: 'Glacier Silver', purchase_year: 2022, current_odometer: 8000, is_active: 1, customer_name: 'Tanuja Iyer', customer_phone: '9866666666', manufacturer: 'Audi', model: 'A3', model_year: 2022, category: 'Sedan/Wagon', fuel: 'Hybrid Electric' }
];

export const initialServiceTypes: ServiceType[] = [
  { service_type_id: 1, service_name: 'Oil Change', description: 'Engine oil and filter replacement', estimated_duration_mins: 45, base_price: 850.00, is_active: 1 },
  { service_type_id: 2, service_name: 'Tyre Rotation', description: 'Rotate all 4 tyres to even out wear', estimated_duration_mins: 30, base_price: 400.00, is_active: 1 },
  { service_type_id: 3, service_name: 'Brake Inspection', description: 'Inspect brake pads, discs, and fluid', estimated_duration_mins: 60, base_price: 600.00, is_active: 1 },
  { service_type_id: 4, service_name: 'Battery Check', description: 'Test 12V battery and charging system', estimated_duration_mins: 30, base_price: 300.00, is_active: 1 },
  { service_type_id: 5, service_name: 'Wheel Alignment', description: '4-wheel computerised alignment', estimated_duration_mins: 60, base_price: 1200.00, is_active: 1 },
  { service_type_id: 6, service_name: 'Air Conditioning Service', description: 'AC gas refill and system check', estimated_duration_mins: 120, base_price: 2500.00, is_active: 1 },
  { service_type_id: 7, service_name: 'General Inspection', description: 'Full vehicle health check (65-point)', estimated_duration_mins: 90, base_price: 1500.00, is_active: 1 },
  { service_type_id: 8, service_name: 'Brake Pad Replacement', description: 'Replace front/rear brake pads', estimated_duration_mins: 90, base_price: 2200.00, is_active: 1 },
  { service_type_id: 9, service_name: 'Spark Plug Replacement', description: 'Replace all spark plugs', estimated_duration_mins: 60, base_price: 1800.00, is_active: 1 },
  { service_type_id: 10, service_name: 'Transmission Service', description: 'Transmission fluid flush and filter', estimated_duration_mins: 90, base_price: 3500.00, is_active: 1 }
];

export const initialAppointments: Appointment[] = [
  { appointment_id: 1, customer_id: 1, vehicle_id: 1, advisor_id: 2, scheduled_at: '2025-05-10 10:00:00', status: 'completed', service_type_id: 1, mileage_at_booking: 47500, customer_notes: 'Engine making slight ticking noise', customer_name: 'Arjun Sharma', customer_phone: '9811111111', vehicle_description: 'Acura NSX (2022)', license_plate: 'KA01AB1234', advisor_name: 'Rajesh Kumar', service_name: 'Oil Change', base_price: 850 },
  { appointment_id: 2, customer_id: 2, vehicle_id: 2, advisor_id: 2, scheduled_at: '2025-05-12 11:00:00', status: 'completed', service_type_id: 3, mileage_at_booking: 21800, customer_notes: 'Squealing sound from front brakes', customer_name: 'Deepa Verma', customer_phone: '9822222222', vehicle_description: 'Toyota Camry (2022)', license_plate: 'TN05CD5678', advisor_name: 'Rajesh Kumar', service_name: 'Brake Inspection', base_price: 600 },
  { appointment_id: 3, customer_id: 3, vehicle_id: 3, advisor_id: 3, scheduled_at: '2025-05-14 09:30:00', status: 'completed', service_type_id: 7, mileage_at_booking: 74800, customer_notes: 'Full inspection before long trip', customer_name: 'Mohammed Farhan', customer_phone: '9833333333', vehicle_description: 'Ford F-150 (2022)', license_plate: 'TS09EF9012', advisor_name: 'Priya Nair', service_name: 'General Inspection', base_price: 1500 },
  { appointment_id: 4, customer_id: 4, vehicle_id: 4, advisor_id: 3, scheduled_at: '2025-05-16 14:00:00', status: 'confirmed', service_type_id: 5, mileage_at_booking: 14800, customer_notes: 'Steering feels slightly off', customer_name: 'Sonal Khatri', customer_phone: '9844444444', vehicle_description: 'Honda CR-V (2022)', license_plate: 'MH12GH3456', advisor_name: 'Priya Nair', service_name: 'Wheel Alignment', base_price: 1200 },
  { appointment_id: 5, customer_id: 5, vehicle_id: 5, advisor_id: 2, scheduled_at: '2025-05-18 10:00:00', status: 'pending', service_type_id: 4, mileage_at_booking: 34900, customer_notes: 'Battery warning light appeared', customer_name: 'Ravi Krishnamurthy', customer_phone: '9855555555', vehicle_description: 'Tesla Model 3 (2022)', license_plate: 'KA41IJ7890', advisor_name: 'Rajesh Kumar', service_name: 'Battery Check', base_price: 300 },
  { appointment_id: 6, customer_id: 6, vehicle_id: 6, advisor_id: 3, scheduled_at: '2025-05-20 15:00:00', status: 'pending', service_type_id: 2, mileage_at_booking: 7900, customer_notes: 'First tyre rotation since purchase', customer_name: 'Tanuja Iyer', customer_phone: '9866666666', vehicle_description: 'Audi A3 (2022)', license_plate: 'KA09KL2345', advisor_name: 'Priya Nair', service_name: 'Tyre Rotation', base_price: 400 }
];

export const initialServiceJobs: ServiceJob[] = [
  { job_id: 1, appointment_id: 1, mechanic_id: 4, vehicle_id: 1, status: 'completed', odometer_in: 47500, odometer_out: 47510, started_at: '2025-05-10 10:15:00', completed_at: '2025-05-10 11:10:00', mongo_report_id: '6648a1b2c3d4e5f601020304', internal_notes: 'Ticking was due to low oil. Resolved after oil change.', customer_name: 'Arjun Sharma', customer_phone: '9811111111', vehicle_description: 'Acura NSX (2022)', license_plate: 'KA01AB1234', mechanic_name: 'Suresh Mehta', total_amount: 2183.00, invoice_id: 1, invoice_status: 'paid', warranty_months: 6 },
  { job_id: 2, appointment_id: 2, mechanic_id: 5, vehicle_id: 2, status: 'completed', odometer_in: 21800, odometer_out: 21800, started_at: '2025-05-12 11:10:00', completed_at: '2025-05-12 12:40:00', mongo_report_id: '6648a1b2c3d4e5f601020305', internal_notes: 'Front brake pads 20% life remaining. Customer opted for inspection only.', customer_name: 'Deepa Verma', customer_phone: '9822222222', vehicle_description: 'Toyota Camry (2022)', license_plate: 'TN05CD5678', mechanic_name: 'Anjali Singh', total_amount: 708.00, invoice_id: 2, invoice_status: 'paid', warranty_months: 3 },
  { job_id: 3, appointment_id: 3, mechanic_id: 6, vehicle_id: 3, status: 'completed', odometer_in: 74800, odometer_out: 74800, started_at: '2025-05-14 09:45:00', completed_at: '2025-05-14 11:45:00', mongo_report_id: '6648a1b2c3d4e5f601020306', internal_notes: '65-point inspection done. Air filter needs replacing next visit.', customer_name: 'Mohammed Farhan', customer_phone: '9833333333', vehicle_description: 'Ford F-150 (2022)', license_plate: 'TS09EF9012', mechanic_name: 'Vikram Patel', total_amount: 1770.00, invoice_id: 3, invoice_status: 'issued', warranty_months: 3 }
];

export const initialSpareParts: SparePart[] = [
  { part_id: 1, part_number: 'OIL-FLT-001', part_name: 'Engine Oil Filter', description: 'Universal spin-on oil filter', category: 'Engine', brand: 'Bosch', unit_cost: 120.00, selling_price: 200.00, qty_in_stock: 45, reorder_level: 10, location_code: 'A1-S1', is_active: 1 },
  { part_id: 2, part_number: 'OIL-5W30-4L', part_name: '5W-30 Synthetic Oil 4L', description: '5W-30 full synthetic engine oil, 4L can', category: 'Engine', brand: 'Castrol', unit_cost: 680.00, selling_price: 850.00, qty_in_stock: 30, reorder_level: 8, location_code: 'A1-S2', is_active: 1 },
  { part_id: 3, part_number: 'BRK-PAD-F01', part_name: 'Front Brake Pad Set', description: 'Ceramic front brake pad set (pair)', category: 'Brakes', brand: 'Brembo', unit_cost: 1400.00, selling_price: 2000.00, qty_in_stock: 12, reorder_level: 5, location_code: 'B2-S1', is_active: 1 },
  { part_id: 4, part_number: 'BRK-PAD-R01', part_name: 'Rear Brake Pad Set', description: 'Semi-metallic rear brake pad set (pair)', category: 'Brakes', brand: 'Brembo', unit_cost: 900.00, selling_price: 1400.00, qty_in_stock: 8, reorder_level: 5, location_code: 'B2-S2', is_active: 1 },
  { part_id: 5, part_number: 'SPK-PLG-NGK', part_name: 'NGK Spark Plug', description: 'NGK iridium spark plug (each)', category: 'Ignition', brand: 'NGK', unit_cost: 220.00, selling_price: 350.00, qty_in_stock: 60, reorder_level: 15, location_code: 'C3-S1', is_active: 1 },
  { part_id: 6, part_number: 'AIR-FLT-002', part_name: 'Air Filter', description: 'Panel air filter for petrol/hybrid vehicles', category: 'Engine', brand: 'Mann', unit_cost: 180.00, selling_price: 280.00, qty_in_stock: 7, reorder_level: 8, location_code: 'A2-S1', is_active: 1 },
  { part_id: 7, part_number: 'BAT-12V-65AH', part_name: '12V Car Battery 65Ah', description: '65Ah maintenance-free lead-acid battery', category: 'Electrical', brand: 'Amaron', unit_cost: 3800.00, selling_price: 5000.00, qty_in_stock: 3, reorder_level: 3, location_code: 'D4-S1', is_active: 1 },
  { part_id: 8, part_number: 'TYR-PIL-205', part_name: 'Tyre Pirelli 205/55 R16', description: 'Pirelli P7 Cinturato 205/55 R16 all-season', category: 'Tyres', brand: 'Pirelli', unit_cost: 4200.00, selling_price: 5800.00, qty_in_stock: 2, reorder_level: 4, location_code: 'E5-S1', is_active: 1 },
  { part_id: 9, part_number: 'WPR-BLD-22', part_name: 'Wiper Blade 22"', description: '22 inch flat wiper blade', category: 'Accessories', brand: 'Bosch', unit_cost: 250.00, selling_price: 380.00, qty_in_stock: 20, reorder_level: 6, location_code: 'F1-S1', is_active: 1 },
  { part_id: 10, part_number: 'CLT-FLD-1L', part_name: 'Coolant 1L', description: 'OAT coolant concentrate 1L, mix 50:50', category: 'Cooling', brand: 'Havoline', unit_cost: 180.00, selling_price: 280.00, qty_in_stock: 15, reorder_level: 8, location_code: 'A3-S1', is_active: 1 }
];

export const initialPartUsage: PartUsage[] = [
  { usage_id: 1, job_id: 1, part_id: 1, qty_used: 1, unit_price_charged: 200.00, part_name: 'Engine Oil Filter', part_number: 'OIL-FLT-001' },
  { usage_id: 2, job_id: 1, part_id: 2, qty_used: 1, unit_price_charged: 850.00, part_name: '5W-30 Synthetic Oil 4L', part_number: 'OIL-5W30-4L' }
];

export const initialInvoices: Invoice[] = [
  { invoice_id: 1, job_id: 1, customer_id: 1, subtotal: 1850.00, tax_rate: 18.00, tax_amount: 333.00, discount_amount: 0.00, total_amount: 2183.00, status: 'paid', issued_at: '2025-05-10 11:15:00', due_date: '2025-05-17', customer_name: 'Arjun Sharma', license_plate: 'KA01AB1234', amount_paid: 2183.00 },
  { invoice_id: 2, job_id: 2, customer_id: 2, subtotal: 600.00, tax_rate: 18.00, tax_amount: 108.00, discount_amount: 0.00, total_amount: 708.00, status: 'paid', issued_at: '2025-05-12 12:45:00', due_date: '2025-05-19', customer_name: 'Deepa Verma', license_plate: 'TN05CD5678', amount_paid: 708.00 },
  { invoice_id: 3, job_id: 3, customer_id: 3, subtotal: 1500.00, tax_rate: 18.00, tax_amount: 270.00, discount_amount: 0.00, total_amount: 1770.00, status: 'issued', issued_at: '2025-05-14 11:50:00', due_date: '2025-05-21', customer_name: 'Mohammed Farhan', license_plate: 'TS09EF9012', amount_paid: 0 }
];

export const initialPayments: InvoicePayment[] = [
  { payment_id: 1, invoice_id: 1, amount_paid: 2183.00, payment_method: 'upi', reference_number: 'UPI2025051099001', paid_at: '2025-05-10 11:30:00', recorded_by: 2, recorded_by_name: 'Rajesh Kumar', notes: 'Instant UPI settlement via QR' },
  { payment_id: 2, invoice_id: 2, amount_paid: 708.00, payment_method: 'card', reference_number: 'TXN2025051299002', paid_at: '2025-05-12 13:00:00', recorded_by: 2, recorded_by_name: 'Rajesh Kumar', notes: 'Visa credit card terminal' }
];

export const initialReminders: MaintenanceReminder[] = [
  { reminder_id: 1, vehicle_id: 2, service_type_id: 1, reminder_type: 'interval', next_service_date: '2025-08-12', next_service_odometer: 27000, interval_km: 5000, interval_days: 180, is_sent: 0, is_active: 1, created_by: 2, notification_channel: 'sms', customer_name: 'Deepa Verma', license_plate: 'TN05CD5678', service_name: 'Oil Change' },
  { reminder_id: 2, vehicle_id: 3, service_type_id: 7, reminder_type: 'date', next_service_date: '2025-11-14', interval_days: 180, is_sent: 0, is_active: 1, created_by: 3, notification_channel: 'whatsapp', customer_name: 'Mohammed Farhan', license_plate: 'TS09EF9012', service_name: 'General Inspection' },
  { reminder_id: 3, vehicle_id: 5, service_type_id: 4, reminder_type: 'mileage', next_service_odometer: 40000, is_sent: 0, is_active: 1, created_by: 2, notification_channel: 'email', customer_name: 'Ravi Krishnamurthy', license_plate: 'KA41IJ7890', service_name: 'Battery Check' }
];

export const initialMongoReports: MongoRepairReport[] = [
  {
    _id: '6648a1b2c3d4e5f601020304',
    job_id: 1,
    vehicle_id: 1,
    mechanic_id: 4,
    created_at: '2025-05-10T11:10:00.000Z',
    mileage_at_service: 47510,
    customer_complaints: 'Customer reported slight engine ticking sound when idling at traffic stops.',
    inspection_summary: 'Oil level was critically low by 1.8 liters. Filter was saturated. No major oil leak detected around pan or valve cover gasket.',
    findings: [
      { system: 'Engine Lubrication', condition: 'Worn', action_taken: 'Drained residual degraded oil, flushed crankcase, installed new filter, filled 4.2L 5W-30 synthetic oil.', recommendation: 'Check oil level every 2,000 km.' },
      { system: 'Cooling System', condition: 'Good', action_taken: 'Checked coolant level and freeze point. Operating normally.', recommendation: 'Next flush in 20,000 km.' },
      { system: 'Drive Belts', condition: 'Good', action_taken: 'Inspected serpentine belt tension. No cracks or fraying.', recommendation: 'Inspect at next service.' }
    ],
    parts_replaced: [
      { part_id: 1, part_name: 'Engine Oil Filter', qty: 1 },
      { part_id: 2, part_name: '5W-30 Synthetic Oil 4L', qty: 1 }
    ],
    repair_summary: 'Engine ticking sound vanished immediately after fresh oil fill and pressurization. Valvetrain runs whisper quiet.',
    next_service_recommendations: 'Scheduled for routine oil change at 53,000 km or 6 months.',
    test_drive_notes: 'Tested on highway for 10 km. Acceleration smooth, engine temperature stable at 90°C.',
    overall_health_score: 92
  },
  {
    _id: '6648a1b2c3d4e5f601020305',
    job_id: 2,
    vehicle_id: 2,
    mechanic_id: 5,
    created_at: '2025-05-12T12:40:00.000Z',
    mileage_at_service: 21800,
    customer_complaints: 'Squealing noise from front wheels under light brake pedal application.',
    inspection_summary: 'Front brake pads are worn down to 3.8mm (~20% remaining life). Brake rotors show minor glazing but are within spec thickness.',
    findings: [
      { system: 'Front Brakes', condition: 'Worn', action_taken: 'Cleaned brake dust, lubricated caliper slide pins. Pad thickness measured.', recommendation: 'Replace front brake pads within 3,000 km.' },
      { system: 'Rear Brakes', condition: 'Good', action_taken: 'Rear pads inspected at 8mm (80% life). Rotors in excellent condition.', recommendation: 'Monitor at next service.' },
      { system: 'Brake Fluid', condition: 'Fair', action_taken: 'Moisture content tested at 1.8% (safe limit < 3%).', recommendation: 'Flush fluid during next pad change.' }
    ],
    parts_replaced: [],
    repair_summary: 'Temporary noise reduction achieved by cleaning brake dust and lubricating caliper pins. Informed customer of pad wear.',
    next_service_recommendations: 'Front brake pad and rotor disc service strongly recommended by 25,000 km.',
    test_drive_notes: 'Noise reduced significantly during light stops. Braking efficiency tested at 98%.',
    overall_health_score: 84
  },
  {
    _id: '6648a1b2c3d4e5f601020306',
    job_id: 3,
    vehicle_id: 3,
    mechanic_id: 6,
    created_at: '2025-05-14T11:45:00.000Z',
    mileage_at_service: 74800,
    customer_complaints: 'Pre-trip full inspection requested prior to 2,000 km interstate driving trip.',
    inspection_summary: 'Comprehensive 65-point check performed. Overall vehicle condition is strong. Air filter is moderately clogged with particulate matter.',
    findings: [
      { system: 'Suspension & Steering', condition: 'Good', action_taken: 'Ball joints, tie rods, and bushings inspected. No excessive play detected.', recommendation: 'All clear for long journey.' },
      { system: 'Tyres', condition: 'Fair', action_taken: 'Tread depth measured: Front 4.5mm, Rear 5.0mm. Tyre pressures set to 35 PSI.', recommendation: 'Consider rotation at 80,000 km.' },
      { system: 'Intake & Air Filter', condition: 'Worn', action_taken: 'Air filter inspected. Dust accumulation noted.', recommendation: 'Replace air filter at next visit.' },
      { system: 'Battery & Alternator', condition: 'Good', action_taken: 'Battery health test passed: 12.6V resting, 14.2V charging under alternator load.', recommendation: 'Battery is in good condition.' }
    ],
    parts_replaced: [],
    repair_summary: 'Truck passed all critical safety and mechanical checkpoints. Customer advised to avoid extreme dirt roads before filter replacement.',
    next_service_recommendations: 'Air filter and spark plugs due at 80,000 km milestone.',
    test_drive_notes: 'Driven 5 km in 4WD and 2WD modes. Drivetrain shifts crisply with no vibrations.',
    overall_health_score: 88
  }
];

