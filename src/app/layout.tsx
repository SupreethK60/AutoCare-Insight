import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AutoCare Insight — Vehicle Service Management & Predictive Maintenance',
  description: 'DBMS Experiential Learning Level 3 Project - Next.js, MySQL & MongoDB',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col font-sans">
        <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                AC
              </div>
              <div>
                <span className="text-xl font-bold text-slate-900 tracking-tight">AutoCare Insight</span>
                <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Level 3 DBMS</span>
              </div>
            </div>
            <div className="text-xs text-slate-500 font-mono">
              Phase 3 Scaffolding Active
            </div>
          </div>
        </header>
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500">
          AutoCare Insight — PES University CSE Dept &copy; 2026. All rights reserved.
        </footer>
      </body>
    </html>
  );
}

