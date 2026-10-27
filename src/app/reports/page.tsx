'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  ClipboardCheck,
  Plus,
  Search,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  FileText,
  RefreshCw,
  Sliders,
  DollarSign
} from 'lucide-react';

interface Finding {
  system: string;
  condition: 'Good' | 'Fair' | 'Worn' | 'Damaged' | 'Critical';
  finding: string;
  action_recommended?: string;
  cost_estimate?: number;
}

interface RepairReport {
  _id: string;
  job_id: number;
  vehicle_id: number;
  mechanic_id: number;
  overall_health_score: number;
  diagnostic_codes?: string[];
  findings: Finding[];
  technician_notes?: string;
  recommendations?: string[];
  created_at: string;
}

const SUBSYSTEM_OPTIONS = [
  'Engine',
  'Transmission',
  'Brakes',
  'Suspension',
  'Electrical',
  'Tyres',
  'Exhaust',
  'Steering',
  'Cooling',
  'Battery / EV Drivetrain'
];

function RepairReportsContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const prefillJobId = searchParams.get('create_job_id');
  const prefillVehicleId = searchParams.get('vehicle_id');
  const filterJobId = searchParams.get('job_id');

  const [reports, setReports] = useState<RepairReport[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<RepairReport | null>(null);

  // Create form state
  const [createForm, setCreateForm] = useState<{
    job_id: string;
    vehicle_id: string;
    overall_health_score: number;
    dtc_input: string;
    technician_notes: string;
    findings: Finding[];
  }>({
    job_id: prefillJobId || '',
    vehicle_id: prefillVehicleId || '',
    overall_health_score: 85,
    dtc_input: '',
    technician_notes: '',
    findings: [
      {
        system: 'Brakes',
        condition: 'Good',
        finding: 'Brake pads measured at 8mm thickness. Rotors within factory tolerance.',
        action_recommended: 'Next inspection in 10,000 km',
        cost_estimate: 0
      }
    ]
  });

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = filterJobId ? `/api/reports?job_id=${filterJobId}` : '/api/reports';
      const [reportsRes, analyticsRes] = await Promise.all([
        fetch(url),
        fetch('/api/reports/analytics')
      ]);

      if (reportsRes.ok) {
        const json = await reportsRes.json();
        setReports(json.data.reports || []);
      }
      if (analyticsRes.ok) {
        const aJson = await analyticsRes.json();
        setAnalytics(aJson.data);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load MongoDB inspection reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    if (prefillJobId) {
      setCreateForm((prev) => ({
        ...prev,
        job_id: prefillJobId,
        vehicle_id: prefillVehicleId || ''
      }));
      setIsCreateModalOpen(true);
    }
  }, [filterJobId, prefillJobId]);

  const addFindingRow = () => {
    setCreateForm((prev) => ({
      ...prev,
      findings: [
        ...prev.findings,
        {
          system: 'Suspension',
          condition: 'Fair',
          finding: '',
          action_recommended: '',
          cost_estimate: 0
        }
      ]
    }));
  };

  const removeFindingRow = (idx: number) => {
    setCreateForm((prev) => ({
      ...prev,
      findings: prev.findings.filter((_, i) => i !== idx)
    }));
  };

  const updateFindingRow = (idx: number, field: keyof Finding, val: any) => {
    setCreateForm((prev) => {
      const copy = [...prev.findings];
      copy[idx] = { ...copy[idx], [field]: val };
      return { ...prev, findings: copy };
    });
  };

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate findings
    if (createForm.findings.length === 0) {
      setError('Please add at least one subsystem finding');
      return;
    }

    const dtcs = createForm.dtc_input
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: Number(createForm.job_id),
          vehicle_id: Number(createForm.vehicle_id),
          overall_health_score: Number(createForm.overall_health_score),
          diagnostic_codes: dtcs,
          findings: createForm.findings,
          technician_notes: createForm.technician_notes,
          recommendations: ['Perform periodic service at scheduled interval'],
          created_at: new Date().toISOString()
        })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setIsCreateModalOpen(false);
        setSuccessMsg(`MongoDB Inspection Report created! Cross-linked with MySQL Job #${createForm.job_id}.`);
        fetchReports();
      } else {
        setError(json.error?.message || 'Report creation failed validation');
      }
    } catch (err: any) {
      setError(err?.message);
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 85) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (score >= 70) return 'text-blue-700 bg-blue-50 border-blue-200';
    if (score >= 50) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-rose-700 bg-rose-50 border-rose-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Diagnostic & Repair Reports
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            MongoDB document store containing multi-point vehicle inspection findings, DTC fault codes, and health scores.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchReports}
            disabled={loading}
            className="p-2 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => {
              setError(null);
              setIsCreateModalOpen(true);
            }}
            className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Inspection Report</span>
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

      {/* Analytics Summary Banner */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Reports</span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {analytics.healthMetrics?.totalReports ?? reports.length}
            </div>
            <span className="text-[11px] text-slate-400">Stored in MongoDB</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Average Health Score</span>
            <div className="text-2xl font-black text-blue-600 mt-1">
              {analytics.healthMetrics?.averageHealthScore ?? 84.7}%
            </div>
            <span className="text-[11px] text-slate-400">Across inspected fleet</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lowest Fleet Health</span>
            <div className="text-2xl font-black text-rose-600 mt-1">
              {analytics.healthMetrics?.lowestHealthScore ?? 78}%
            </div>
            <span className="text-[11px] text-slate-400">Needs urgent intervention</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Polymorphic Schema</span>
            <div className="text-sm font-bold text-emerald-700 mt-2 flex items-center space-x-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>JSON Schema Active</span>
            </div>
            <span className="text-[11px] text-slate-400">repair_reports validator</span>
          </div>
        </div>
      )}

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full p-12 text-center text-xs text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
            Querying MongoDB documents...
          </div>
        ) : reports.length === 0 ? (
          <div className="col-span-full p-12 text-center text-xs text-slate-500">
            No inspection reports found in MongoDB collection.
          </div>
        ) : (
          reports.map((report) => (
            <div
              key={report._id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                {/* Header with Health Score Badge */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      Job #{report.job_id} &bull; Vehicle #{report.vehicle_id}
                    </h3>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {new Date(report.created_at).toLocaleDateString()} &bull; Inspector #{report.mechanic_id}
                    </div>
                  </div>
                  <div
                    className={`px-2.5 py-1 rounded-full border text-xs font-black tracking-tight ${getHealthColor(
                      report.overall_health_score
                    )}`}
                  >
                    {report.overall_health_score}% Health
                  </div>
                </div>

                {/* DTC Codes */}
                {report.diagnostic_codes && report.diagnostic_codes.length > 0 && (
                  <div className="mt-3 flex items-center space-x-1 flex-wrap gap-1">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">DTC:</span>
                    {report.diagnostic_codes.map((dtc, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 font-mono text-[10px] rounded"
                      >
                        {dtc}
                      </span>
                    ))}
                  </div>
                )}

                {/* Subsystem findings preview */}
                <div className="mt-4 space-y-1.5">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Findings Breakdown ({report.findings?.length || 0})
                  </div>
                  {report.findings?.slice(0, 3).map((f, i) => (
                    <div
                      key={i}
                      className="text-xs p-1.5 rounded bg-slate-50 border border-slate-100 flex items-center justify-between"
                    >
                      <span className="font-semibold text-slate-800">{f.system}</span>
                      <Badge status={f.condition} size="sm" />
                    </div>
                  ))}
                  {report.findings && report.findings.length > 3 && (
                    <div className="text-[10px] text-slate-400 italic">
                      + {report.findings.length - 3} more subsystem inspection points
                    </div>
                  )}
                </div>

                {/* Technician Notes */}
                {report.technician_notes && (
                  <p className="mt-3 text-xs text-slate-600 line-clamp-2 italic bg-slate-50/60 p-2 rounded border border-slate-100">
                    &ldquo;{report.technician_notes}&rdquo;
                  </p>
                )}
              </div>

              {/* View Full Report button */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <button
                  onClick={() => {
                    setSelectedReport(report);
                    setIsViewModalOpen(true);
                  }}
                  className="w-full py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50/50 hover:bg-blue-50 rounded-lg transition flex items-center justify-center space-x-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>View Full Inspection Audit</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: View Full Inspection Report */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={`MongoDB Inspection Report — Job #${selectedReport?.job_id}`}
        maxWidth="max-w-3xl"
      >
        {selectedReport && (
          <div className="space-y-5 text-xs">
            {/* Top Stats */}
            <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Overall Health</span>
                <div className={`text-xl font-black mt-0.5 ${selectedReport.overall_health_score >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {selectedReport.overall_health_score}%
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Cross-Link MySQL Job</span>
                <div className="text-xl font-black text-slate-800 mt-0.5">
                  Job #{selectedReport.job_id}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">MongoDB Doc ID</span>
                <div className="font-mono text-slate-600 text-[11px] truncate mt-1">
                  {selectedReport._id}
                </div>
              </div>
            </div>

            {/* Findings Table */}
            <div>
              <h4 className="font-bold text-slate-900 mb-2">Multi-Point Subsystem Findings</h4>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Subsystem</th>
                      <th className="py-2.5 px-3">Condition</th>
                      <th className="py-2.5 px-3">Observation / Finding</th>
                      <th className="py-2.5 px-3">Recommended Action</th>
                      <th className="py-2.5 px-3 text-right">Est. Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedReport.findings?.map((f, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 font-semibold text-slate-800">{f.system}</td>
                        <td className="py-2 px-3">
                          <Badge status={f.condition} size="sm" />
                        </td>
                        <td className="py-2 px-3 text-slate-600">{f.finding}</td>
                        <td className="py-2 px-3 text-slate-600">{f.action_recommended || '—'}</td>
                        <td className="py-2 px-3 text-right font-medium text-slate-900">
                          {f.cost_estimate ? `₹${f.cost_estimate.toLocaleString('en-IN')}` : '₹0'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Diagnostic Codes */}
            {selectedReport.diagnostic_codes && selectedReport.diagnostic_codes.length > 0 && (
              <div>
                <h4 className="font-bold text-slate-900 mb-1">OBD-II Diagnostic Trouble Codes (DTCs)</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedReport.diagnostic_codes.map((code, idx) => (
                    <span key={idx} className="px-2 py-1 bg-rose-50 text-rose-700 border border-rose-200 font-mono text-xs rounded-md">
                      {code}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Technician Notes */}
            {selectedReport.technician_notes && (
              <div>
                <h4 className="font-bold text-slate-900 mb-1">Technician Notes & Observations</h4>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-700 leading-relaxed">
                  {selectedReport.technician_notes}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Close Report
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Create Inspection Report */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create MongoDB Vehicle Inspection Report"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleCreateReport} className="space-y-4 text-xs">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">MySQL Job ID *</label>
              <input
                type="number"
                required
                placeholder="e.g. 1"
                value={createForm.job_id}
                onChange={(e) => setCreateForm({ ...createForm, job_id: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Vehicle ID *</label>
              <input
                type="number"
                required
                placeholder="e.g. 1"
                value={createForm.vehicle_id}
                onChange={(e) => setCreateForm({ ...createForm, vehicle_id: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Overall Health Score (0–100): {createForm.overall_health_score}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={createForm.overall_health_score}
                onChange={(e) => setCreateForm({ ...createForm, overall_health_score: Number(e.target.value) })}
                className="w-full mt-2"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              OBD-II Trouble Codes (comma-separated, optional)
            </label>
            <input
              type="text"
              placeholder="e.g. P0300, P0420"
              value={createForm.dtc_input}
              onChange={(e) => setCreateForm({ ...createForm, dtc_input: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          {/* Dynamic Findings List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-bold text-slate-800">Multi-Point Subsystem Findings *</label>
              <button
                type="button"
                onClick={addFindingRow}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Subsystem Point</span>
              </button>
            </div>

            <div className="space-y-3">
              {createForm.findings.map((f, idx) => (
                <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <select
                        value={f.system}
                        onChange={(e) => updateFindingRow(idx, 'system', e.target.value)}
                        className="px-2 py-1 bg-white border border-slate-200 rounded font-semibold text-xs"
                      >
                        {SUBSYSTEM_OPTIONS.map((sub) => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>

                      <select
                        value={f.condition}
                        onChange={(e) => updateFindingRow(idx, 'condition', e.target.value)}
                        className="px-2 py-1 bg-white border border-slate-200 rounded font-semibold text-xs"
                      >
                        <option value="Good">Good</option>
                        <option value="Fair">Fair</option>
                        <option value="Worn">Worn</option>
                        <option value="Damaged">Damaged</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>

                    {createForm.findings.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFindingRow(idx)}
                        className="text-rose-500 hover:text-rose-700"
                        title="Remove Finding"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    required
                    placeholder="Specific inspection observation (e.g. Minor oil seepage around valve cover gasket)"
                    value={f.finding}
                    onChange={(e) => updateFindingRow(idx, 'finding', e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Recommended Action (e.g. Replace gasket at next 20,000 km)"
                      value={f.action_recommended || ''}
                      onChange={(e) => updateFindingRow(idx, 'action_recommended', e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                    />
                    <input
                      type="number"
                      placeholder="Est. Cost (₹)"
                      value={f.cost_estimate || ''}
                      onChange={(e) => updateFindingRow(idx, 'cost_estimate', Number(e.target.value))}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Technician Narrative Summary</label>
            <textarea
              rows={2}
              placeholder="e.g. Vehicle test-driven after suspension torqueing; road handling verified normal."
              value={createForm.technician_notes}
              onChange={(e) => setCreateForm({ ...createForm, technician_notes: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-800">
            <strong>Cross-Paradigm Sync:</strong> Inserting this MongoDB document will automatically update <code className="font-mono">service_jobs.mongo_report_id</code> in MySQL with the generated BSON <code className="font-mono">_id</code>.
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              Save & Synchronize to MongoDB
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function RepairReportsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-500">Loading diagnostic reports...</div>}>
      <RepairReportsContent />
    </Suspense>
  );
}
