import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Monetizely Quoting Tool",
  description: "Build and manage quotes for SaaS products",
};

function Navigation() {
  return (
    <nav className="bg-slate-900 text-white shadow-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="font-bold text-xl tracking-tight">
              Monetizely
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link 
              href="/catalog" 
              className="px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-800 transition-colors"
            >
              Catalog
            </Link>
            <Link 
              href="/quotes" 
              className="px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-800 transition-colors"
            >
              Quotes
            </Link>
            <Link 
              href="/quotes/new" 
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-medium transition-colors"
            >
              New Quote
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50">
        <Navigation />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
