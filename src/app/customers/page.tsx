'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { Modal } from '@/components/ui/Modal';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  RefreshCw,
  Award
} from 'lucide-react';

interface Customer {
  customer_id: number;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  loyalty_points: number;
  created_at: string;
}

export default function CustomersPage() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Add Customer modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    zip_code: '560085',
  });

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = '/api/customers?limit=100';
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
      const res = await fetch(url);
      const json = await res.json();
      if (res.ok && json.success) {
        setCustomers(json.data.customers || []);
      } else {
        setError(json.error?.message || 'Failed to load customers');
      }
    } catch (err: any) {
      setError(err?.message || 'Error loading customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers();
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setIsAddModalOpen(false);
        setSuccessMsg(`Customer "${formData.full_name}" registered successfully!`);
        setFormData({
          full_name: '',
          email: '',
          phone: '',
          address: '',
          city: 'Bengaluru',
          state: 'Karnataka',
          zip_code: '560085',
        });
        fetchCustomers();
      } else {
        setError(json.error?.message || 'Failed to add customer');
      }
    } catch (err: any) {
      setError(err?.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Customer Directory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Registered vehicle owners, contact profiles, and loyalty reward tiers.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchCustomers}
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
                setIsAddModalOpen(true);
              }}
              className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Register Customer</span>
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

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search customer name, email, or phone number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
        >
          Search
        </button>
      </form>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
            Loading customers from MySQL database...
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No customers found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Customer ID & Name</th>
                  <th className="py-3 px-4">Contact Details</th>
                  <th className="py-3 px-4">Address / City</th>
                  <th className="py-3 px-4">Loyalty Points</th>
                  <th className="py-3 px-4">Member Since</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => (
                  <tr key={c.customer_id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{c.full_name}</div>
                      <div className="text-slate-400 font-mono text-[11px] mt-0.5">ID #{c.customer_id}</div>
                    </td>

                    <td className="py-3.5 px-4 space-y-0.5 text-[11px]">
                      <div className="flex items-center space-x-1.5 text-slate-700 font-medium">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{c.phone}</span>
                      </div>
                      {c.email && (
                        <div className="flex items-center space-x-1.5 text-slate-500">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{c.email}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 text-[11px]">
                      <div className="flex items-center space-x-1.5">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{c.address ? `${c.address}, ` : ''}{c.city}, {c.state}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-1 text-blue-600 font-bold">
                        <Award className="w-3.5 h-3.5" />
                        <span>{c.loyalty_points || 0} pts</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString() : 'Active'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Register Customer */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Customer"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Anand Murthy"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
              <input
                type="tel"
                required
                placeholder="e.g. +91 98450 12345"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                placeholder="e.g. anand@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Street Address</label>
            <input
              type="text"
              placeholder="e.g. #42, 100ft Ring Road, Banashankari 3rd Stage"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">State</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Pincode</label>
              <input
                type="text"
                value={formData.zip_code}
                onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
            >
              Register Customer
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

