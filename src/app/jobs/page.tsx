'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  Wrench,
  Search,
  CheckCircle2,
  Play,
  PackagePlus,
  Receipt,
  ClipboardCheck,
  RefreshCw,
  AlertCircle,
  Clock,
  Car,
  UserCheck
} from 'lucide-react';

interface Job {
  job_id: number;
  appointment_id?: number;
  mechanic_id?: number;
  vehicle_id: number;
  status: string;
  odometer_in?: number;
  odometer_out?: number;
  started_at?: string;
  completed_at?: string;
  mongo_report_id?: string;
  internal_notes?: string;
  warranty_months?: number;
  mechanic_name?: string;
  customer_name: string;
  customer_phone: string;
  license_plate: string;
  vehicle_description: string;
  invoice_id?: number;
  total_amount?: number;
  invoice_status?: string;
}

export default function WorkshopJobsPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isPartsModalOpen, setIsPartsModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);

  // Part Allocation state
  const [jobParts, setJobParts] = useState<any[]>([]);
  const [availableParts, setAvailableParts] = useState<any[]>([]);
  const [selectedPartId, setSelectedPartId] = useState('');
  const [partQty, setPartQty] = useState('1');

  // Complete Job state
  const [odometerOut, setOdometerOut] = useState('');
  const [completionNotes, setCompletionNotes] = useState('');

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = statusFilter === 'all'
        ? '/api/jobs'
        : `/api/jobs?status=${encodeURIComponent(statusFilter)}`;
      const res = await fetch(url);
      const json = await res.json();
      if (res.ok && json.success) {
        setJobs(json.data.jobs || []);
      } else {
        setError(json.error?.message || 'Failed to fetch jobs');
      }
    } catch (err: any) {
      setError(err?.message || 'Error loading jobs');
    } finally {
      setLoading(false);
    }
  };

  const loadPartsInventory = async () => {
    try {
      const res = await fetch('/api/inventory?limit=100');
      if (res.ok) {
        const json = await res.json();
        setAvailableParts(json.data.parts || []);
        if (json.data.parts?.length > 0) {
          setSelectedPartId(String(json.data.parts[0].part_id));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchJobs();
    loadPartsInventory();
  }, [statusFilter]);

  const handleStartJob = async (jobId: number) => {
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'in_progress' }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setSuccessMsg(`Job #${jobId} status transitioned to In Progress`);
        fetchJobs();
      } else {
        setError(json.error?.message || 'Could not start job');
      }
    } catch (err: any) {
      setError(err?.message);
    }
  };

  const openCompleteModal = (job: Job) => {
    setSelectedJob(job);
    setOdometerOut(String(job.odometer_in ? job.odometer_in + 20 : 35000));
    setCompletionNotes(job.internal_notes || '');
    setIsCompleteModalOpen(true);
  };

  const handleCompleteJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;
    try {
      const res = await fetch(`/api/jobs/${selectedJob.job_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          odometer_out: Number(odometerOut),
          internal_notes: completionNotes,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setIsCompleteModalOpen(false);
        setSuccessMsg(`Job #${selectedJob.job_id} successfully marked COMPLETED! Ready for billing.`);
        fetchJobs();
      } else {
        setError(json.error?.message || 'Could not complete job');
      }
    } catch (err: any) {
      setError(err?.message);
    }
  };

  const openPartsModal = async (job: Job) => {
    setSelectedJob(job);
    setIsPartsModalOpen(true);
    try {
      const res = await fetch(`/api/jobs/${job.job_id}/parts`);
      if (res.ok) {
        const json = await res.json();
        setJobParts(json.data.parts || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAllocatePart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob || !selectedPartId) return;
    try {
      const res = await fetch(`/api/jobs/${selectedJob.job_id}/parts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          part_id: Number(selectedPartId),
          qty_used: Number(partQty),
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setSuccessMsg(`Part allocated! MySQL trigger trg_deduct_stock_on_part_usage deducted inventory.`);
        // Reload parts for this job
        const pRes = await fetch(`/api/jobs/${selectedJob.job_id}/parts`);
        if (pRes.ok) {
          const pJson = await pRes.json();
          setJobParts(pJson.data.parts || []);
        }
        loadPartsInventory();
      } else {
        setError(json.error?.message || 'Could not allocate part');
      }
    } catch (err: any) {
      setError(err?.message);
    }
  };

  const handleGenerateInvoice = async (jobId: number) => {
    if (!confirm(`Generate billing invoice for Completed Job #${jobId}?`)) return;
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: jobId,
          tax_rate: 18.0,
          discount_amount: 0.0,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setSuccessMsg(`Invoice #${json.data.invoice.invoice_id} generated via Stored Procedure sp_generate_invoice!`);
        fetchJobs();
      } else {
        setError(json.error?.message || 'Could not generate invoice');
      }
    } catch (err: any) {
      setError(err?.message);
    }
  };

  const filteredJobs = jobs.filter((j) => {
    const q = searchTerm.toLowerCase();
    return (
      j.customer_name?.toLowerCase().includes(q) ||
      j.license_plate?.toLowerCase().includes(q) ||
      j.mechanic_name?.toLowerCase().includes(q) ||
      String(j.job_id).includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Workshop Bay & Service Jobs
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track technician execution, allocate spare parts with trigger-based stock deduction, and generate invoices.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchJobs}
            disabled={loading}
            className="p-2 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
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
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0">
          {['all', 'assigned', 'in_progress', 'completed', 'cancelled'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition ${
                statusFilter === tab
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search job ID, mechanic, plate..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* Jobs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
            Loading workshop bay jobs...
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No service jobs found matching the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Job ID</th>
                  <th className="py-3 px-4">Vehicle & Customer</th>
                  <th className="py-3 px-4">Assigned Mechanic</th>
                  <th className="py-3 px-4">Status & Timeline</th>
                  <th className="py-3 px-4">Diagnostic & Parts</th>
                  <th className="py-3 px-4 text-right">Bay Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredJobs.map((job) => (
                  <tr key={job.job_id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">Job #{job.job_id}</div>
                      {job.appointment_id && (
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Appt #{job.appointment_id}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-mono font-semibold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded inline-block">
                        {job.license_plate}
                      </div>
                      <div className="text-slate-700 font-medium text-[11px] mt-0.5">
                        {job.customer_name}
                      </div>
                      <div className="text-slate-400 text-[10px]">
                        {job.vehicle_description}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-1.5 text-slate-800 font-medium">
                        <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                        <span>{job.mechanic_name || 'Unassigned'}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        In: {job.odometer_in ? `${job.odometer_in} km` : 'N/A'} &bull; Out: {job.odometer_out ? `${job.odometer_out} km` : 'Pending'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="mb-1">
                        <Badge status={job.status} size="sm" />
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>
                          {job.started_at
                            ? `Started ${new Date(job.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                            : 'Not started'}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        {/* Part allocation button */}
                        <button
                          onClick={() => openPartsModal(job)}
                          className="px-2 py-0.5 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded flex items-center space-x-1 transition"
                        >
                          <PackagePlus className="w-3 h-3 text-slate-500" />
                          <span>Parts Used</span>
                        </button>

                        {/* MongoDB Inspection link */}
                        {job.mongo_report_id ? (
                          <Link
                            href={`/reports?job_id=${job.job_id}`}
                            className="text-[11px] font-semibold text-emerald-600 hover:underline flex items-center space-x-1"
                          >
                            <ClipboardCheck className="w-3 h-3" />
                            <span>MongoDB Report Linked</span>
                          </Link>
                        ) : (
                          <Link
                            href={`/reports?create_job_id=${job.job_id}&vehicle_id=${job.vehicle_id}`}
                            className="text-[11px] font-semibold text-blue-600 hover:underline flex items-center space-x-1"
                          >
                            <ClipboardCheck className="w-3 h-3" />
                            <span>+ Attach Inspection</span>
                          </Link>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {/* Transition: Start */}
                        {job.status === 'assigned' && (
                          <button
                            onClick={() => handleStartJob(job.job_id)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded flex items-center space-x-1 transition"
                          >
                            <Play className="w-3 h-3" />
                            <span>Start Work</span>
                          </button>
                        )}

                        {/* Transition: Complete */}
                        {job.status === 'in_progress' && (
                          <button
                            onClick={() => openCompleteModal(job)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded flex items-center space-x-1 transition"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Complete Job</span>
                          </button>
                        )}

                        {/* Stored Procedure: Generate Invoice */}
                        {job.status === 'completed' && user?.role !== 'mechanic' && (
                          job.invoice_id ? (
                            <Link
                              href="/invoices"
                              className="px-2 py-1 text-[11px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 rounded hover:bg-purple-100 transition"
                            >
                              Invoice #{job.invoice_id}
                            </Link>
                          ) : (
                            <button
                              onClick={() => handleGenerateInvoice(job.job_id)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded flex items-center space-x-1 transition"
                            >
                              <Receipt className="w-3 h-3" />
                              <span>Bill Invoice</span>
                            </button>
                          )
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

      {/* Modal: Part Allocation */}
      <Modal
        isOpen={isPartsModalOpen}
        onClose={() => setIsPartsModalOpen(false)}
        title={`Part Allocation — Job #${selectedJob?.job_id}`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4 text-xs">
          {/* Allocated Parts List */}
          <div>
            <h4 className="font-bold text-slate-800 mb-2">Allocated Spare Parts for this Job</h4>
            {jobParts.length === 0 ? (
              <p className="text-slate-400 italic">No parts charged to this job yet.</p>
            ) : (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Part No & Name</th>
                      <th className="py-2 px-3">Qty Used</th>
                      <th className="py-2 px-3">Unit Price</th>
                      <th className="py-2 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {jobParts.map((p) => (
                      <tr key={p.usage_id}>
                        <td className="py-2 px-3">
                          <span className="font-semibold text-slate-900">{p.part_name}</span>
                          <span className="text-slate-400 font-mono ml-1.5">({p.part_number})</span>
                        </td>
                        <td className="py-2 px-3 font-semibold">{p.qty_used}</td>
                        <td className="py-2 px-3">₹{Number(p.unit_price_charged).toLocaleString('en-IN')}</td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">
                          ₹{(Number(p.qty_used) * Number(p.unit_price_charged)).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Form to allocate new part */}
          <form onSubmit={handleAllocatePart} className="pt-3 border-t border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-800">Deduct & Allocate Part from Inventory</h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Select Spare Part</label>
                <select
                  value={selectedPartId}
                  onChange={(e) => setSelectedPartId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  {availableParts.map((part) => (
                    <option key={part.part_id} value={part.part_id}>
                      {part.part_name} ({part.part_number}) — ₹{part.selling_price} (Stock: {part.qty_in_stock})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={partQty}
                  onChange={(e) => setPartQty(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800">
              <strong>Database Trigger:</strong> Submitting this calls <code className="font-mono">POST /api/jobs/[id]/parts</code> which fires MySQL trigger <code className="font-mono">trg_deduct_stock_on_part_usage</code> to automatically decrement stock.
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsPartsModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Close
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold"
              >
                Allocate & Deduct Stock
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Modal: Complete Job */}
      <Modal
        isOpen={isCompleteModalOpen}
        onClose={() => setIsCompleteModalOpen(false)}
        title={`Complete Workshop Job #${selectedJob?.job_id}`}
      >
        <form onSubmit={handleCompleteJob} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Odometer Reading Out (km) *</label>
            <input
              type="number"
              required
              value={odometerOut}
              onChange={(e) => setOdometerOut(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
            />
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Must be &ge; Odometer In ({selectedJob?.odometer_in || 0} km).
            </span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Mechanic Completion Summary & Internal Notes</label>
            <textarea
              rows={3}
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              placeholder="e.g. Brake pads replaced, rotors resurfaced, test drive verified smooth braking with zero shudder."
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCompleteModalOpen(false)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg font-semibold"
            >
              Mark Job Completed
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

