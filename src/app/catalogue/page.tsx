'use client';

import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  Car,
  Search,
  Zap,
  Gauge,
  ChevronLeft,
  ChevronRight,
  Scale,
  X,
  Check,
  RefreshCw,
  Sparkles,
  Fuel
} from 'lucide-react';

interface CatalogueItem {
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
  transmission_type?: string;
  drivetrain?: string;
  conv_economy_combined?: number;
  alt_economy_combined?: number;
  electric_range?: number;
  phev_total_range?: number;
  source_dataset: string;
}

export default function VehicleCataloguePage() {
  const [vehicles, setVehicles] = useState<CatalogueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [fuelFilter, setFuelFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 24;

  // Comparison tray state (up to 3 vehicles)
  const [comparisonList, setComparisonList] = useState<CatalogueItem[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  const fetchCatalogue = async () => {
    setLoading(true);
    try {
      const offset = (page - 1) * pageSize;
      let url = `/api/catalogue?limit=${pageSize}&offset=${offset}`;
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
      if (fuelFilter) url += `&fuel=${encodeURIComponent(fuelFilter)}`;

      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setVehicles(json.data.vehicles || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalogue();
  }, [page, fuelFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCatalogue();
  };

  const toggleCompare = (v: CatalogueItem) => {
    if (comparisonList.some((item) => item.catalogue_id === v.catalogue_id)) {
      setComparisonList(comparisonList.filter((item) => item.catalogue_id !== v.catalogue_id));
    } else {
      if (comparisonList.length >= 3) {
        alert('You can compare a maximum of 3 vehicles simultaneously.');
        return;
      }
      setComparisonList([...comparisonList, v]);
    }
  };

  const isSelected = (id: number) => comparisonList.some((item) => item.catalogue_id === id);

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Vehicle Technical Catalogue
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse 3,229 EV, Plug-in Hybrid, and Alternative Fuel models ingested from the official Department of Energy datasets.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {comparisonList.length > 0 && (
            <button
              onClick={() => setIsCompareModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm transition"
            >
              <Scale className="w-4 h-4" />
              <span>Compare Selected ({comparisonList.length}/3)</span>
            </button>
          )}
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by make, model, or category (e.g. Tesla, Mustang, Ioniq)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={fuelFilter}
              onChange={(e) => {
                setFuelFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
            >
              <option value="">All Fuel Technologies</option>
              <option value="Electric">All-Electric (BEV)</option>
              <option value="Plug-in Hybrid">Plug-in Hybrid (PHEV)</option>
              <option value="Ethanol">Ethanol (E85)</option>
              <option value="Compressed Natural Gas">CNG</option>
              <option value="Hydrogen">Hydrogen Fuel Cell</option>
              <option value="Biodiesel">Biodiesel</option>
            </select>

            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Vehicle Grid */}
      {loading ? (
        <div className="p-16 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200 shadow-sm">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
          Loading vehicle specifications from MySQL catalogue table...
        </div>
      ) : vehicles.length === 0 ? (
        <div className="p-16 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200 shadow-sm">
          No vehicles matched your search query.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {vehicles.map((v) => {
            const selected = isSelected(v.catalogue_id);
            return (
              <div
                key={v.catalogue_id}
                className={`bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between ${
                  selected ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-200'
                }`}
              >
                <div>
                  {/* Manufacturer & Year */}
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span className="font-semibold text-blue-600 uppercase tracking-wide">
                      {v.manufacturer}
                    </span>
                    <span className="font-bold text-slate-700">{v.model_year}</span>
                  </div>

                  {/* Model */}
                  <h3 className="font-extrabold text-slate-900 text-sm leading-snug line-clamp-1">
                    {v.model}
                  </h3>

                  {/* Category & Dataset */}
                  <div className="flex items-center space-x-1.5 mt-2">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {v.category || 'Passenger'}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                      {v.source_dataset}
                    </span>
                  </div>

                  {/* Specs Pill Matrix */}
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center space-x-1">
                        <Fuel className="w-3 h-3 text-slate-400" />
                        <span>Powertrain:</span>
                      </span>
                      <span className="font-semibold text-slate-900 truncate max-w-[120px]">
                        {v.fuel || 'Electric'}
                      </span>
                    </div>

                    {v.electric_range && v.electric_range > 0 ? (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center space-x-1">
                          <Zap className="w-3 h-3 text-amber-500" />
                          <span>EV Range:</span>
                        </span>
                        <span className="font-bold text-emerald-600">{v.electric_range} miles</span>
                      </div>
                    ) : null}

                    {v.alt_economy_combined ? (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center space-x-1">
                          <Gauge className="w-3 h-3 text-blue-500" />
                          <span>MPGe:</span>
                        </span>
                        <span className="font-semibold text-slate-800">{v.alt_economy_combined} MPGe</span>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Compare Checkbox Button */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => toggleCompare(v)}
                    className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition ${
                      selected
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {selected ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Selected for Compare</span>
                      </>
                    ) : (
                      <>
                        <Scale className="w-3.5 h-3.5 text-slate-400" />
                        <span>Add to Compare</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Bar */}
      <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm text-xs">
        <span className="text-slate-500">
          Showing page <strong>{page}</strong> &bull; 24 models per page
        </span>
        <div className="flex items-center space-x-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-bold px-2">{page}</span>
          <button
            disabled={vehicles.length < pageSize}
            onClick={() => setPage(page + 1)}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Floating Comparison Tray */}
      {comparisonList.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-4 border border-slate-700">
          <div className="flex items-center space-x-2">
            <Scale className="w-5 h-5 text-indigo-400" />
            <span className="text-xs font-bold">
              Comparing {comparisonList.length} vehicle{comparisonList.length > 1 ? 's' : ''}:
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {comparisonList.map((c) => (
              <span
                key={c.catalogue_id}
                className="bg-slate-800 text-slate-200 px-2.5 py-1 rounded-lg text-xs font-medium flex items-center space-x-1"
              >
                <span>{c.manufacturer} {c.model}</span>
                <button
                  onClick={() => toggleCompare(c)}
                  className="hover:text-rose-400 ml-1 text-slate-400"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>

          <div className="flex items-center space-x-2 pl-2 border-l border-slate-700">
            <button
              onClick={() => setIsCompareModalOpen(true)}
              className="px-3 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white transition"
            >
              Side-by-Side View
            </button>
            <button
              onClick={() => setComparisonList([])}
              className="text-xs text-slate-400 hover:text-white"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Comparison Modal */}
      <Modal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        title="Side-by-Side Technical Comparison"
        maxWidth="max-w-4xl"
      >
        <div className="overflow-x-auto text-xs">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-3 px-4 text-left font-semibold text-slate-500 w-1/4">Specification</th>
                {comparisonList.map((v) => (
                  <th key={v.catalogue_id} className="py-3 px-4 text-left font-bold text-slate-900">
                    <div className="text-xs text-blue-600 uppercase">{v.manufacturer}</div>
                    <div className="text-sm font-black">{v.model} ({v.model_year})</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-2.5 px-4 font-semibold text-slate-600">Category</td>
                {comparisonList.map((v) => (
                  <td key={v.catalogue_id} className="py-2.5 px-4 font-medium">{v.category || 'Passenger'}</td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-semibold text-slate-600">Fuel & Energy Type</td>
                {comparisonList.map((v) => (
                  <td key={v.catalogue_id} className="py-2.5 px-4 font-semibold text-slate-800">{v.fuel}</td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-semibold text-slate-600">All-Electric Range</td>
                {comparisonList.map((v) => (
                  <td key={v.catalogue_id} className="py-2.5 px-4 font-bold text-emerald-600">
                    {v.electric_range ? `${v.electric_range} miles` : 'N/A (Conventional/HEV)'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-semibold text-slate-600">Combined Economy</td>
                {comparisonList.map((v) => (
                  <td key={v.catalogue_id} className="py-2.5 px-4 font-medium">
                    {v.alt_economy_combined ? `${v.alt_economy_combined} MPGe` : `${v.conv_economy_combined || 'N/A'} MPG`}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-semibold text-slate-600">Engine / Drivetrain</td>
                {comparisonList.map((v) => (
                  <td key={v.catalogue_id} className="py-2.5 px-4 text-slate-700">
                    {v.engine_type || 'Electric Motor'} &bull; {v.drivetrain || 'FWD/AWD'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-semibold text-slate-600">Transmission</td>
                {comparisonList.map((v) => (
                  <td key={v.catalogue_id} className="py-2.5 px-4 text-slate-700">
                    {v.transmission_type || 'Single-speed Direct Drive'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-semibold text-slate-600">Source Dataset</td>
                {comparisonList.map((v) => (
                  <td key={v.catalogue_id} className="py-2.5 px-4 font-mono text-[11px] text-blue-700">
                    {v.source_dataset}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
          <div className="flex justify-end pt-4 border-t border-slate-200 mt-4">
            <button
              onClick={() => setIsCompareModalOpen(false)}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Close Comparison
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
