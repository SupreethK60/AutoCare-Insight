'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { Badge } from '@/components/ui/Badge';
import {
  Sparkles,
  Search,
  Zap,
  Wrench,
  Clock,
  ExternalLink,
  ShieldAlert,
  HelpCircle,
  Package,
  Layers,
  ArrowRight
} from 'lucide-react';

interface SearchResult {
  id: string;
  source: 'knowledge_base' | 'mongodb_report';
  symptom: string;
  category: string;
  possibleCauses: string[];
  recommendedAction: string;
  suggestedParts: string[];
  severity: string;
  similarityScore: number;
  matchPercentage: string;
  reportId?: string;
  jobId?: number;
  vehicleId?: number;
}

const SAMPLE_QUERIES = [
  'My car vibrates when accelerating and makes a clicking sound',
  'High-pitched squealing and pedal shudder when braking',
  'Engine ticking at idle with check engine light flashing',
  'Air conditioning blowing warm air with faint hissing sound',
  'Vehicle pulling hard to the left at highway speeds'
];

export default function SemanticSearchPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<'all' | 'knowledge_base' | 'mongodb_report'>('all');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchMeta, setSearchMeta] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (searchQuery: string = query) => {
    if (!searchQuery || searchQuery.trim().length < 2) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/search/semantic?q=${encodeURIComponent(searchQuery)}&scope=${scope}&limit=5`
      );
      const json = await res.json();
      if (res.ok && json.success) {
        setResults(json.data.results || []);
        setSearchMeta(json.data);
      } else {
        setError(json.error?.message || 'Semantic search failed');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to communicate with vector search engine');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'High':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Medium':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <Sparkles className="w-8 h-8 text-indigo-600" />
            <span>Diagnostic Semantic & Vector Search</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Search vehicle symptoms, failure descriptions, and technician observations using natural language dense embeddings.
          </p>
        </div>
      </div>

      {/* Search Input Box */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="space-y-3"
        >
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              placeholder="Describe symptoms in plain natural language (e.g. car shakes when accelerating and brakes squeal)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-11 pr-28 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="absolute right-2 top-2 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Vector Match'}
            </button>
          </div>

          {/* Scope Filters & Metadata */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <span className="text-slate-500 font-semibold">Search Corpus:</span>
              <div className="flex items-center space-x-1">
                {(['all', 'knowledge_base', 'mongodb_report'] as const).map((sc) => (
                  <button
                    key={sc}
                    type="button"
                    onClick={() => setScope(sc)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition ${
                      scope === sc
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {sc.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-slate-400 font-mono text-[11px]">
              Dense 64D Space &bull; Cosine Metric &bull; L2 Normalized
            </div>
          </div>
        </form>

        {/* Example Query Chips */}
        <div className="pt-2 border-t border-slate-100 space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Suggested Symptom Searches:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_QUERIES.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuery(sample);
                  handleSearch(sample);
                }}
                className="text-[11px] text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 rounded-lg px-2.5 py-1 text-left transition"
              >
                &ldquo;{sample}&rdquo;
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Educational Notice Banner */}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start space-x-2.5">
        <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Diagnostic Decision Support:</strong> Similarity scores reflect vector angle alignment between your query and historical multi-point inspection findings. Results serve as educational guidance for qualified automotive technicians and do not replace physical vehicle inspection.
        </p>
      </div>

      {/* Results List */}
      {searchMeta && (
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>
            Found <strong>{results.length}</strong> matching diagnostic record{results.length > 1 ? 's' : ''} in{' '}
            <strong>{searchMeta.search_duration_ms} ms</strong>
          </span>
          <span className="font-mono text-[11px] text-slate-400">
            Model: {searchMeta.model}
          </span>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="p-16 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200 shadow-sm">
            <Sparkles className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
            Computing 64-dimensional semantic dense vector and ranking cosine similarities...
          </div>
        ) : results.length === 0 && searchMeta ? (
          <div className="p-16 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200 shadow-sm">
            No diagnostic records matched the specified similarity threshold.
          </div>
        ) : (
          results.map((item, idx) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition space-y-3"
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>
                  <span className="font-bold text-slate-900 text-sm">{item.category}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${getSeverityBadge(
                      item.severity
                    )}`}
                  >
                    {item.severity} Severity
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-600">
                    {item.source === 'knowledge_base' ? 'Knowledge Base' : `MongoDB Report #${item.jobId}`}
                  </span>
                </div>

                {/* Similarity Score Pill */}
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: item.matchPercentage }}
                    />
                  </div>
                  <span className="font-black text-indigo-700 text-xs">{item.matchPercentage}</span>
                </div>
              </div>

              {/* Symptom / Description */}
              <p className="text-xs text-slate-800 font-medium leading-relaxed bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                &ldquo;{item.symptom}&rdquo;
              </p>

              {/* Diagnosis & Recommended Action */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                  <span className="font-bold text-slate-700 block">Identified Root Causes:</span>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-600 text-[11px]">
                    {item.possibleCauses.map((cause, cIdx) => (
                      <li key={cIdx}>{cause}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 space-y-1">
                  <span className="font-bold text-indigo-950 block">Recommended Technician Action:</span>
                  <p className="text-indigo-900 text-[11px] leading-relaxed">
                    {item.recommendedAction}
                  </p>
                </div>
              </div>

              {/* Suggested Parts & Footer */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                {item.suggestedParts && item.suggestedParts.length > 0 && (
                  <div className="flex items-center space-x-1.5 flex-wrap">
                    <Package className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-500 font-semibold text-[11px]">Associated Parts:</span>
                    {item.suggestedParts.map((part, pIdx) => (
                      <span
                        key={pIdx}
                        className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium"
                      >
                        {part}
                      </span>
                    ))}
                  </div>
                )}

                {item.reportId && (
                  <Link
                    href={`/reports?job_id=${item.jobId}`}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 ml-auto shrink-0"
                  >
                    <span>View Inspection Audit</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

