import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '../lib/auth/AuthContext';
import { WorkspaceProvider } from '../lib/workspace/WorkspaceContext';
import Navigation from './components/ui/navigation';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Thinkhaven",
  description: "AI-powered strategic thinking workspace with dual-pane interface for coaching and visual exploration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <Navigation />
          {/* WorkspaceProvider temporarily disabled - missing user_workspace table */}
          {/* <WorkspaceProvider> */}
            {children}
          {/* </WorkspaceProvider> */}
        </AuthProvider>
      </body>
    </html>
  );
}