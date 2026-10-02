import type { Metadata, Viewport } from 'next';
import './globals.css';
import Script from 'next/script';
import { PortalHeader } from '@/components/PortalHeader';

export const metadata: Metadata = {
  title: 'NexeraQuest — Telegram-Native Web3 Campaign Marketplace',
  description: 'QUEST. CONTRIBUTE. EARN. The decentralized marketplace connecting Web3 projects with verified contributors.',
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#090a0f',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className="bg-obsidian-950 text-slate-100 min-h-screen flex flex-col font-sans selection:bg-quest-violet/30 selection:text-white">
        <PortalHeader />
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
