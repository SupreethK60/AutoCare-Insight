'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { Badge } from '@/components/ui/Badge';
import {
  Terminal,
  Play,
  Clock,
  Search,
  Code2,
  Table as TableIcon,
  RefreshCw,
  Filter,
  CheckCircle2,
  Sliders,
  Sparkles,
  BookOpen
} from 'lucide-react';

interface SqlQueryMeta {
  id: string;
  title: string;
  description: string;
  category: string;
  concepts: string[];
  parameters: {
    name: string;
    label: string;
    type: string;
    defaultValue: any;
    description: string;
  }[];
  sql: string;
}

const CATEGORIES = [
  'All',
  'Joins & Basic',
  'Aggregates & Grouping',
  'Subqueries & CTEs',
  'Window Functions',
  'Views & Procedures',
  'Business Intelligence'
];

export default function SqlRunnerPage() {
  const { user } = useAuth();
  const [queries, setQueries] = useState<SqlQueryMeta[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string>('q01_appointments_detailed_join');
  const [params, setParams] = useState<Record<string, any>>({});
  const [viewMode, setViewMode] = useState<'results' | 'sql'>('results');

  // Execution state
  const [loadingQueries, setLoadingQueries] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch catalog on mount
  useEffect(() => {
    async function loadQueries() {
      setLoadingQueries(true);
      try {
        const res = await fetch('/api/advanced/sql-runner');
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
    loadQueries();
  }, []);

  const selectedQuery = queries.find((q) => q.id === selectedId);

  // Reset parameters when query changes
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
      const res = await fetch('/api/advanced/sql-runner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query_id: selectedId,
          params,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setResult(json.data);
      } else {
        setError(json.error?.message || 'SQL execution failed');
      }
    } catch (err: any) {
      setError(err?.message || 'Error executing SQL query');
    } finally {
      setExecuting(false);
    }
  };

  // Run automatically when selection loads
  useEffect(() => {
    if (selectedId && queries.length > 0) {
      handleExecute();
    }
  }, [selectedId, queries.length]);

  const filteredQueries = queries.filter((q) => {
    const matchesCat = selectedCategory === 'All' || q.category === selectedCategory;
    const matchesSearch =
      searchFilter === '' ||
      q.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      q.concepts.some((c) => c.toLowerCase().includes(searchFilter.toLowerCase())) ||
      q.sql.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <Terminal className="w-8 h-8 text-blue-600" />
            <span>Interactive SQL Query Runner</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Execute 20 educational, parameterized SQL queries demonstrating joins, subqueries, CTEs, window functions, and views.
          </p>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Query Selector Catalog */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
          {/* Search & Category Filter */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search queries, concepts (e.g. CTE, RANK)..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center space-x-1 overflow-x-auto pb-1 text-xs">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Queries Catalog ({filteredQueries.length} of {queries.length})
          </div>

          {/* Query List */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {loadingQueries ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading catalog...</div>
            ) : filteredQueries.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">No matching queries found.</div>
            ) : (
              filteredQueries.map((q) => {
                const isSelected = q.id === selectedId;
                return (
                  <button
                    key={q.id}
                    onClick={() => setSelectedId(q.id)}
                    className={`w-full text-left p-3 rounded-lg text-xs transition border flex flex-col justify-between space-y-1.5 ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-500/10 text-blue-950 font-bold'
                        : 'bg-slate-50/50 hover:bg-slate-100/80 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="leading-snug">{q.title}</div>
                    <div className="flex flex-wrap gap-1">
                      {q.concepts.slice(0, 3).map((c, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white border border-slate-200 text-slate-600"
                        >
                          {c}
                        </span>
                      ))}
                      {q.concepts.length > 3 && (
                        <span className="text-[10px] text-slate-400 self-center">
                          +{q.concepts.length - 3}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column (7 cols): Query Execution Details & Table Results */}
        <div className="lg:col-span-7 space-y-4">
          {/* Query Details & Execution Control */}
          {selectedQuery && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900">{selectedQuery.title}</h3>
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    {selectedQuery.category}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {selectedQuery.description}
                </p>

                {/* Concept tags */}
                <div className="flex flex-wrap gap-1 mt-2.5">
                  {selectedQuery.concepts.map((c, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              {/* Dynamic Parameter Inputs (if any) */}
              {selectedQuery.parameters && selectedQuery.parameters.length > 0 && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
                  <span className="font-semibold text-slate-700 flex items-center space-x-1">
                    <Sliders className="w-3.5 h-3.5 text-slate-500" />
                    <span>Query Parameters</span>
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

              {/* Execute Button & Stats */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  onClick={handleExecute}
                  disabled={executing}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm flex items-center space-x-1.5 transition disabled:opacity-50"
                >
                  <Play className={`w-3.5 h-3.5 ${executing ? 'animate-spin' : ''}`} />
                  <span>{executing ? 'Executing SQL...' : 'Run Query'}</span>
                </button>

                {result && (
                  <div className="flex items-center space-x-3 text-xs text-slate-500">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{result.execution_time_ms} ms</span>
                    </span>
                    <span className="font-semibold text-slate-800">
                      {result.count} row{result.count > 1 ? 's' : ''} returned
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Results Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* View Switcher Tabs */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 bg-slate-50/50">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Query Output
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setViewMode('results')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded flex items-center space-x-1 transition ${
                    viewMode === 'results'
                      ? 'bg-white shadow-sm text-slate-900 border border-slate-200'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <TableIcon className="w-3 h-3" />
                  <span>Results Table</span>
                </button>
                <button
                  onClick={() => setViewMode('sql')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded flex items-center space-x-1 transition ${
                    viewMode === 'sql'
                      ? 'bg-white shadow-sm text-slate-900 border border-slate-200'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Code2 className="w-3 h-3" />
                  <span>SQL Source</span>
                </button>
              </div>
            </div>

            {/* Results Content */}
            <div className="p-4">
              {executing ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                  Executing parameterized query against MySQL 8.0 server...
                </div>
              ) : viewMode === 'sql' ? (
                <pre className="p-4 bg-slate-900 text-blue-300 rounded-lg text-xs font-mono overflow-x-auto max-h-96 leading-relaxed">
                  {result?.sql || selectedQuery?.sql}
                </pre>
              ) : !result || result.rows.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No records returned. Click &ldquo;Run Query&rdquo; to execute.
                </div>
              ) : (
                <div className="overflow-x-auto text-xs max-h-[500px]">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-slate-100 z-10">
                      <tr className="border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                        {result.columns.map((col: string) => (
                          <th key={col} className="py-2.5 px-3 whitespace-nowrap">
                            {col.replace('_', ' ')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {result.rows.map((row: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/70 transition">
                          {result.columns.map((col: string) => (
                            <td key={col} className="py-2.5 px-3 font-medium text-slate-800 whitespace-nowrap">
                              {typeof row[col] === 'number'
                                ? col.includes('amount') || col.includes('price') || col.includes('revenue') || col.includes('spend') || col.includes('cost') || col.includes('balance') || col.includes('paid')
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
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
