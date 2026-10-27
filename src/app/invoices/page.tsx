'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  Receipt,
  Search,
  DollarSign,
  CreditCard,
  RefreshCw,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldAlert
} from 'lucide-react';

interface InvoiceListItem {
  invoice_id: number;
  job_id: number;
  customer_id: number;
  customer_name: string;
  customer_phone: string;
  license_plate: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  amount_paid: number;
  status: string;
  due_date: string;
  issued_at: string;
}

export default function InvoicesPage() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [invoiceDetails, setInvoiceDetails] = useState<any | null>(null);

  // Payment form state
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'cash' | 'bank_transfer'>('upi');
  const [refNumber, setRefNumber] = useState('');

  const fetchInvoices = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = statusFilter === 'all'
        ? '/api/invoices'
        : `/api/invoices?status=${encodeURIComponent(statusFilter)}`;

      const res = await fetch(url);
      const json = await res.json();
      if (res.ok && json.success) {
        setInvoices(json.data.invoices || []);
      } else {
        setError(json.error?.message || 'Failed to load invoices');
      }
    } catch (err: any) {
      setError(err?.message || 'Error loading invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  const openViewModal = async (inv: InvoiceListItem) => {
    setSelectedInvoice(inv);
    setIsViewModalOpen(true);
    try {
      const res = await fetch(`/api/invoices/${inv.invoice_id}`);
      if (res.ok) {
        const json = await res.json();
        setInvoiceDetails(json.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openPaymentModal = (inv: InvoiceListItem) => {
    setSelectedInvoice(inv);
    const balance = Math.max(0, Number(inv.total_amount) - Number(inv.amount_paid));
    setPaymentAmount(String(balance));
    setRefNumber(`TXN-${Date.now().toString().slice(-6)}`);
    setIsPaymentModalOpen(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setError(null);

    try {
      const res = await fetch(`/api/invoices/${selectedInvoice.invoice_id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount_paid: Number(paymentAmount),
          payment_method: paymentMethod,
          reference_number: refNumber,
          notes: `Settled via AutoCare Portal (${paymentMethod.toUpperCase()})`,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setIsPaymentModalOpen(false);
        setSuccessMsg(`Payment of ₹${Number(paymentAmount).toLocaleString('en-IN')} recorded! MySQL trigger trg_mark_invoice_paid evaluated.`);
        fetchInvoices();
      } else {
        setError(json.error?.message || 'Payment recording failed');
      }
    } catch (err: any) {
      setError(err?.message);
    }
  };

  // RBAC guard check
  if (user?.role === 'mechanic') {
    return (
      <div className="p-12 bg-white rounded-xl border border-slate-200 text-center max-w-lg mx-auto mt-10 shadow-sm">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-base font-bold text-slate-900">Access Restricted by RBAC Policy</h2>
        <p className="text-xs text-slate-500 mt-2">
          Financial accounts and billing ledger records are restricted to <strong>Admin</strong> and <strong>Service Advisor</strong> roles.
        </p>
        <p className="text-[11px] text-slate-400 mt-2">
          Use the role switcher in the top navigation bar to test as Admin or Service Advisor.
        </p>
      </div>
    );
  }

  const filteredInvoices = invoices.filter((i) => {
    const q = searchTerm.toLowerCase();
    return (
      i.customer_name?.toLowerCase().includes(q) ||
      i.license_plate?.toLowerCase().includes(q) ||
      String(i.invoice_id).includes(q) ||
      String(i.job_id).includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Invoices & Settlement Ledger
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Automated billing generated via stored procedures with 18% GST calculation, itemized labor & parts, and trigger-driven status updates.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchInvoices}
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
          {['all', 'issued', 'paid', 'overdue'].map((tab) => (
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

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search invoice #, customer, plate..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
            Loading invoices from MySQL ledger...
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No invoices found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Invoice # & Date</th>
                  <th className="py-3 px-4">Customer & Plate</th>
                  <th className="py-3 px-4">Billing Breakdown</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Paid / Balance</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => {
                  const paid = Number(inv.amount_paid || 0);
                  const total = Number(inv.total_amount || 0);
                  const balance = Math.max(0, total - paid);

                  return (
                    <tr key={inv.invoice_id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">INV-#{inv.invoice_id}</div>
                        <div className="text-slate-400 text-[11px] mt-0.5">
                          Job #{inv.job_id} &bull; {new Date(inv.issued_at).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{inv.customer_name}</div>
                        <div className="font-mono text-[11px] text-slate-500 mt-0.5">
                          {inv.license_plate}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-[11px] text-slate-600 space-y-0.5">
                        <div>Subtotal: ₹{Number(inv.subtotal).toLocaleString('en-IN')}</div>
                        <div>GST ({inv.tax_rate}%): ₹{Number(inv.tax_amount).toLocaleString('en-IN')}</div>
                      </td>

                      <td className="py-3.5 px-4 font-black text-slate-900 text-sm">
                        ₹{total.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-emerald-600">
                          Paid: ₹{paid.toLocaleString('en-IN')}
                        </div>
                        {balance > 0 ? (
                          <div className="font-semibold text-rose-600 text-[11px]">
                            Due: ₹{balance.toLocaleString('en-IN')}
                          </div>
                        ) : (
                          <div className="text-[11px] text-emerald-700 font-semibold">Fully Settled</div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge status={inv.status} size="sm" />
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => openViewModal(inv)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded flex items-center space-x-1 transition"
                            title="View Itemized Breakdown"
                          >
                            <FileText className="w-3 h-3 text-slate-500" />
                            <span>Details</span>
                          </button>

                          {inv.status !== 'paid' && balance > 0 && (
                            <button
                              onClick={() => openPaymentModal(inv)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded flex items-center space-x-1 transition"
                            >
                              <CreditCard className="w-3 h-3" />
                              <span>Settle</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Itemized Invoice Breakdown */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={`Tax Invoice — INV #${selectedInvoice?.invoice_id}`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4 text-xs">
          {/* Customer & Vehicle Header */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Billed To</span>
              <div className="font-bold text-slate-900 mt-0.5">{selectedInvoice?.customer_name}</div>
              <div className="text-slate-500">{selectedInvoice?.customer_phone}</div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Vehicle & Job</span>
              <div className="font-mono font-bold text-slate-900 mt-0.5">{selectedInvoice?.license_plate}</div>
              <div className="text-slate-500">Service Job #{selectedInvoice?.job_id}</div>
            </div>
          </div>

          {/* Line Items: Services */}
          <div>
            <h4 className="font-bold text-slate-800 mb-1">Labor & Service Operations</h4>
            {invoiceDetails?.line_items?.services?.length > 0 ? (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="py-2 px-3">Service</th>
                      <th className="py-2 px-3 text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoiceDetails.line_items.services.map((s: any, idx: number) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 font-medium text-slate-800">{s.service_name}</td>
                        <td className="py-2 px-3 text-right font-semibold">₹{Number(s.service_price).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-400 italic">No specific service lines attached.</p>
            )}
          </div>

          {/* Line Items: Parts */}
          <div>
            <h4 className="font-bold text-slate-800 mb-1">Spare Parts Used</h4>
            {invoiceDetails?.line_items?.parts?.length > 0 ? (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="py-2 px-3">Part Description</th>
                      <th className="py-2 px-3">Qty</th>
                      <th className="py-2 px-3 text-right">Unit Price</th>
                      <th className="py-2 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoiceDetails.line_items.parts.map((p: any, idx: number) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 font-medium text-slate-800">{p.part_name} ({p.part_number})</td>
                        <td className="py-2 px-3">{p.qty_used}</td>
                        <td className="py-2 px-3 text-right">₹{Number(p.unit_price_charged).toLocaleString('en-IN')}</td>
                        <td className="py-2 px-3 text-right font-semibold">
                          ₹{(Number(p.qty_used) * Number(p.unit_price_charged)).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-400 italic">No spare parts charged to this invoice.</p>
            )}
          </div>

          {/* Totals Summary */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-semibold">₹{Number(selectedInvoice?.subtotal || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>GST ({selectedInvoice?.tax_rate || 18}%):</span>
              <span className="font-semibold">₹{Number(selectedInvoice?.tax_amount || 0).toLocaleString('en-IN')}</span>
            </div>
            {Number(selectedInvoice?.discount_amount || 0) > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Loyalty Discount:</span>
                <span className="font-semibold">-₹{Number(selectedInvoice?.discount_amount).toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-sm text-slate-900">
              <span>Invoice Total:</span>
              <span>₹{Number(selectedInvoice?.total_amount || 0).toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Payment History */}
          {invoiceDetails?.payments?.length > 0 && (
            <div>
              <h4 className="font-bold text-slate-800 mb-1">Settlement Payments</h4>
              <div className="space-y-1">
                {invoiceDetails.payments.map((p: any) => (
                  <div key={p.payment_id} className="p-2 bg-emerald-50/50 border border-emerald-100 rounded text-xs flex justify-between">
                    <div>
                      <span className="font-semibold capitalize text-emerald-800">{p.payment_method}</span>
                      <span className="text-slate-400 ml-1.5 font-mono">({p.reference_number || 'N/A'})</span>
                    </div>
                    <span className="font-bold text-emerald-700">₹{Number(p.amount_paid).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setIsViewModalOpen(false)}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Record Settlement */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={`Record Settlement — INV #${selectedInvoice?.invoice_id}`}
      >
        <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Amount to Pay (₹) *</label>
            <input
              type="number"
              required
              min="1"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Payment Method *</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
            >
              <option value="upi">UPI (GPay / PhonePe / QR)</option>
              <option value="card">Credit / Debit Card</option>
              <option value="cash">Cash Counter</option>
              <option value="bank_transfer">Net Banking / IMPS / NEFT</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Transaction Reference Number</label>
            <input
              type="text"
              required
              value={refNumber}
              onChange={(e) => setRefNumber(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
            />
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-800">
            <strong>Database Trigger Integration:</strong> Submitting payment inserts a record into <code className="font-mono">invoice_payments</code>, which triggers MySQL <code className="font-mono">trg_mark_invoice_paid</code> to automatically mark invoice status as <code className="font-mono">&apos;paid&apos;</code> when fully covered.
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(false)}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
            >
              Confirm Settlement
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

