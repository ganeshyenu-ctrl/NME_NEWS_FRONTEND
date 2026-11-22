import type { Metadata } from 'next';
import './globals.css';
import StoreProvider from '@/store/StoreProvider';
import BreakingNewsBanner from '@/components/website/BreakingNewsBanner';

export const metadata: Metadata = {
  title: 'NME | Navigating Marine Excellence',
  description: 'Independent Perspectives. Informed Maritime Decisions. Editorial journalism and real-time maritime intelligence.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-GB" className="h-full">
      <body className="min-h-full flex flex-col bg-white text-ink">
        <StoreProvider>
          <BreakingNewsBanner />
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}
