export default function HomePage() {
  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 rounded-2xl p-8 text-white shadow-lg">
        <div className="max-w-3xl">
          <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
            Experiential Learning Project
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            AutoCare Insight
          </h1>
          <p className="mt-2 text-lg text-blue-100 font-medium">
            Vehicle Service Management & Predictive Maintenance System
          </p>
          <p className="mt-4 text-sm text-blue-200 leading-relaxed">
            A dual-database enterprise platform integrating MySQL relational schemas with MongoDB document stores
            for intelligent automotive maintenance tracking, service scheduling, spare parts inventory control, and diagnostic reporting.
          </p>
        </div>
      </div>

      {/* Scaffolding Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              ✓
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Phase 2: Database Design</h2>
              <span className="text-xs text-emerald-600 font-medium">Design & DDL Complete</span>
            </div>
          </div>
          <p className="text-xs text-slate-600 mb-4 leading-relaxed">
            13 Relational MySQL tables, 3 Views, 3 Stored Procedures, 4 Triggers, 2 Stored Functions, MongoDB JSON Schema validator, and full CSV ingestion pipelines.
          </p>
          <div className="text-[11px] font-mono bg-slate-50 border border-slate-100 rounded p-2 text-slate-600">
            database/*.sql & 06_mongodb_schema.js
          </div>
        </div>

        <div className="bg-white rounded-xl border border-blue-200 ring-2 ring-blue-500/20 p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              3
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Phase 3: Scaffolding</h2>
              <span className="text-xs text-blue-600 font-medium">Scaffolding Implemented</span>
            </div>
          </div>
          <p className="text-xs text-slate-600 mb-4 leading-relaxed">
            Next.js App Router, TypeScript strict typing, Tailwind CSS styling, environment configuration (.env), and dual-database connection clients.
          </p>
          <div className="text-[11px] font-mono bg-blue-50 border border-blue-100 rounded p-2 text-blue-700">
            src/lib/db.ts & src/lib/mongodb.ts
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              4
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Phase 4: Backend / API</h2>
              <span className="text-xs text-amber-600 font-medium">Ready for Implementation</span>
            </div>
          </div>
          <p className="text-xs text-slate-600 mb-4 leading-relaxed">
            Next step: implement RESTful API route handlers for RBAC Authentication, Appointments, Service Jobs, Inventory Parts, and MongoDB Inspection Reports.
          </p>
          <div className="text-[11px] font-mono bg-slate-50 border border-slate-100 rounded p-2 text-slate-600">
            src/app/api/*
          </div>
        </div>
      </div>

      {/* Architecture Overview */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900 mb-4">
          Dual-Database Architecture Overview
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
            <div className="font-bold text-slate-800 mb-1">SQL Paradigm: MySQL 8.0 (Structured Core)</div>
            <ul className="list-disc list-inside space-y-1 text-slate-600">
              <li>ACID transactions for service orders and invoice settlements</li>
              <li>Strict relational integrity across 18 Foreign Key constraints</li>
              <li>Stored procedures for appointment booking and invoice generation</li>
              <li>Triggers for automatic stock deduction and maintenance alerts</li>
            </ul>
          </div>
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
            <div className="font-bold text-slate-800 mb-1">NoSQL Paradigm: MongoDB 8.2 (Unstructured Inspections)</div>
            <ul className="list-disc list-inside space-y-1 text-slate-600">
              <li>Dynamic polymorphic schemas for multi-point vehicle inspection findings</li>
              <li>JSON Schema validation ensuring data consistency</li>
              <li>Aggregation pipelines computing fleet health metrics and subsystem failure trends</li>
              <li>Bi-directional cross-paradigm linking: service_jobs.mongo_report_id</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

