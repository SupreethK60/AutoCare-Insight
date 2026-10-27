'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { Modal } from '@/components/ui/Modal';
import {
  Car,
  Plus,
  Search,
  Gauge,
  History,
  RefreshCw,
  User,
  Shield,
  Calendar
} from 'lucide-react';

interface Vehicle {
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
  customer_name: string;
  customer_phone: string;
  manufacturer?: string;
  model?: string;
  model_year?: number;
  category?: string;
  fuel?: string;
}

export default function VehiclesPage() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [serviceHistory, setServiceHistory] = useState<any[]>([]);

  // Form states
  const [customers, setCustomers] = useState<any[]>([]);
  const [catalogueItems, setCatalogueItems] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    customer_id: '',
    catalogue_id: '',
    license_plate: '',
    vin: '',
    color: 'White',
    purchase_year: '2023',
    current_odometer: '15000',
    notes: '',
  });

  const fetchVehicles = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = '/api/vehicles?limit=100';
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
      const res = await fetch(url);
      const json = await res.json();
      if (res.ok && json.success) {
        setVehicles(json.data.vehicles || []);
      } else {
        setError(json.error?.message || 'Failed to load vehicles');
      }
    } catch (err: any) {
      setError(err?.message || 'Error loading vehicles');
    } finally {
      setLoading(false);
    }
  };

  const loadPrerequisites = async () => {
    try {
      const [cRes, catRes] = await Promise.all([
        fetch('/api/customers?limit=100'),
        fetch('/api/catalogue?limit=50'),
      ]);
      if (cRes.ok) {
        const cJson = await cRes.json();
        setCustomers(cJson.data?.customers || []);
        if (cJson.data?.customers?.length > 0) {
          setFormData((prev) => ({ ...prev, customer_id: String(cJson.data.customers[0].customer_id) }));
        }
      }
      if (catRes.ok) {
        const catJson = await catRes.json();
        setCatalogueItems(catJson.data?.vehicles || []);
        if (catJson.data?.vehicles?.length > 0) {
          setFormData((prev) => ({ ...prev, catalogue_id: String(catJson.data.vehicles[0].catalogue_id) }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchVehicles();
    loadPrerequisites();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVehicles();
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: Number(formData.customer_id),
          catalogue_id: formData.catalogue_id ? Number(formData.catalogue_id) : undefined,
          license_plate: formData.license_plate,
          vin: formData.vin || undefined,
          color: formData.color,
          purchase_year: Number(formData.purchase_year),
          current_odometer: Number(formData.current_odometer),
          notes: formData.notes,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setIsAddModalOpen(false);
        setSuccessMsg(`Vehicle with registration "${formData.license_plate}" enrolled into fleet!`);
        fetchVehicles();
      } else {
        setError(json.error?.message || 'Failed to register vehicle');
      }
    } catch (err: any) {
      setError(err?.message);
    }
  };

  const viewServiceHistory = async (v: Vehicle) => {
    setSelectedVehicle(v);
    setIsHistoryModalOpen(true);
    try {
      const res = await fetch(`/api/vehicles/${v.vehicle_id}/history`);
      if (res.ok) {
        const json = await res.json();
        setServiceHistory(json.data?.history || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Registered Fleet Vehicles
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Customer-owned vehicles linked to technical catalogue specifications, odometer logs, and service history.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchVehicles}
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
              <span>Register New Vehicle</span>
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
            placeholder="Search license plate, VIN, owner name, or model..."
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

      {/* Vehicles Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
            Loading registered vehicles from MySQL database...
          </div>
        ) : vehicles.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No registered vehicles found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Registration & VIN</th>
                  <th className="py-3 px-4">Make & Model</th>
                  <th className="py-3 px-4">Owner / Customer</th>
                  <th className="py-3 px-4">Current Odometer</th>
                  <th className="py-3 px-4">Fuel Tech</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vehicles.map((v) => (
                  <tr key={v.vehicle_id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded inline-block">
                        {v.license_plate}
                      </div>
                      <div className="text-slate-400 font-mono text-[10px] mt-0.5">
                        VIN: {v.vin || 'N/A'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">
                        {v.manufacturer} {v.model} ({v.model_year || v.purchase_year})
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        Color: {v.color || 'Standard'} &bull; {v.category || 'Passenger'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800 flex items-center space-x-1">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>{v.customer_name}</span>
                      </div>
                      <div className="text-slate-500 text-[11px]">{v.customer_phone}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-1 text-slate-900 font-bold">
                        <Gauge className="w-3.5 h-3.5 text-blue-600" />
                        <span>{Number(v.current_odometer).toLocaleString()} km</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                        {v.fuel || 'Electric'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => viewServiceHistory(v)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded flex items-center space-x-1 transition ml-auto"
                      >
                        <History className="w-3 h-3 text-slate-500" />
                        <span>Service History</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Register Vehicle */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register Vehicle into Fleet"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Registered Owner *</label>
            <select
              required
              value={formData.customer_id}
              onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
            >
              {customers.map((c) => (
                <option key={c.customer_id} value={c.customer_id}>
                  {c.full_name} ({c.phone})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Catalogue Model *</label>
            <select
              value={formData.catalogue_id}
              onChange={(e) => setFormData({ ...formData, catalogue_id: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
            >
              {catalogueItems.map((cat) => (
                <option key={cat.catalogue_id} value={cat.catalogue_id}>
                  {cat.manufacturer} {cat.model} ({cat.model_year}) &bull; {cat.fuel}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Registration / License Plate *</label>
              <input
                type="text"
                required
                placeholder="e.g. KA-05-EV-9999"
                value={formData.license_plate}
                onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg uppercase font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">VIN (17 Characters)</label>
              <input
                type="text"
                maxLength={17}
                placeholder="e.g. 1G1FX6S07H4109999"
                value={formData.vin}
                onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg uppercase font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Color</label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Purchase Year</label>
              <input
                type="number"
                value={formData.purchase_year}
                onChange={(e) => setFormData({ ...formData, purchase_year: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Current Odometer (km)</label>
              <input
                type="number"
                value={formData.current_odometer}
                onChange={(e) => setFormData({ ...formData, current_odometer: e.target.value })}
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
              Enrol Vehicle
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Service History */}
      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title={`Service & Inspection History — ${selectedVehicle?.license_plate}`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="font-bold text-slate-900">
              {selectedVehicle?.manufacturer} {selectedVehicle?.model} ({selectedVehicle?.purchase_year})
            </div>
            <div className="text-slate-500 mt-0.5">
              Owner: {selectedVehicle?.customer_name} &bull; Odometer: {Number(selectedVehicle?.current_odometer).toLocaleString()} km
            </div>
          </div>

          {serviceHistory.length === 0 ? (
            <p className="text-slate-400 italic py-6 text-center">
              No historical service records found for this vehicle.
            </p>
          ) : (
            <div className="space-y-3">
              {serviceHistory.map((h, idx) => (
                <div key={idx} className="p-3 border border-slate-200 rounded-lg space-y-1 bg-white shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-slate-900">Job #{h.job_id} &bull; {h.service_name || 'Maintenance'}</span>
                      <div className="text-slate-400 text-[11px]">
                        {new Date(h.completed_at || h.started_at || Date.now()).toLocaleDateString()}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {h.status || 'Completed'}
                    </span>
                  </div>
                  {h.internal_notes && (
                    <p className="text-slate-600 text-[11px] italic pt-1">&ldquo;{h.internal_notes}&rdquo;</p>
                  )}
                  {h.total_amount && (
                    <div className="text-right font-bold text-slate-900 text-[11px] pt-1">
                      Billed: ₹{Number(h.total_amount).toLocaleString('en-IN')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setIsHistoryModalOpen(false)}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

