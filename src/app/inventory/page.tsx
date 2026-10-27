'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  RefreshCw,
  Edit,
  DollarSign,
  Layers,
  CheckCircle2,
  Boxes
} from 'lucide-react';

interface SparePart {
  part_id: number;
  part_number: string;
  part_name: string;
  description?: string;
  category: string;
  brand?: string;
  unit_cost: number;
  selling_price: number;
  qty_in_stock: number;
  reorder_level: number;
  location_code?: string;
  is_active: number;
  is_low_stock: number;
}

export default function InventoryPage() {
  const { user } = useAuth();
  const [parts, setParts] = useState<SparePart[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState<SparePart | null>(null);

  // Add Part Form
  const [addForm, setAddForm] = useState({
    part_number: '',
    part_name: '',
    category: 'Filters',
    brand: '',
    unit_cost: '',
    selling_price: '',
    qty_in_stock: '',
    reorder_level: '5',
    location_code: 'SHELF-A1',
    description: '',
  });

  // Edit Stock Form
  const [editForm, setEditForm] = useState({
    qty_in_stock: 0,
    reorder_level: 0,
    selling_price: 0,
  });

  const fetchInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = '/api/inventory?limit=100';
      if (lowStockOnly) url += '&low_stock=true';
      if (categoryFilter) url += `&category=${encodeURIComponent(categoryFilter)}`;
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;

      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        const list = json.data?.inventory || json.data?.parts || [];
        setParts(list);
      } else {
        const json = await res.json();
        setError(json.error?.message || 'Failed to fetch inventory');
      }
    } catch (err: any) {
      setError(err?.message || 'Error loading inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [lowStockOnly, categoryFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInventory();
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cost = Number(addForm.unit_cost);
    const price = Number(addForm.selling_price);

    if (price < cost) {
      setError('Constraint Violation: Selling price must be greater than or equal to unit cost.');
      return;
    }

    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          part_number: addForm.part_number,
          part_name: addForm.part_name,
          category: addForm.category,
          brand: addForm.brand || undefined,
          unit_cost: cost,
          selling_price: price,
          qty_in_stock: Number(addForm.qty_in_stock) || 0,
          reorder_level: Number(addForm.reorder_level) || 5,
          location_code: addForm.location_code || undefined,
          description: addForm.description || undefined,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setIsAddModalOpen(false);
        setSuccessMsg(`Part "${addForm.part_name}" added to inventory catalog!`);
        fetchInventory();
      } else {
        setError(json.error?.message || 'Failed to create spare part');
      }
    } catch (err: any) {
      setError(err?.message);
    }
  };

  const openEditModal = (part: SparePart) => {
    setSelectedPart(part);
    setEditForm({
      qty_in_stock: part.qty_in_stock,
      reorder_level: part.reorder_level,
      selling_price: part.selling_price,
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPart) return;
    setError(null);
    try {
      const res = await fetch(`/api/inventory/${selectedPart.part_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...selectedPart,
          qty_in_stock: Number(editForm.qty_in_stock),
          reorder_level: Number(editForm.reorder_level),
          selling_price: Number(editForm.selling_price),
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setIsEditModalOpen(false);
        setSuccessMsg(`Inventory for ${selectedPart.part_name} updated!`);
        fetchInventory();
      } else {
        setError(json.error?.message || 'Failed to update inventory');
      }
    } catch (err: any) {
      setError(err?.message);
    }
  };

  const lowStockCount = parts.filter((p) => p.is_low_stock === 1).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Spare Parts Inventory & Stock Control
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Automated stock deduction, reorder threshold triggers, and workshop bin location management.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchInventory}
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
              <span>Add New Part</span>
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

      {/* Low Stock Warning Banner */}
      {lowStockCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-amber-900">
                Low Inventory Threshold Alert: {lowStockCount} part{lowStockCount > 1 ? 's' : ''} require restocking
              </h4>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Quantities are at or below safety reorder levels to prevent workshop job dispatch stalls.
              </p>
            </div>
          </div>
          <button
            onClick={() => setLowStockOnly(!lowStockOnly)}
            className="text-xs font-semibold px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition shrink-0"
          >
            {lowStockOnly ? 'Show All Parts' : 'Filter Low Stock Only'}
          </button>
        </div>
      )}

      {/* Search and Category Filter */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearch} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search part name, number (e.g. SP-BRK-001), brand..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </form>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
          >
            <option value="">All Categories</option>
            <option value="Brakes">Brakes</option>
            <option value="Filters">Filters</option>
            <option value="Fluids">Fluids & Lubricants</option>
            <option value="Electrical">Electrical & Battery</option>
            <option value="Suspension">Suspension & Steering</option>
            <option value="Engine">Engine & Transmission</option>
          </select>
        </div>
      </div>

      {/* Parts Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
            Loading spare parts from MySQL database...
          </div>
        ) : parts.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No spare parts found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Part No & Name</th>
                  <th className="py-3 px-4">Category & Brand</th>
                  <th className="py-3 px-4">Bin Location</th>
                  <th className="py-3 px-4">Cost vs Price</th>
                  <th className="py-3 px-4">Stock / Reorder</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parts.map((p) => (
                  <tr
                    key={p.part_id}
                    className={`hover:bg-slate-50/80 transition ${
                      p.is_low_stock === 1 ? 'bg-amber-50/30' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{p.part_name}</div>
                      <div className="text-slate-400 font-mono text-[11px]">{p.part_number}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{p.category}</div>
                      <div className="text-slate-500 text-[11px]">{p.brand || 'OEM Standard'}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {p.location_code || 'BIN-GEN'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">
                        ₹{Number(p.selling_price).toLocaleString('en-IN')}
                      </div>
                      <div className="text-slate-400 text-[10px]">
                        Cost: ₹{Number(p.unit_cost).toLocaleString('en-IN')}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-1.5">
                        <span
                          className={`font-black text-sm ${
                            p.qty_in_stock <= p.reorder_level ? 'text-rose-600' : 'text-slate-900'
                          }`}
                        >
                          {p.qty_in_stock}
                        </span>
                        <span className="text-slate-400 text-[11px]">/ min {p.reorder_level}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {p.is_low_stock === 1 ? (
                        <Badge status="low" size="sm" />
                      ) : (
                        <Badge status="active" size="sm" />
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {user?.role !== 'mechanic' ? (
                        <button
                          onClick={() => openEditModal(p)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded flex items-center space-x-1 transition ml-auto"
                        >
                          <Edit className="w-3 h-3 text-slate-500" />
                          <span>Adjust Stock</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">View Only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Add Part */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Spare Part to Inventory"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Part Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. SP-BRK-007"
                value={addForm.part_number}
                onChange={(e) => setAddForm({ ...addForm, part_number: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Part Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Ceramic Brake Rotor"
                value={addForm.part_name}
                onChange={(e) => setAddForm({ ...addForm, part_name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category *</label>
              <select
                value={addForm.category}
                onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="Brakes">Brakes</option>
                <option value="Filters">Filters</option>
                <option value="Fluids">Fluids</option>
                <option value="Electrical">Electrical</option>
                <option value="Suspension">Suspension</option>
                <option value="Engine">Engine</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Brand</label>
              <input
                type="text"
                placeholder="e.g. Bosch, Brembo, Motul"
                value={addForm.brand}
                onChange={(e) => setAddForm({ ...addForm, brand: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Unit Cost (₹) *</label>
              <input
                type="number"
                required
                placeholder="e.g. 1800"
                value={addForm.unit_cost}
                onChange={(e) => setAddForm({ ...addForm, unit_cost: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Selling Price (₹) *</label>
              <input
                type="number"
                required
                placeholder="e.g. 2500"
                value={addForm.selling_price}
                onChange={(e) => setAddForm({ ...addForm, selling_price: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
              <span className="text-[10px] text-slate-400">Must be &ge; Unit Cost</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Initial Stock</label>
              <input
                type="number"
                value={addForm.qty_in_stock}
                onChange={(e) => setAddForm({ ...addForm, qty_in_stock: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Reorder Level</label>
              <input
                type="number"
                value={addForm.reorder_level}
                onChange={(e) => setAddForm({ ...addForm, reorder_level: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Location Code</label>
              <input
                type="text"
                value={addForm.location_code}
                onChange={(e) => setAddForm({ ...addForm, location_code: e.target.value })}
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
              Add to Inventory
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Adjust Stock */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Adjust Stock — ${selectedPart?.part_name}`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Current Stock in Warehouse</label>
            <input
              type="number"
              required
              value={editForm.qty_in_stock}
              onChange={(e) => setEditForm({ ...editForm, qty_in_stock: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Safety Reorder Level</label>
            <input
              type="number"
              required
              value={editForm.reorder_level}
              onChange={(e) => setEditForm({ ...editForm, reorder_level: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Customer Selling Price (₹)</label>
            <input
              type="number"
              required
              value={editForm.selling_price}
              onChange={(e) => setEditForm({ ...editForm, selling_price: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              Update Stock Level
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

