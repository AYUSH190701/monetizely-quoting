import Link from "next/link";

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">
          Monetizely Quoting Tool
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          A lightweight quoting application for modeling client pricing and producing quotes for customers.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Catalog Setup Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 hover:shadow-md transition-shadow">
          <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Catalog Setup</h2>
          <p className="text-slate-600 mb-6">
            Define your products, pricing tiers, and features. Configure how each feature is available across different tiers.
          </p>
          <Link 
            href="/catalog"
            className="inline-flex items-center text-blue-600 font-medium hover:text-blue-700"
          >
            Manage Catalog
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Quote Builder Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 hover:shadow-md transition-shadow">
          <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Quote Builder</h2>
          <p className="text-slate-600 mb-6">
            Create detailed quotes for customers with product selection, seat count, term length, add-ons, and discounts.
          </p>
          <Link 
            href="/quotes/new"
            className="inline-flex items-center text-green-600 font-medium hover:text-green-700"
          >
            Create New Quote
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-12 text-center">
        <h3 className="text-lg font-medium text-slate-900 mb-4">Quick Actions</h3>
        <div className="flex justify-center gap-4">
          <Link 
            href="/catalog/products/new"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 text-sm font-medium transition-colors"
          >
            + New Product
          </Link>
          <Link 
            href="/quotes"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 text-sm font-medium transition-colors"
          >
            View All Quotes
          </Link>
        </div>
      </div>
    </div>
  );
}
