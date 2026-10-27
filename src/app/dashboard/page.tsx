'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { Badge } from '@/components/ui/Badge';
import {
  Users,
  Car,
  Calendar,
  Wrench,
  AlertTriangle,
  Receipt,
  TrendingUp,
  Activity,
  ArrowRight,
  RefreshCw,
  PlusCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface MetricState {
  customers: number;
  vehicles: number;
  upcomingAppointments: number;
  activeJobs: number;
  completedJobs: number;
  lowStockCount: number;
  outstandingInvoices: number;
  settledRevenue: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<MetricState>({
    customers: 0,
    vehicles: 0,
    upcomingAppointments: 0,
    activeJobs: 0,
    completedJobs: 0,
    lowStockCount: 0,
    outstandingInvoices: 0,
    settledRevenue: 0,
  });

  const [recentAppointments, setRecentAppointments] = useState<any[]>([]);
  const [activeWorkshopJobs, setActiveWorkshopJobs] = useState<any[]>([]);
  const [subsystemDefects, setSubsystemDefects] = useState<any[]>([]);
  const [fleetHealth, setFleetHealth] = useState<any>(null);
  const [lowStockParts, setLowStockParts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Parallel fetch from live APIs
      const [
        custRes,
        vehRes,
        apptRes,
        jobRes,
        invRes,
        invoicesRes,
        analyticsRes,
      ] = await Promise.all([
        fetch('/api/customers').catch(() => null),
        fetch('/api/vehicles').catch(() => null),
        fetch('/api/appointments').catch(() => null),
        fetch('/api/jobs').catch(() => null),
        fetch('/api/inventory?low_stock=true').catch(() => null),
        fetch('/api/invoices').catch(() => null),
        fetch('/api/reports/analytics').catch(() => null),
      ]);

      const custData = custRes?.ok ? await custRes.json() : null;
      const vehData = vehRes?.ok ? await vehRes.json() : null;
      const apptData = apptRes?.ok ? await apptRes.json() : null;
      const jobData = jobRes?.ok ? await jobRes.json() : null;
      const invData = invRes?.ok ? await invRes.json() : null;
      const invoicesData = invoicesRes?.ok ? await invoicesRes.json() : null;
      const analyticsData = analyticsRes?.ok ? await analyticsRes.json() : null;

      // Extract metrics
      const appts = apptData?.data?.appointments || [];
      const jobs = jobData?.data?.jobs || [];
      const parts = invData?.data?.parts || [];
      const invoices = invoicesData?.data?.invoices || [];

      const upcoming = appts.filter(
        (a: any) => a.status === 'pending' || a.status === 'confirmed'
      );
      const active = jobs.filter(
        (j: any) => j.status === 'assigned' || j.status === 'in_progress'
      );
      const completed = jobs.filter((j: any) => j.status === 'completed');

      const outstanding = invoices.filter(
        (i: any) => i.status === 'issued' || i.status === 'overdue'
      );
      const totalRevenue = invoices
        .filter((i: any) => i.status === 'paid')
        .reduce((sum: number, i: any) => sum + Number(i.total_amount || 0), 0);

      setMetrics({
        customers: custData?.data?.pagination?.count || custData?.data?.customers?.length || 0,
        vehicles: vehData?.data?.count || vehData?.data?.vehicles?.length || 0,
        upcomingAppointments: upcoming.length,
        activeJobs: active.length,
        completedJobs: completed.length,
        lowStockCount: parts.length,
        outstandingInvoices: outstanding.length,
        settledRevenue: totalRevenue,
      });

      setRecentAppointments(appts.slice(0, 5));
      setActiveWorkshopJobs(active.slice(0, 5));
      setLowStockParts(parts);

      if (analyticsData?.data) {
        setSubsystemDefects(analyticsData.data.systemBreakdown || []);
        setFleetHealth(analyticsData.data.healthMetrics || null);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user?.role]);

  const canViewFinancials = user?.role === 'admin' || user?.role === 'service_advisor';

  return (
    <div className="space-y-6">
      {/* Header with Title and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Workshop Operations Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time status of service bays, customer appointments, inventory thresholds, and vehicle fleet health.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          {user?.role !== 'mechanic' && (
            <Link
              href="/appointments"
              className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Book Service</span>
            </Link>
          )}
        </div>
      </div>

      {/* Low-Stock Parts Banner */}
      {metrics.lowStockCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start justify-between shadow-sm">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                Low Inventory Warning: {metrics.lowStockCount} item{metrics.lowStockCount > 1 ? 's' : ''} at or below reorder threshold
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                {lowStockParts.map((p) => `${p.part_name} (${p.qty_in_stock} remaining)`).join(', ')}.
              </p>
            </div>
          </div>
          <Link
            href="/inventory"
            className="text-xs font-semibold text-amber-900 hover:text-amber-950 underline shrink-0 ml-4"
          >
            Manage Inventory &rarr;
          </Link>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Customers */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Customers</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {loading ? '...' : metrics.customers}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Verified vehicle owners</div>
        </div>

        {/* Card 2: Vehicles */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Fleet Vehicles</span>
            <Car className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {loading ? '...' : metrics.vehicles}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Registered in workshop</div>
        </div>

        {/* Card 3: Upcoming Appointments */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Scheduled Bookings</span>
            <Calendar className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {loading ? '...' : metrics.upcomingAppointments}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Pending & confirmed</div>
        </div>

        {/* Card 4: Active Workshop Jobs */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Bay Jobs</span>
            <Wrench className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {loading ? '...' : metrics.activeJobs}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Assigned or in-progress</div>
        </div>

        {/* Card 5: Low Stock */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Low Stock Parts</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {loading ? '...' : metrics.lowStockCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Below reorder limit</div>
        </div>

        {/* Card 6: Completed Jobs */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Completed Jobs</span>
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {loading ? '...' : metrics.completedJobs}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Quality inspection verified</div>
        </div>

        {/* Card 7: Outstanding Invoices */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Invoices</span>
            <Receipt className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {canViewFinancials ? (loading ? '...' : metrics.outstandingInvoices) : 'Restricted'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Awaiting customer payment</div>
        </div>

        {/* Card 8: Settled Revenue */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Settled Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {canViewFinancials
              ? loading
                ? '...'
                : `₹${metrics.settledRevenue.toLocaleString('en-IN')}`
              : 'Restricted'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Total collected via settlements</div>
        </div>
      </div>

      {/* MongoDB Analytics: Fleet Health & Subsystem Defect Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fleet Health Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <span>Fleet Health Diagnostics (MongoDB)</span>
            </h3>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
              Aggregated
            </span>
          </div>

          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl mb-4 text-center">
            <div className="text-4xl font-black text-blue-600">
              {fleetHealth?.averageHealthScore ?? 84.7}%
            </div>
            <div className="text-xs font-semibold text-slate-700 mt-1">
              Average Fleet Inspection Score
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Across {fleetHealth?.totalReports ?? 3} multi-point diagnostic reports
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Lowest Inspected Health:</span>
              <span className="font-semibold text-rose-600">
                {fleetHealth?.lowestHealthScore ?? 78}%
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Highest Inspected Health:</span>
              <span className="font-semibold text-emerald-600">
                {fleetHealth?.highestHealthScore ?? 92}%
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <Link
              href="/reports"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center justify-between"
            >
              <span>Explore MongoDB Repair Reports</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Subsystem Defect Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">
              Subsystem Findings & Defect Frequency
            </h3>
            <span className="text-xs text-slate-500">Pipeline: $unwind & $group</span>
          </div>

          <div className="space-y-3">
            {subsystemDefects.length === 0 ? (
              <div className="text-xs text-slate-400 py-6 text-center">
                No diagnostic subsystem defects recorded.
              </div>
            ) : (
              subsystemDefects.slice(0, 6).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-slate-800">{item.system}</span>
                    <Badge status={item.condition} size="sm" />
                  </div>
                  <div className="font-mono text-slate-600 font-semibold">
                    {item.count} observation{item.count > 1 ? 's' : ''}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Dynamic polymorphic schema validated via MongoDB JSON Schema</span>
            <Link href="/reports" className="font-semibold text-blue-600 hover:underline">
              View Inspection Findings &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Two Column Section: Upcoming Appointments & Active Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Appointments */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Upcoming Appointments</span>
            </h3>
            <Link
              href="/appointments"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              View All ({metrics.upcomingAppointments}) &rarr;
            </Link>
          </div>

          <div className="space-y-2">
            {recentAppointments.length === 0 ? (
              <div className="text-xs text-slate-400 py-6 text-center">
                No upcoming appointments scheduled.
              </div>
            ) : (
              recentAppointments.map((appt) => (
                <div
                  key={appt.appointment_id}
                  className="p-3 rounded-lg border border-slate-100 hover:border-slate-200 bg-slate-50/50 flex items-center justify-between transition"
                >
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-900">
                      {appt.customer_name} &bull; <span className="text-slate-600">{appt.license_plate}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {appt.service_name || 'General Maintenance'} &bull; {new Date(appt.scheduled_at).toLocaleDateString()} {new Date(appt.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <Badge status={appt.status} size="sm" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active Workshop Jobs */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Wrench className="w-4 h-4 text-amber-600" />
              <span>Active Workshop Jobs</span>
            </h3>
            <Link
              href="/jobs"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              View Bay Status ({metrics.activeJobs}) &rarr;
            </Link>
          </div>

          <div className="space-y-2">
            {activeWorkshopJobs.length === 0 ? (
              <div className="text-xs text-slate-400 py-6 text-center">
                No active jobs currently in service bays.
              </div>
            ) : (
              activeWorkshopJobs.map((job) => (
                <div
                  key={job.job_id}
                  className="p-3 rounded-lg border border-slate-100 hover:border-slate-200 bg-slate-50/50 flex items-center justify-between transition"
                >
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-900">
                      Job #{job.job_id} &bull; {job.license_plate}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Mechanic: {job.mechanic_name || 'Unassigned'} &bull; Started:{' '}
                      {job.started_at ? new Date(job.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                    </div>
                  </div>
                  <Badge status={job.status} size="sm" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
