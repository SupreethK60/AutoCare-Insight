import mysql from 'mysql2/promise';
import {
  initialUsers, initialCustomers, initialCatalogue, initialCustomerVehicles,
  initialServiceTypes, initialAppointments, initialServiceJobs, initialSpareParts,
  initialPartUsage, initialInvoices, initialPayments, initialReminders
} from './seed-data';

let pool: mysql.Pool | null = null;
let isMySqlAvailable = true;

export function getMySqlPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST || 'localhost',
      port: Number(process.env.MYSQL_PORT) || 3306,
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || 'root',
      database: process.env.MYSQL_DATABASE || 'autocare_insight',
      waitForConnections: true,
      connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT) || 10,
      queueLimit: 0,
    });
  }
  return pool;
}

// In-memory fallback state to preserve changes during development / offline demonstration
const fallbackState = {
  users: [...initialUsers],
  customers: [...initialCustomers],
  catalogue: [...initialCatalogue],
  vehicles: [...initialCustomerVehicles],
  serviceTypes: [...initialServiceTypes],
  appointments: [...initialAppointments],
  jobs: [...initialServiceJobs],
  spareParts: [...initialSpareParts],
  partUsage: [...initialPartUsage],
  invoices: [...initialInvoices],
  payments: [...initialPayments],
  reminders: [...initialReminders]
};

export async function query<T = any>(sql: string, params: any[] = []): Promise<T> {
  if (isMySqlAvailable) {
    try {
      const p = getMySqlPool();
      const [rows] = await p.execute(sql, params);
      return rows as T;
    } catch (err: any) {
      // If server is not reachable, switch to fallback seamlessly
      if (err.code === 'ECONNREFUSED' || err.code === 'ER_ACCESS_DENIED_ERROR' || err.code === 'ENOTFOUND') {
        console.warn(`[AutoCare Insight MySQL] Host unavailable (${err.message}). Using resilient data provider.`);
        isMySqlAvailable = false;
      } else {
        throw err;
      }
    }
  }

  // Fallback simulator for common queries if MySQL service is offline
  return executeFallbackQuery<T>(sql, params);
}

function executeFallbackQuery<T>(sql: string, params: any[]): T {
  const upper = sql.trim().toUpperCase();

  // Basic table select matching
  if (upper.includes('FROM VW_SERVICE_SUMMARY') || upper.includes('FROM SERVICE_JOBS')) {
    return fallbackState.jobs as unknown as T;
  }
  if (upper.includes('FROM CUSTOMERS')) {
    return fallbackState.customers as unknown as T;
  }
  if (upper.includes('FROM VEHICLE_CATALOGUE')) {
    return fallbackState.catalogue as unknown as T;
  }
  if (upper.includes('FROM CUSTOMER_VEHICLES')) {
    return fallbackState.vehicles as unknown as T;
  }
  if (upper.includes('FROM APPOINTMENTS')) {
    return fallbackState.appointments as unknown as T;
  }
  if (upper.includes('FROM SPARE_PARTS')) {
    return fallbackState.spareParts as unknown as T;
  }
  if (upper.includes('FROM INVOICES')) {
    return fallbackState.invoices as unknown as T;
  }
  if (upper.includes('FROM INVOICE_PAYMENTS')) {
    return fallbackState.payments as unknown as T;
  }
  if (upper.includes('FROM MAINTENANCE_REMINDERS')) {
    return fallbackState.reminders as unknown as T;
  }
  if (upper.includes('FROM SERVICE_TYPES')) {
    return fallbackState.serviceTypes as unknown as T;
  }
  if (upper.includes('FROM USERS')) {
    return fallbackState.users as unknown as T;
  }

  return [] as unknown as T;
}

export function getFallbackState() {
  return fallbackState;
}

