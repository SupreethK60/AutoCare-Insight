'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  Calendar,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Clock,
  XCircle,
  Wrench,
  AlertCircle,
  RefreshCw,
  Phone,
  Car
} from 'lucide-react';

interface Appointment {
  appointment_id: number;
  customer_id: number;
  vehicle_id: number;
  advisor_id: number;
  scheduled_at: string;
  status: string;
  service_type_id?: number;
  mileage_at_booking?: number;
  customer_notes?: string;
  advisor_notes?: string;
  customer_name: string;
  customer_phone: string;
  license_plate: string;
  vehicle_description: string;
  advisor_name?: string;
  service_name?: string;
  base_price?: number;
}

export default function AppointmentsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal states
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isStartJobModalOpen, setIsStartJobModalOpen] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);

  // Form states for booking
  const [customers, setCustomers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    customer_id: '',
    vehicle_id: '',
    service_type_id: '1',
    scheduled_at: '',
    mileage_at_booking: '',
    customer_notes: '',
  });

  // Reschedule state
  const [newScheduleDate, setNewScheduleDate] = useState('');

  // Start Job state
  const [jobMechanics, setJobMechanics] = useState<any[]>([]);
  const [selectedMechanicId, setSelectedMechanicId] = useState('');
  const [odometerIn, setOdometerIn] = useState('');

  const fetchAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = statusFilter === 'all'
        ? '/api/appointments'
        : `/api/appointments?status=${encodeURIComponent(statusFilter)}`;
      const res = await fetch(url);
      const json = await res.json();
      if (res.ok && json.success) {
        setAppointments(json.data.appointments || []);
      } else {
        setError(json.error?.message || 'Failed to load appointments');
      }
    } catch (err: any) {
      setError(err?.message || 'Error fetching appointments');
    } finally {
      setLoading(false);
    }
  };

  const loadBookingPrerequisites = async () => {
    try {
      const [custRes, vehRes, usersRes] = await Promise.all([
        fetch('/api/customers?limit=100'),
        fetch('/api/vehicles?limit=100'),
        fetch('/api/users'),
      ]);
      if (custRes.ok) {
        const cData = await custRes.json();
        setCustomers(cData.data?.customers || []);
      }
      if (vehRes.ok) {
        const vData = await vehRes.json();
        setVehicles(vData.data?.vehicles || []);
      }
      if (usersRes.ok) {
        const uData = await usersRes.json();
        const mechs = (uData.data?.users || []).filter((u: any) => u.role === 'mechanic');
        setJobMechanics(mechs);
        if (mechs.length > 0) setSelectedMechanicId(String(mechs[0].user_id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAppointments();
    loadBookingPrerequisites();
  }, [statusFilter]);

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: Number(formData.customer_id),
          vehicle_id: Number(formData.vehicle_id),
          service_type_id: Number(formData.service_type_id),
          scheduled_at: formData.scheduled_at,
          mileage_at_booking: formData.mileage_at_booking ? Number(formData.mileage_at_booking) : undefined,
          customer_notes: formData.customer_notes,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setIsBookModalOpen(false);
        setSuccessMsg(`Appointment #${json.data.appointment_id} booked successfully via MySQL Stored Procedure!`);
        fetchAppointments();
      } else {
        setError(json.error?.message || 'Booking failed');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to submit appointment');
    }
  };

  const handleConfirm = async (apptId: number) => {
    try {
      const res = await fetch(`/api/appointments/${apptId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'confirmed' }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setSuccessMsg(`Appointment #${apptId} confirmed!`);
        fetchAppointments();
      } else {
        setError(json.error?.message || 'Could not confirm appointment');
      }
    } catch (err: any) {
      setError(err?.message);
    }
  };

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppt || !newScheduleDate) return;
    try {
      const res = await fetch(`/api/appointments/${selectedAppt.appointment_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduled_at: newScheduleDate }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setIsRescheduleOpen(false);
        setSuccessMsg(`Appointment #${selectedAppt.appointment_id} rescheduled to ${new Date(newScheduleDate).toLocaleString()}!`);
        fetchAppointments();
      } else {
        setError(json.error?.message || 'Could not reschedule');
      }
    } catch (err: any) {
      setError(err?.message);
    }
  };

  const handleCancel = async (apptId: number) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      const res = await fetch(`/api/appointments/${apptId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setSuccessMsg(`Appointment #${apptId} cancelled`);
        fetchAppointments();
      } else {
        setError(json.error?.message || 'Could not cancel appointment');
      }
    } catch (err: any) {
      setError(err?.message);
    }
  };

  const handleStartJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppt) return;
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointment_id: selectedAppt.appointment_id,
          vehicle_id: selectedAppt.vehicle_id,
          mechanic_id: Number(selectedMechanicId),
          odometer_in: odometerIn ? Number(odometerIn) : selectedAppt.mileage_at_booking || 25000,
          internal_notes: `Initiated from confirmed appointment #${selectedAppt.appointment_id}`,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setIsStartJobModalOpen(false);
        setSuccessMsg(`Workshop Job #${json.data.job.job_id} dispatched to mechanic bay!`);
        fetchAppointments();
      } else {
        setError(json.error?.message || 'Could not start workshop job');
      }
    } catch (err: any) {
      setError(err?.message);
    }
  };

  // Filtered by search term
  const filteredAppointments = appointments.filter((a) => {
    const q = searchTerm.toLowerCase();
    return (
      a.customer_name?.toLowerCase().includes(q) ||
      a.license_plate?.toLowerCase().includes(q) ||
      a.service_name?.toLowerCase().includes(q) ||
      String(a.appointment_id).includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Service Appointments
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Schedule customer vehicle intake, allocate service advisors, and dispatch jobs to mechanics.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchAppointments}
            disabled={loading}
            className="p-2 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {user?.role !== 'mechanic' && (
            <button
              onClick={() => {
                setError(null);
                setIsBookModalOpen(true);
              }}
              className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Book Appointment</span>
            </button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="font-bold ml-2">✕</button>
        </div>
      )}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="font-bold ml-2">✕</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        {/* Status filter tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0">
          {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition ${
                statusFilter === tab
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search customer, plate, ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Appointments List / Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
            Loading appointments from MySQL...
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No appointments found matching current criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">ID & Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Vehicle</th>
                  <th className="py-3 px-4">Service Required</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAppointments.map((appt) => (
                  <tr key={appt.appointment_id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">#{appt.appointment_id}</div>
                      <div className="text-slate-500 text-[11px] flex items-center space-x-1 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>
                          {new Date(appt.scheduled_at).toLocaleDateString()} {new Date(appt.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{appt.customer_name}</div>
                      <div className="text-slate-500 text-[11px] flex items-center space-x-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{appt.customer_phone}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-semibold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded inline-block">
                        {appt.license_plate}
                      </div>
                      <div className="text-slate-500 text-[11px] mt-0.5 truncate max-w-[200px]">
                        {appt.vehicle_description}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">
                        {appt.service_name || 'Standard Inspection'}
                      </div>
                      <div className="text-emerald-700 font-semibold text-[11px] mt-0.5">
                        Base: ₹{appt.base_price?.toLocaleString('en-IN') || '1,500'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={appt.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {appt.status === 'pending' && user?.role !== 'mechanic' && (
                          <button
                            onClick={() => handleConfirm(appt.appointment_id)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition"
                            title="Confirm Booking"
                          >
                            Confirm
                          </button>
                        )}
                        {appt.status === 'confirmed' && (
                          <button
                            onClick={() => {
                              setSelectedAppt(appt);
                              setOdometerIn(String(appt.mileage_at_booking || ''));
                              setIsStartJobModalOpen(true);
                            }}
                            className="px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded flex items-center space-x-1 transition"
                            title="Dispatch to Service Bay"
                          >
                            <Wrench className="w-3 h-3" />
                            <span>Create Job</span>
                          </button>
                        )}
                        {['pending', 'confirmed'].includes(appt.status) && user?.role !== 'mechanic' && (
                          <button
                            onClick={() => {
                              setSelectedAppt(appt);
                              setNewScheduleDate(appt.scheduled_at.slice(0, 16));
                              setIsRescheduleOpen(true);
                            }}
                            className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded transition"
                          >
                            Reschedule
                          </button>
                        )}
                        {['pending', 'confirmed'].includes(appt.status) && user?.role !== 'mechanic' && (
                          <button
                            onClick={() => handleCancel(appt.appointment_id)}
                            className="px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 rounded transition"
                            title="Cancel Booking"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Book Appointment */}
      <Modal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        title="Book New Service Appointment"
      >
        <form onSubmit={handleBookSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Customer *</label>
            <select
              required
              value={formData.customer_id}
              onChange={(e) => {
                const cid = e.target.value;
                setFormData({ ...formData, customer_id: cid, vehicle_id: '' });
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">-- Choose registered customer --</option>
              {customers.map((c) => (
                <option key={c.customer_id} value={c.customer_id}>
                  {c.full_name} ({c.phone})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Customer Vehicle *</label>
            <select
              required
              value={formData.vehicle_id}
              onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">-- Choose vehicle --</option>
              {vehicles
                .filter((v) => !formData.customer_id || String(v.customer_id) === formData.customer_id)
                .map((v) => (
                  <option key={v.vehicle_id} value={v.vehicle_id}>
                    {v.license_plate} — {v.manufacturer} {v.model} ({v.current_odometer} km)
                  </option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Service Type</label>
              <select
                value={formData.service_type_id}
                onChange={(e) => setFormData({ ...formData, service_type_id: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="1">Routine Inspection & Service</option>
                <option value="2">Oil & Filter Change</option>
                <option value="3">Brake System Overhaul</option>
                <option value="4">Battery & Electrical Diagnostic</option>
                <option value="5">Tire Rotation & Wheel Alignment</option>
                <option value="6">Air Conditioning & HVAC Service</option>
                <option value="7">Comprehensive Diagnostic Scan</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Current Odometer (km)</label>
              <input
                type="number"
                placeholder="e.g. 35000"
                value={formData.mileage_at_booking}
                onChange={(e) => setFormData({ ...formData, mileage_at_booking: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Scheduled Date & Time *</label>
            <input
              type="datetime-local"
              required
              value={formData.scheduled_at}
              onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Customer Reported Issue / Notes</label>
            <textarea
              rows={3}
              placeholder="e.g. Brake pedal pulsation and ABS light occasionally turning on"
              value={formData.customer_notes}
              onChange={(e) => setFormData({ ...formData, customer_notes: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-[11px] text-blue-700">
            <strong>Stored Procedure Integration:</strong> This triggers MySQL <code className="font-mono">sp_book_appointment</code> which verifies no conflicting active appointment exists for the same vehicle before committing.
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsBookModalOpen(false)}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
            >
              Confirm Booking
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Reschedule */}
      <Modal
        isOpen={isRescheduleOpen}
        onClose={() => setIsRescheduleOpen(false)}
        title={`Reschedule Appointment #${selectedAppt?.appointment_id}`}
      >
        <form onSubmit={handleReschedule} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">New Appointment Date & Time *</label>
            <input
              type="datetime-local"
              required
              value={newScheduleDate}
              onChange={(e) => setNewScheduleDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsRescheduleOpen(false)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              Save New Date
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Start Workshop Job */}
      <Modal
        isOpen={isStartJobModalOpen}
        onClose={() => setIsStartJobModalOpen(false)}
        title={`Dispatch Job for Appt #${selectedAppt?.appointment_id}`}
      >
        <form onSubmit={handleStartJob} className="space-y-4 text-xs">
          <div>
            <div className="text-slate-600 mb-2">
              Vehicle: <strong>{selectedAppt?.license_plate}</strong> ({selectedAppt?.vehicle_description})
            </div>
            <div className="text-slate-600 mb-4">
              Service: <strong>{selectedAppt?.service_name}</strong>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Assign Mechanic *</label>
            <select
              value={selectedMechanicId}
              onChange={(e) => setSelectedMechanicId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
            >
              {jobMechanics.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.full_name} ({m.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Odometer Reading In (km)</label>
            <input
              type="number"
              value={odometerIn}
              onChange={(e) => setOdometerIn(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsStartJobModalOpen(false)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center space-x-1"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Create Service Job</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
