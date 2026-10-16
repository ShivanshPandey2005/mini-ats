import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: 'Mini ATS - Applicant Tracking System',
  description:
    'A modern, lightweight Applicant Tracking System for managing candidates and recruitment pipelines.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${geistSans.variable} font-sans min-h-screen bg-slate-50 text-slate-900 antialiased`}>
        <div className="min-h-screen flex flex-col md:flex-row">
          <Sidebar />
          <div className="flex-1 md:pl-64 flex flex-col min-w-0">
            <main className="flex-1 pt-16 md:pt-0 p-4 sm:p-6 lg:p-8">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
