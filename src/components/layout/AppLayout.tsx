'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { UserRole } from '@/types';
import {
  LayoutDashboard,
  Calendar,
  Wrench,
  ClipboardCheck,
  Car,
  Package,
  Receipt,
  Users,
  Shield,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Sparkles
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['admin', 'service_advisor', 'mechanic']
  },
  {
    name: 'Appointments',
    href: '/appointments',
    icon: Calendar,
    roles: ['admin', 'service_advisor']
  },
  {
    name: 'Workshop Jobs',
    href: '/jobs',
    icon: Wrench,
    roles: ['admin', 'service_advisor', 'mechanic']
  },
  {
    name: 'Repair Reports',
    href: '/reports',
    icon: ClipboardCheck,
    roles: ['admin', 'service_advisor', 'mechanic']
  },
  {
    name: 'Vehicle Catalogue',
    href: '/catalogue',
    icon: Car,
    roles: ['admin', 'service_advisor', 'mechanic']
  },
  {
    name: 'Spare Parts Inventory',
    href: '/inventory',
    icon: Package,
    roles: ['admin', 'service_advisor', 'mechanic']
  },
  {
    name: 'Invoices & Billing',
    href: '/invoices',
    icon: Receipt,
    roles: ['admin', 'service_advisor']
  },
  {
    name: 'Customers',
    href: '/customers',
    icon: Users,
    roles: ['admin', 'service_advisor']
  },
  {
    name: 'Registered Vehicles',
    href: '/vehicles',
    icon: Car,
    roles: ['admin', 'service_advisor', 'mechanic']
  }
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, switchDemoRole } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const currentRole = user?.role || 'admin';

  const visibleNavItems = NAV_ITEMS.filter((item) => item.roles.includes(currentRole));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left brand & mobile hamburger */}
            <div className="flex items-center space-x-3">
              <button
                type="button"
                className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle navigation"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              <Link href="/dashboard" className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-xl shadow-md shadow-blue-500/20">
                  AC
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-slate-900 tracking-tight">AutoCare Insight</span>
                    <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      Level 3 DBMS
                    </span>
                  </div>
                  <span className="hidden sm:block text-xs text-slate-500 font-medium">
                    Dual-Database Vehicle Service & Predictive Analytics
                  </span>
                </div>
              </Link>
            </div>

            {/* Right actions: Role Switcher & User Profile */}
            <div className="flex items-center space-x-3">
              {/* Demo Role Switcher */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition"
                  title="Switch RBAC Role (Admin, Service Advisor, Mechanic)"
                >
                  <Shield className="w-3.5 h-3.5 text-blue-600" />
                  <span className="capitalize">{currentRole.replace('_', ' ')}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {roleDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                    <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Demo Role Switcher (RBAC)
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        switchDemoRole('admin');
                        setRoleDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 ${
                        currentRole === 'admin' ? 'font-bold text-blue-600 bg-blue-50/50' : 'text-slate-700'
                      }`}
                    >
                      <div>
                        <div>Admin</div>
                        <div className="text-[10px] text-slate-400">Full platform & financial access</div>
                      </div>
                      {currentRole === 'admin' && <span className="text-blue-600 font-bold">✓</span>}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        switchDemoRole('service_advisor');
                        setRoleDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 ${
                        currentRole === 'service_advisor' ? 'font-bold text-blue-600 bg-blue-50/50' : 'text-slate-700'
                      }`}
                    >
                      <div>
                        <div>Service Advisor</div>
                        <div className="text-[10px] text-slate-400">Appointments, billing, intake</div>
                      </div>
                      {currentRole === 'service_advisor' && <span className="text-blue-600 font-bold">✓</span>}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        switchDemoRole('mechanic');
                        setRoleDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 ${
                        currentRole === 'mechanic' ? 'font-bold text-blue-600 bg-blue-50/50' : 'text-slate-700'
                      }`}
                    >
                      <div>
                        <div>Mechanic</div>
                        <div className="text-[10px] text-slate-400">Jobs, MongoDB reports, parts</div>
                      </div>
                      {currentRole === 'mechanic' && <span className="text-blue-600 font-bold">✓</span>}
                    </button>
                  </div>
                )}
              </div>

              {/* User Avatar */}
              <div className="hidden sm:flex items-center space-x-2 pl-2 border-l border-slate-200">
                <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs uppercase">
                  {user?.full_name?.slice(0, 2) || 'AC'}
                </div>
                <div className="text-left text-xs">
                  <div className="font-semibold text-slate-900 leading-none">{user?.full_name || 'Loading...'}</div>
                  <div className="text-[10px] text-slate-500 capitalize">{user?.role?.replace('_', ' ') || 'Demo'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sub-header Navigation for desktop */}
        <nav className="hidden md:flex border-t border-slate-100 bg-slate-50/80 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto w-full flex space-x-1 py-1.5 overflow-x-auto">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Mobile menu drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1 shadow-lg">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Navigation</div>
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Page Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
          <div>AutoCare Insight &copy; 2026 PES University &bull; Experiential Learning Level 3</div>
          <div className="flex items-center space-x-4 text-slate-400">
            <span>MySQL 8.0</span>
            <span>&bull;</span>
            <span>MongoDB 8.2</span>
            <span>&bull;</span>
            <span>Next.js 14 App Router</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
