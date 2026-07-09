'use client';

import { useEffect, useState, useCallback, use } from 'react';
import Link from 'next/link';
import { formatCurrency, centsToDollars, dollarsToCents, basisPointsToPercent, percentToBasisPoints } from '@/lib/pricing';

interface Tier {
  id: string;
  name: string;
  description: string | null;
  basePrice: number;
  displayOrder: number;
}

interface FeatureTierConfig {
  id: string;
  tierId: string;
  availability: 'included' | 'addon' | 'not_available';
  pricingModel: 'fixed' | 'per_seat' | 'percentage' | null;
  price: number | null;
  tier: Tier;
}

interface Feature {
  id: string;
  name: string;
  description: string | null;
  tierConfigs: FeatureTierConfig[];
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  tiers: Tier[];
  features: Feature[];
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showTierModal, setShowTierModal] = useState(false);
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [editingTier, setEditingTier] = useState<Tier | null>(null);
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);

  const fetchProduct = useCallback(async () => {
    try {
      const res = await fetch(`/api/products/${id}`);
      if (!res.ok) throw new Error('Failed to fetch product');
      const data = await res.json();
      setProduct(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/4 mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          Error: {error || 'Product not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link
          href="/catalog"
          className="inline-flex items-center text-slate-600 hover:text-slate-900"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Catalog
        </Link>
      </div>

      {/* Product Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
        <h1 className="text-3xl font-bold text-slate-900">{product.name}</h1>
        {product.description && (
          <p className="text-slate-600 mt-2">{product.description}</p>
        )}
      </div>

      {/* Tiers Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-slate-900">Pricing Tiers</h2>
          <button
            onClick={() => {
              setEditingTier(null);
              setShowTierModal(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
          >
            + Add Tier
          </button>
        </div>

        {product.tiers.length === 0 ? (
          <p className="text-slate-500 text-center py-8">
            No tiers defined yet. Add tiers like Starter, Growth, and Enterprise.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {product.tiers.map((tier) => (
              <div
                key={tier.id}
                className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors cursor-pointer"
                onClick={() => { setEditingTier(tier); setShowTierModal(true); }}
              >
                <h3 className="font-semibold text-slate-900">{tier.name}</h3>
                <p className="text-2xl font-bold text-blue-600 mt-2">
                  {formatCurrency(tier.basePrice)}
                  <span className="text-sm font-normal text-slate-500">/seat/mo</span>
                </p>
                {tier.description && (
                  <p className="text-sm text-slate-500 mt-2">{tier.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Features Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-slate-900">Features</h2>
          <button
            onClick={() => {
              setEditingFeature(null);
              setShowFeatureModal(true);
            }}
            disabled={product.tiers.length === 0}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg font-medium text-sm transition-colors"
          >
            + Add Feature
          </button>
        </div>

        {product.tiers.length === 0 ? (
          <p className="text-slate-500 text-center py-8">
            Add pricing tiers first before defining features.
          </p>
        ) : product.features.length === 0 ? (
          <p className="text-slate-500 text-center py-8">
            No features defined yet. Add features and configure their availability per tier.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-medium text-slate-700">Feature</th>
                  {product.tiers.map((tier) => (
                    <th key={tier.id} className="text-center py-3 px-4 font-medium text-slate-700">
                      {tier.name}
                    </th>
                  ))}
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {product.features.map((feature) => (
                  <tr key={feature.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">{feature.name}</div>
                      {feature.description && (
                        <div className="text-sm text-slate-500">{feature.description}</div>
                      )}
                    </td>
                    {product.tiers.map((tier) => {
                      const config = feature.tierConfigs.find((c) => c.tierId === tier.id);
                      return (
                        <td key={tier.id} className="py-3 px-4 text-center">
                          <FeatureAvailabilityBadge config={config} />
                        </td>
                      );
                    })}
                    <td className="py-3 px-4">
                      <button
                        onClick={() => { setEditingFeature(feature); setShowFeatureModal(true); }}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit feature"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tier Modal */}
      {showTierModal && (
        <TierModal
          productId={product.id}
          tier={editingTier}
          onClose={() => {
            setShowTierModal(false);
            setEditingTier(null);
          }}
          onSaved={() => {
            setShowTierModal(false);
            setEditingTier(null);
            fetchProduct();
          }}
        />
      )}

      {/* Feature Modal */}
      {showFeatureModal && (
        <FeatureModal
          productId={product.id}
          tiers={product.tiers}
          feature={editingFeature}
          onClose={() => {
            setShowFeatureModal(false);
            setEditingFeature(null);
          }}
          onSaved={() => {
            setShowFeatureModal(false);
            setEditingFeature(null);
            fetchProduct();
          }}
        />
      )}
    </div>
  );
}

function FeatureAvailabilityBadge({ config }: { config?: FeatureTierConfig }) {
  if (!config || config.availability === 'not_available') {
    return <span className="text-slate-400">—</span>;
  }

  if (config.availability === 'included') {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        ✓ Included
      </span>
    );
  }

  // Add-on
  let priceDisplay = '';
  if (config.pricingModel === 'fixed') {
    priceDisplay = `${formatCurrency(config.price || 0)}/mo`;
  } else if (config.pricingModel === 'per_seat') {
    priceDisplay = `${formatCurrency(config.price || 0)}/seat/mo`;
  } else if (config.pricingModel === 'percentage') {
    priceDisplay = `${basisPointsToPercent(config.price || 0)}%`;
  }

  return (
    <span className="inline-flex flex-col items-center">
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        + Add-on
      </span>
      <span className="text-xs text-slate-500 mt-1">{priceDisplay}</span>
    </span>
  );
}

function TierModal({
  productId,
  tier,
  onClose,
  onSaved,
}: {
  productId: string;
  tier: Tier | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(tier?.name || '');
  const [description, setDescription] = useState(tier?.description || '');
  const [basePriceDollars, setBasePriceDollars] = useState(
    tier ? centsToDollars(tier.basePrice).toString() : ''
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const basePrice = dollarsToCents(parseFloat(basePriceDollars) || 0);

    try {
      const url = tier ? `/api/tiers/${tier.id}` : `/api/products/${productId}/tiers`;
      const method = tier ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, basePrice }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save tier');
      }

      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">
          {tier ? 'Edit Tier' : 'Add New Tier'}
        </h2>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Tier Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g., Starter, Growth, Enterprise"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Base Price (per seat/month) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-500">$</span>
              <input
                type="number"
                value={basePriceDollars}
                onChange={(e) => setBasePriceDollars(e.target.value)}
                required
                min="0"
                step="0.01"
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Brief description of this tier"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-700 hover:text-slate-900 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim() || !basePriceDollars}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium"
            >
              {loading ? 'Saving...' : tier ? 'Update Tier' : 'Add Tier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FeatureModal({
  productId,
  tiers,
  feature,
  onClose,
  onSaved,
}: {
  productId: string;
  tiers: Tier[];
  feature: Feature | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(feature?.name || '');
  const [description, setDescription] = useState(feature?.description || '');
  const [tierConfigs, setTierConfigs] = useState<
    Record<string, { availability: string; pricingModel: string; price: string }>
  >(() => {
    const configs: Record<string, { availability: string; pricingModel: string; price: string }> = {};
    tiers.forEach((tier) => {
      const existing = feature?.tierConfigs.find((c) => c.tierId === tier.id);
      configs[tier.id] = {
        availability: existing?.availability || 'not_available',
        pricingModel: existing?.pricingModel || 'fixed',
        price: existing?.price
          ? existing.pricingModel === 'percentage'
            ? basisPointsToPercent(existing.price).toString()
            : centsToDollars(existing.price).toString()
          : '',
      };
    });
    return configs;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateTierConfig(tierId: string, updates: Partial<typeof tierConfigs[string]>) {
    setTierConfigs((prev) => ({
      ...prev,
      [tierId]: { ...prev[tierId], ...updates },
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Convert tier configs to the right format
    const configs = tiers.map((tier) => {
      const config = tierConfigs[tier.id];
      let price: number | null = null;

      if (config.availability === 'addon' && config.price) {
        if (config.pricingModel === 'percentage') {
          price = percentToBasisPoints(parseFloat(config.price));
        } else {
          price = dollarsToCents(parseFloat(config.price));
        }
      }

      return {
        tierId: tier.id,
        availability: config.availability,
        pricingModel: config.availability === 'addon' ? config.pricingModel : null,
        price,
      };
    });

    try {
      const url = feature
        ? `/api/features/${feature.id}`
        : `/api/products/${productId}/features`;
      const method = feature ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, tierConfigs: configs }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save feature');
      }

      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 py-8">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">
          {feature ? 'Edit Feature' : 'Add New Feature'}
        </h2>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Feature Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g., Single Sign-On"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-3">
              Availability per Tier
            </h3>
            <div className="space-y-4">
              {tiers.map((tier) => {
                const config = tierConfigs[tier.id];
                return (
                  <div key={tier.id} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-slate-900">{tier.name}</span>
                      <select
                        value={config.availability}
                        onChange={(e) =>
                          updateTierConfig(tier.id, { availability: e.target.value })
                        }
                        className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      >
                        <option value="not_available">Not Available</option>
                        <option value="included">Included</option>
                        <option value="addon">Paid Add-on</option>
                      </select>
                    </div>

                    {config.availability === 'addon' && (
                      <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-100">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            Pricing Model
                          </label>
                          <select
                            value={config.pricingModel}
                            onChange={(e) =>
                              updateTierConfig(tier.id, {
                                pricingModel: e.target.value,
                                price: '', // Reset price when model changes
                              })
                            }
                            className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          >
                            <option value="fixed">Fixed Monthly</option>
                            <option value="per_seat">Per Seat</option>
                            <option value="percentage">% of Product</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            {config.pricingModel === 'percentage' ? 'Percentage' : 'Price'}
                          </label>
                          <div className="relative">
                            <span className="absolute left-2 top-1.5 text-slate-500 text-sm">
                              {config.pricingModel === 'percentage' ? '%' : '$'}
                            </span>
                            <input
                              type="number"
                              value={config.price}
                              onChange={(e) =>
                                updateTierConfig(tier.id, { price: e.target.value })
                              }
                              min="0"
                              step={config.pricingModel === 'percentage' ? '0.1' : '0.01'}
                              placeholder="0"
                              className="w-full pl-6 pr-2 py-1.5 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-700 hover:text-slate-900 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium"
            >
              {loading ? 'Saving...' : feature ? 'Update Feature' : 'Add Feature'}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
