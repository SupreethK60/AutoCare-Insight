'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { Badge } from '@/components/ui/Badge';
import {
  BarChart3,
  Play,
  Clock,
  Layers,
  Code2,
  Table as TableIcon,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface AggregationQueryMeta {
  id: string;
  title: string;
  description: string;
  stages: string[];
  parameters: {
    name: string;
    label: string;
    type: string;
    defaultValue: any;
    description: string;
  }[];
}

export default function MongoAggregationsPage() {
  const { user } = useAuth();
  const [queries, setQueries] = useState<AggregationQueryMeta[]>([]);
  const [selectedId, setSelectedId] = useState<string>('vehicle_health_summary');
  const [params, setParams] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState<'table' | 'pipeline'>('table');

  // Execution state
  const [loadingQueries, setLoadingQueries] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch registered aggregations on mount
  useEffect(() => {
    async function loadCatalog() {
      setLoadingQueries(true);
      try {
        const res = await fetch('/api/advanced/mongodb-aggregations');
        if (res.ok) {
          const json = await res.json();
          const list = json.data?.queries || [];
          setQueries(list);
          if (list.length > 0) {
            setSelectedId(list[0].id);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingQueries(false);
      }
    }
    loadCatalog();
  }, []);

  const selectedQuery = queries.find((q) => q.id === selectedId);

  // Initialize parameters when query selection changes
  useEffect(() => {
    if (selectedQuery?.parameters) {
      const initial: Record<string, any> = {};
      selectedQuery.parameters.forEach((p) => {
        initial[p.name] = p.defaultValue;
      });
      setParams(initial);
    } else {
      setParams({});
    }
  }, [selectedId, queries]);

  const handleExecute = async () => {
    if (!selectedId) return;
    setExecuting(true);
    setError(null);
    try {
      const res = await fetch('/api/advanced/mongodb-aggregations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query_id: selectedId,
          params,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setExecutionResult(json.data);
      } else {
        setError(json.error?.message || 'Pipeline execution failed');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to execute aggregation');
    } finally {
      setExecuting(false);
    }
  };

  // Run automatically on first selection load
  useEffect(() => {
    if (selectedId && queries.length > 0) {
      handleExecute();
    }
  }, [selectedId, queries.length]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <BarChart3 className="w-8 h-8 text-emerald-600" />
            <span>MongoDB Aggregation Pipeline Runner</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Execute real-time multi-stage analytical aggregations over polymorphic vehicle inspection records and diagnostics.
          </p>
        </div>
      </div>

      {/* Query Selector Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Aggregation Selector List */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-2">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Available Pipelines ({queries.length})
          </div>

          {loadingQueries ? (
            <div className="p-6 text-center text-xs text-slate-400">Loading catalog...</div>
          ) : (
            <div className="space-y-1.5">
              {queries.map((q) => {
                const isSelected = q.id === selectedId;
                return (
                  <button
                    key={q.id}
                    onClick={() => setSelectedId(q.id)}
                    className={`w-full text-left p-3 rounded-lg text-xs transition border flex flex-col justify-between ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-500/20 text-emerald-950 font-semibold'
                        : 'bg-slate-50/60 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div>{q.title}</div>
                    <div className="flex items-center space-x-1 mt-2">
                      {q.stages.map((st, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/80 border border-slate-200 text-slate-600"
                        >
                          {st}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Execution Configuration & Results */}
        <div className="md:col-span-2 space-y-4">
          {/* Active Query Card */}
          {selectedQuery && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900">{selectedQuery.title}</h3>
                  <div className="flex items-center space-x-1">
                    {selectedQuery.stages.map((st, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold"
                      >
                        {st}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {selectedQuery.description}
                </p>
              </div>

              {/* Dynamic Parameters Form */}
              {selectedQuery.parameters && selectedQuery.parameters.length > 0 && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
                  <span className="font-semibold text-slate-700 flex items-center space-x-1">
                    <Sliders className="w-3.5 h-3.5 text-slate-500" />
                    <span>Pipeline Parameters</span>
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedQuery.parameters.map((param) => (
                      <div key={param.name}>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                          {param.label}
                        </label>
                        <input
                          type={param.type === 'number' ? 'number' : 'text'}
                          value={params[param.name] ?? param.defaultValue}
                          onChange={(e) =>
                            setParams({
                              ...params,
                              [param.name]: param.type === 'number' ? Number(e.target.value) : e.target.value,
                            })
                          }
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded focus:outline-none"
                        />
                        <span className="text-[10px] text-slate-400 mt-0.5 block">
                          {param.description}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Button & Metadata */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  onClick={handleExecute}
                  disabled={executing}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm flex items-center space-x-1.5 transition disabled:opacity-50"
                >
                  <Play className={`w-3.5 h-3.5 ${executing ? 'animate-spin' : ''}`} />
                  <span>{executing ? 'Executing Pipeline...' : 'Run Aggregation'}</span>
                </button>

                {executionResult && (
                  <div className="flex items-center space-x-3 text-xs text-slate-500">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{executionResult.execution_time_ms} ms</span>
                    </span>
                    <span className="font-semibold text-slate-800">
                      {executionResult.count} document{executionResult.count > 1 ? 's' : ''} returned
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Results Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* View Switcher Tabs */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 bg-slate-50/50">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Aggregated Output
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setActiveTab('table')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded flex items-center space-x-1 transition ${
                    activeTab === 'table'
                      ? 'bg-white shadow-sm text-slate-900 border border-slate-200'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <TableIcon className="w-3 h-3" />
                  <span>Table</span>
                </button>
                <button
                  onClick={() => setActiveTab('pipeline')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded flex items-center space-x-1 transition ${
                    activeTab === 'pipeline'
                      ? 'bg-white shadow-sm text-slate-900 border border-slate-200'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Code2 className="w-3 h-3" />
                  <span>Pipeline JSON</span>
                </button>
              </div>
            </div>

            {/* Results Content */}
            <div className="p-4">
              {executing ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
                  Running aggregation pipeline against MongoDB collection...
                </div>
              ) : !executionResult || executionResult.results.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No records returned for this aggregation query.
                </div>
              ) : activeTab === 'table' ? (
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                        {Object.keys(executionResult.results[0] || {}).map((col) => (
                          <th key={col} className="py-2.5 px-3">
                            {col.replace('_', ' ')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {executionResult.results.map((row: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/60 transition">
                          {Object.keys(row).map((col) => (
                            <td key={col} className="py-2.5 px-3 font-medium text-slate-800">
                              {typeof row[col] === 'number'
                                ? col.includes('cost') || col.includes('price')
                                  ? `₹${row[col].toLocaleString('en-IN')}`
                                  : row[col]
                                : String(row[col] ?? '—')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <pre className="p-4 bg-slate-900 text-emerald-400 rounded-lg text-xs font-mono overflow-x-auto max-h-96">
                  {JSON.stringify(executionResult.pipeline, null, 2)}
                </pre>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

