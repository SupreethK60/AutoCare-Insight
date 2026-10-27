export type UserRole = 'admin' | 'service_advisor' | 'mechanic';

export interface User {
  user_id: number;
  full_name: string;
  email: string;
  role: UserRole;
  phone?: string;
  is_active: number;
  created_at?: string;
  updated_at?: string;
}

export interface Customer {
  customer_id: number;
  full_name: string;
  email?: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  loyalty_points?: number;
  created_at?: string;
}

export interface VehicleCatalogueItem {
  catalogue_id: number;
  manufacturer: string;
  model: string;
  model_year: number;
  category?: string;
  fuel?: string;
  fuel_code?: string;
  engine_type?: string;
  engine_size?: string;
  engine_cylinders?: number;
  engine_description?: string;
  transmission_type?: string;
  drivetrain?: string;
  conv_economy_city?: number;
  conv_economy_hwy?: number;
  conv_economy_combined?: number;
  alt_economy_city?: number;
  alt_economy_hwy?: number;
  alt_economy_combined?: number;
  electric_range?: number;
  phev_total_range?: number;
  num_passengers?: number;
  heavy_duty_power_system?: string;
  source_dataset: 'LDV' | 'AFV' | 'MHD';
  source_vehicle_id?: number;
  notes?: string;
}

export interface CustomerVehicle {
  vehicle_id: number;
  customer_id: number;
  catalogue_id?: number;
  license_plate: string;
  vin?: string;
  color?: string;
  purchase_year?: number;
  current_odometer: number;
  fuel_override?: string;
  notes?: string;
  is_active: number;
  // Joined fields
  customer_name?: string;
  customer_phone?: string;
  manufacturer?: string;
  model?: string;
  model_year?: number;
  category?: string;
  fuel?: string;
}

export interface ServiceType {
  service_type_id: number;
  service_name: string;
  description?: string;
  estimated_duration_mins: number;
  base_price: number;
  is_active: number;
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export interface Appointment {
  appointment_id: number;
  customer_id: number;
  vehicle_id: number;
  advisor_id?: number;
  scheduled_at: string;
  status: AppointmentStatus;
  service_type_id?: number;
  mileage_at_booking?: number;
  customer_notes?: string;
  advisor_notes?: string;
  // Joined fields
  customer_name?: string;
  customer_phone?: string;
  vehicle_description?: string;
  license_plate?: string;
  advisor_name?: string;
  service_name?: string;
  base_price?: number;
}

export type JobStatus = 'assigned' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';

export interface ServiceJob {
  job_id: number;
  appointment_id?: number;
  mechanic_id?: number;
  vehicle_id: number;
  status: JobStatus;
  odometer_in?: number;
  odometer_out?: number;
  started_at?: string;
  completed_at?: string;
  mongo_report_id?: string;
  internal_notes?: string;
  warranty_months?: number;
  // Joined fields
  customer_name?: string;
  customer_phone?: string;
  vehicle_description?: string;
  license_plate?: string;
  mechanic_name?: string;
  total_amount?: number;
  invoice_id?: number;
  invoice_status?: string;
}

export interface JobService {
  job_service_id: number;
  job_id: number;
  service_type_id: number;
  service_price: number;
  technician_notes?: string;
  service_name?: string;
}

export interface SparePart {
  part_id: number;
  part_number: string;
  part_name: string;
  description?: string;
  category?: string;
  brand?: string;
  unit_cost: number;
  selling_price: number;
  qty_in_stock: number;
  reorder_level: number;
  location_code?: string;
  is_active: number;
}

export interface PartUsage {
  usage_id: number;
  job_id: number;
  part_id: number;
  qty_used: number;
  unit_price_charged: number;
  used_at?: string;
  part_name?: string;
  part_number?: string;
}

export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'overdue' | 'cancelled';

export interface Invoice {
  invoice_id: number;
  job_id: number;
  customer_id: number;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  status: InvoiceStatus;
  due_date?: string;
  issued_at?: string;
  customer_name?: string;
  license_plate?: string;
  amount_paid?: number;
}

export interface InvoicePayment {
  payment_id: number;
  invoice_id: number;
  amount_paid: number;
  payment_method: 'cash' | 'card' | 'upi' | 'bank_transfer' | 'cheque' | 'other';
  reference_number?: string;
  paid_at?: string;
  recorded_by?: number;
  notes?: string;
  recorded_by_name?: string;
}

export interface MaintenanceReminder {
  reminder_id: number;
  vehicle_id: number;
  service_type_id?: number;
  reminder_type: 'date' | 'mileage' | 'interval';
  next_service_date?: string;
  next_service_odometer?: number;
  interval_km?: number;
  interval_days?: number;
  is_sent: number;
  is_active: number;
  created_by?: number;
  notification_channel?: 'sms' | 'email' | 'whatsapp';
  customer_name?: string;
  license_plate?: string;
  service_name?: string;
}

// MongoDB Repair Report
export interface FindingItem {
  system: string;
  condition: 'Good' | 'Fair' | 'Worn' | 'Damaged' | 'Critical';
  action_taken?: string;
  recommendation?: string;
}

export interface PartReplacedItem {
  part_id?: number;
  part_name: string;
  qty: number;
}

export interface MongoRepairReport {
  _id?: string;
  job_id: number;
  vehicle_id: number;
  mechanic_id: number;
  created_at: string;
  mileage_at_service?: number;
  customer_complaints?: string;
  inspection_summary?: string;
  findings: FindingItem[];
  parts_replaced: PartReplacedItem[];
  photo_urls?: string[];
  repair_summary?: string;
  next_service_recommendations?: string;
  test_drive_notes?: string;
  overall_health_score?: number;
}

