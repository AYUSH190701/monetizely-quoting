'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatCurrency, TERM_DISPLAY_NAMES, TermLength, calculateQuote, PricingModel } from '@/lib/pricing';

interface QuoteAddOn {
  id: string;
  featureName: string;
  pricingModel: string;
  price: number;
  quantity: number;
}

interface Quote {
  id: string;
  name: string;
  customerName: string | null;
  productName: string;
  tierName: string;
  basePricePerSeat: number;
  seats: number;
  termLength: string;
  discountPercent: number;
  createdAt: string;
  addOns: QuoteAddOn[];
}

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuotes();
  }, []);

  async function fetchQuotes() {
    try {
      const res = await fetch('/api/quotes');
      if (!res.ok) throw new Error('Failed to fetch quotes');
      const data = await res.json();
      setQuotes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  function getQuoteTotal(quote: Quote): number {
    const addOns = quote.addOns.map((a) => ({
      featureName: a.featureName,
      pricingModel: a.pricingModel as PricingModel,
      price: a.price,
      quantity: a.quantity,
    }));

    const result = calculateQuote(
      quote.productName,
      quote.tierName,
      quote.basePricePerSeat,
      quote.seats,
      quote.termLength as TermLength,
      addOns,
      quote.discountPercent
    );

    return result.totalTerm;
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/4 mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Quotes</h1>
          <p className="text-slate-600 mt-1">View and manage all saved quotes</p>
        </div>
        <Link
          href="/quotes/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          + New Quote
        </Link>
      </div>

      {quotes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">No quotes yet</h3>
          <p className="text-slate-600 mb-6">
            Create your first quote for a customer.
          </p>
          <Link
            href="/quotes/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Create Your First Quote
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {quotes.map((quote) => (
            <div key={quote.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <Link
                href={`/quotes/${quote.id}`}
                className="block p-6 hover:bg-slate-50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">{quote.name}</h2>
                    {quote.customerName && (
                      <p className="text-slate-600 mt-1">Customer: {quote.customerName}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-900">
                      {formatCurrency(getQuoteTotal(quote))}
                    </p>
                    <p className="text-sm text-slate-500">
                      {TERM_DISPLAY_NAMES[quote.termLength as TermLength]}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex gap-6 text-sm">
                  <div>
                    <span className="text-slate-500">Product:</span>{' '}
                    <span className="font-medium text-slate-700">{quote.productName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Tier:</span>{' '}
                    <span className="font-medium text-slate-700">{quote.tierName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Seats:</span>{' '}
                    <span className="font-medium text-slate-700">{quote.seats}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Created:</span>{' '}
                    <span className="font-medium text-slate-700">
                      {new Date(quote.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
