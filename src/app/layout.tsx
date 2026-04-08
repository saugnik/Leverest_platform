import type { Metadata } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/auth-context';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Leverest Fintech | Deal Management Platform',
  description:
    'Enterprise-grade financial intermediary platform for Leverest Fintech — connecting clients with the right banking partners.',
  keywords: 'fintech, loan management, financial intermediary, Leverest, Kolkata',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif', background: '#03080F', color: '#EEF2FF' }}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
