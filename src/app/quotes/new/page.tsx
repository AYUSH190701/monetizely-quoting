'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  formatCurrency,
  centsToDollars,
  basisPointsToPercent,
  percentToBasisPoints,
  calculateQuote,
  TERM_DISPLAY_NAMES,
  TERM_MONTHS,
  TermLength,
  PricingModel,
  QuoteAddOnInput,
} from '@/lib/pricing';

interface Tier {
  id: string;
  name: string;
  basePrice: number;
  featureConfigs: {
    id: string;
    availability: string;
    pricingModel: string | null;
    price: number | null;
    feature: {
      id: string;
      name: string;
      description: string | null;
    };
  }[];
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  tiers: Tier[];
}

interface SelectedAddOn {
  featureTierConfigId: string;
  featureName: string;
  pricingModel: PricingModel;
  price: number;
  quantity: number;
}

export default function NewQuotePage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [quoteName, setQuoteName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedTierId, setSelectedTierId] = useState('');
  const [seats, setSeats] = useState(1);
  const [termLength, setTermLength] = useState<TermLength>('annual');
  const [selectedAddOns, setSelectedAddOns] = useState<SelectedAddOn[]>([]);
  const [discountPercent, setDiscountPercent] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      setProducts(data);

      // Pre-select first product if available
      if (data.length > 0 && data[0].tiers.length > 0) {
        setSelectedProductId(data[0].id);
        setSelectedTierId(data[0].tiers[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  // Get selected product and tier
  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const selectedTier = selectedProduct?.tiers.find((t) => t.id === selectedTierId);

  // Get available add-ons for selected tier
  const availableAddOns = useMemo(() => {
    if (!selectedTier) return [];
    return selectedTier.featureConfigs
      .filter((config) => config.availability === 'addon')
      .map((config) => ({
        id: config.id,
        featureName: config.feature.name,
        description: config.feature.description,
        pricingModel: config.pricingModel as PricingModel,
        price: config.price || 0,
      }));
  }, [selectedTier]);

  // Get included features for selected tier
  const includedFeatures = useMemo(() => {
    if (!selectedTier) return [];
    return selectedTier.featureConfigs
      .filter((config) => config.availability === 'included')
      .map((config) => ({
        id: config.id,
        featureName: config.feature.name,
        description: config.feature.description,
      }));
  }, [selectedTier]);

  // Calculate quote preview
  const quotePreview = useMemo(() => {
    if (!selectedProduct || !selectedTier) return null;

    const addOnInputs: QuoteAddOnInput[] = selectedAddOns.map((a) => ({
      featureName: a.featureName,
      pricingModel: a.pricingModel,
      price: a.price,
      quantity: a.quantity,
    }));

    const discount = discountPercent ? percentToBasisPoints(parseFloat(discountPercent)) : 0;

    return calculateQuote(
      selectedProduct.name,
      selectedTier.name,
      selectedTier.basePrice,
      seats,
      termLength,
      addOnInputs,
      discount
    );
  }, [selectedProduct, selectedTier, seats, termLength, selectedAddOns, discountPercent]);

  function toggleAddOn(addOn: typeof availableAddOns[0]) {
    const existing = selectedAddOns.find((a) => a.featureTierConfigId === addOn.id);
    if (existing) {
      setSelectedAddOns((prev) => prev.filter((a) => a.featureTierConfigId !== addOn.id));
    } else {
      setSelectedAddOns((prev) => [
        ...prev,
        {
          featureTierConfigId: addOn.id,
          featureName: addOn.featureName,
          pricingModel: addOn.pricingModel,
          price: addOn.price,
          quantity: addOn.pricingModel === 'per_seat' ? seats : 1,
        },
      ]);
    }
  }

  function updateAddOnQuantity(configId: string, quantity: number) {
    setSelectedAddOns((prev) =>
      prev.map((a) => (a.featureTierConfigId === configId ? { ...a, quantity } : a))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProduct || !selectedTier) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: quoteName,
          customerName: customerName || null,
          productId: selectedProductId,
          tierId: selectedTierId,
          seats,
          termLength,
          discountPercent: discountPercent ? percentToBasisPoints(parseFloat(discountPercent)) : 0,
          addOns: selectedAddOns.map((a) => ({
            featureTierConfigId: a.featureTierConfigId,
            quantity: a.quantity,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create quote');
      }

      const quote = await res.json();
      router.push(`/quotes/${quote.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setSaving(false);
    }
  }

  // Reset tier and add-ons when product changes
  function handleProductChange(productId: string) {
    setSelectedProductId(productId);
    const product = products.find((p) => p.id === productId);
    if (product?.tiers.length) {
      setSelectedTierId(product.tiers[0].id);
    } else {
      setSelectedTierId('');
    }
    setSelectedAddOns([]);
  }

  // Reset add-ons when tier changes
  function handleTierChange(tierId: string) {
    setSelectedTierId(tierId);
    setSelectedAddOns([]);
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/4 mb-8"></div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="h-96 bg-slate-200 rounded"></div>
            <div className="h-96 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <h3 className="text-lg font-medium text-slate-900 mb-2">No products available</h3>
          <p className="text-slate-600 mb-6">
            You need to set up at least one product with pricing tiers before creating a quote.
          </p>
          <Link
            href="/catalog/products/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Create a Product
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link
          href="/quotes"
          className="inline-flex items-center text-slate-600 hover:text-slate-900"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Quotes
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-slate-900 mb-8">Create New Quote</h1>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column - Quote Configuration */}
          <div className="space-y-6">
            {/* Quote Details */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Quote Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Quote Name *
                  </label>
                  <input
                    type="text"
                    value={quoteName}
                    onChange={(e) => setQuoteName(e.target.value)}
                    required
                    placeholder="e.g., Acme Corp - Q3 2026 proposal"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g., Acme Corporation"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Product Selection */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Product Selection</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Product *
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => handleProductChange(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="">Select a product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id} disabled={product.tiers.length === 0}>
                        {product.name} {product.tiers.length === 0 ? '(no tiers)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedProduct && selectedProduct.tiers.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Tier *
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {selectedProduct.tiers.map((tier) => (
                        <label
                          key={tier.id}
                          className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedTierId === tier.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center">
                            <input
                              type="radio"
                              name="tier"
                              value={tier.id}
                              checked={selectedTierId === tier.id}
                              onChange={() => handleTierChange(tier.id)}
                              className="sr-only"
                            />
                            <span className="font-medium text-slate-900">{tier.name}</span>
                          </div>
                          <span className="text-slate-600">
                            {formatCurrency(tier.basePrice)}/seat/mo
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Seats *
                    </label>
                    <input
                      type="number"
                      value={seats}
                      onChange={(e) => setSeats(Math.max(1, parseInt(e.target.value) || 1))}
                      required
                      min="1"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Term Length *
                    </label>
                    <select
                      value={termLength}
                      onChange={(e) => setTermLength(e.target.value as TermLength)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      {(Object.keys(TERM_DISPLAY_NAMES) as TermLength[]).map((term) => (
                        <option key={term} value={term}>
                          {TERM_DISPLAY_NAMES[term]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Included Features */}
            {includedFeatures.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Included in this Tier</h2>
                <div className="space-y-2">
                  {includedFeatures.map((feature) => (
                    <div key={feature.id} className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold">✓</span>
                      <div>
                        <p className="font-medium text-slate-900">{feature.featureName}</p>
                        {feature.description && (
                          <p className="text-sm text-slate-500">{feature.description}</p>
                        )}
                      </div>
                      <span className="ml-auto text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full whitespace-nowrap">Included</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add-ons */}
            {availableAddOns.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Available Add-ons</h2>
                <div className="space-y-3">
                  {availableAddOns.map((addOn) => {
                    const isSelected = selectedAddOns.some(
                      (a) => a.featureTierConfigId === addOn.id
                    );
                    const selectedAddOn = selectedAddOns.find(
                      (a) => a.featureTierConfigId === addOn.id
                    );

                    return (
                      <div
                        key={addOn.id}
                        className={`p-4 border rounded-lg transition-colors ${
                          isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <label className="flex items-start cursor-pointer flex-1">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleAddOn(addOn)}
                              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                            />
                            <div className="ml-3">
                              <span className="font-medium text-slate-900">{addOn.featureName}</span>
                              {addOn.description && (
                                <p className="text-sm text-slate-500">{addOn.description}</p>
                              )}
                              <p className="text-sm text-slate-600 mt-1">
                                {addOn.pricingModel === 'fixed' && (
                                  <>{formatCurrency(addOn.price)}/month</>
                                )}
                                {addOn.pricingModel === 'per_seat' && (
                                  <>{formatCurrency(addOn.price)}/seat/month</>
                                )}
                                {addOn.pricingModel === 'percentage' && (
                                  <>{basisPointsToPercent(addOn.price)}% of product cost</>
                                )}
                              </p>
                            </div>
                          </label>
                        </div>

                        {isSelected && addOn.pricingModel === 'per_seat' && (
                          <div className="mt-3 ml-7">
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                              Number of seats for this add-on
                            </label>
                            <input
                              type="number"
                              value={selectedAddOn?.quantity || 1}
                              onChange={(e) =>
                                updateAddOnQuantity(
                                  addOn.id,
                                  Math.max(1, parseInt(e.target.value) || 1)
                                )
                              }
                              min="1"
                              className="w-24 px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Discount */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Discount</h2>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Additional Discount (%)
                </label>
                <div className="relative w-32">
                  <input
                    type="number"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="0"
                    className="w-full px-3 py-2 pr-8 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  <span className="absolute right-3 top-2 text-slate-500">%</span>
                </div>
                <p className="text-sm text-slate-500 mt-2">
                  This discount is applied on top of any term-based discounts.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Quote Preview */}
          <div className="md:sticky md:top-20 h-fit">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Quote Preview</h2>

              {!selectedProduct || !selectedTier ? (
                <p className="text-slate-500 text-center py-8">
                  Select a product and tier to see the quote preview.
                </p>
              ) : quotePreview ? (
                <div className="space-y-4">
                  <div className="pb-4 border-b border-slate-200">
                    <p className="text-slate-600">
                      <span className="font-medium">{selectedProduct.name}</span> -{' '}
                      {selectedTier.name}
                    </p>
                    <p className="text-slate-600">
                      {seats} {seats === 1 ? 'seat' : 'seats'} ×{' '}
                      {TERM_MONTHS[termLength]} months
                    </p>
                  </div>

                  {/* Line Items */}
                  <div className="space-y-2">
                    {quotePreview.lineItems.map((item, idx) => (
                      <div
                        key={idx}
                        className={`flex justify-between text-sm ${
                          item.type === 'discount' ? 'text-green-600' : 'text-slate-700'
                        }`}
                      >
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-slate-500">{item.description}</p>
                        </div>
                        <span className={item.type === 'discount' ? '' : 'font-medium'}>
                          {formatCurrency(item.termAmount)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="pt-4 border-t border-slate-200">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-900">Total</span>
                      <span className="text-2xl font-bold text-slate-900">
                        {formatCurrency(quotePreview.totalTerm)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 text-right mt-1">
                      ({formatCurrency(quotePreview.totalMonthly)}/month)
                    </p>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={saving || !quoteName.trim() || !selectedProductId || !selectedTierId}
              className="w-full mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg font-medium transition-colors"
            >
              {saving ? 'Saving Quote...' : 'Save Quote'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
