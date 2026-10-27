import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/context/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';

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
      <body className="antialiased min-h-screen font-sans bg-slate-50 text-slate-900">
        <AuthProvider>
          <AppLayout>{children}</AppLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
