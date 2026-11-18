// frontend/app/(app)/upgrade/page.tsx
'use client';

import { useState } from 'react';
import { Check, Star, Zap } from 'lucide-react';

const PLANS = [
  {
    name: 'Free Forever',
    price: '$0',
    desc: 'Best for personal use',
    features: ['100MB Storage', 'Unlimited Tasks', 'Collaboration', 'Kanban Boards'],
    buttonText: 'Current Plan',
    highlight: false,
    disabled: true,
  },
  {
    name: 'Core',
    price: '$9',
    desc: 'Best for small teams',
    features: ['1,000 credits / user / mo', 'Trial Premium Model Usage', 'ClickUp Brain', 'Custom Fields & Task Types', 'Unlimited Storage and Spaces'],
    buttonText: 'Upgrade',
    highlight: false,
  },
  {
    name: 'Business',
    price: '$17',
    desc: 'Best for growing businesses',
    features: ['AI Included', 'Premium Models', 'Unlimited Standard Models', 'Advanced Dashboards', 'Webhooks & Automation Integrations', 'Google SSO + SMS 2FA'],
    buttonText: 'Upgrade',
    highlight: true,
    popular: true,
  },
  {
    name: 'Business Plus',
    price: '$28',
    desc: 'Best for complex, scaled teams',
    features: ['Expanded AI Included', '2,000 credits / user / mo', 'Unlimited SyncUp AI Notes', '100,000 Automations / mo', 'Advanced Time Tracking', 'Custom Permissions'],
    buttonText: 'Upgrade',
    highlight: false,
  }
];

export default function UpgradePage() {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('yearly');

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto min-h-full bg-[color:var(--c-1e1f21)] text-[color:var(--c-white)]">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex flex-wrap items-center gap-2 sm:gap-3">
            Plans 
            <span className="text-sm font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full flex items-center gap-1">
              <Check className="h-3 w-3" /> 30-day money-back guarantee
            </span>
          </h1>
          <p className="text-[color:var(--c-8a8c91)] mt-2">
            Your Workspace is currently on the <strong className="text-[color:var(--c-white)]">Free Forever Plan</strong>. You have used 1.75/60 MB.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-emerald-400 font-medium">Save up to 30% with yearly</span>
          <div className="flex bg-[color:var(--c-2a2b2e)] p-1 rounded-lg border border-[color:var(--c-333438)]">
            <button 
              onClick={() => setBilling('yearly')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${billing === 'yearly' ? 'bg-[color:var(--c-333438)] text-[color:var(--c-white)]' : 'text-[color:var(--c-8a8c91)] hover:text-[color:var(--c-white)]'}`}
            >
              Yearly
            </button>
            <button 
              onClick={() => setBilling('monthly')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${billing === 'monthly' ? 'bg-[color:var(--c-333438)] text-[color:var(--c-white)]' : 'text-[color:var(--c-8a8c91)] hover:text-[color:var(--c-white)]'}`}
            >
              Monthly
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLANS.map((plan) => (
          <div 
            key={plan.name} 
            className={`relative flex flex-col p-6 rounded-xl border ${
              plan.highlight 
                ? 'border-indigo-500 bg-[color:var(--c-2a2b2e)] shadow-lg shadow-indigo-500/10' 
                : 'border-[color:var(--c-333438)] bg-[color:var(--c-1e1f21)]'
            }`}
          >
            {plan.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Most Popular
              </span>
            )}

            <h2 className="text-xl font-bold">{plan.name}</h2>
            <p className="text-sm text-[color:var(--c-8a8c91)] mt-1 mb-6">{plan.desc}</p>
            
            <div className="mb-6">
              <span className="text-4xl font-extrabold">{plan.price}</span>
              <span className="text-sm text-[color:var(--c-8a8c91)] ml-1">{plan.disabled ? '' : 'user / mo · billed yearly'}</span>
            </div>

            <button 
              disabled={plan.disabled}
              className={`w-full py-2.5 rounded-lg font-semibold text-sm transition mb-6 ${
                plan.disabled 
                  ? 'bg-[color:var(--c-2a2b2e)] text-[color:var(--c-8a8c91)] cursor-not-allowed border border-[color:var(--c-333438)]'
                  : plan.highlight
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'
                    : 'bg-[color:var(--c-2a2b2e)] hover:bg-[color:var(--c-333438)] text-[color:var(--c-white)] border border-[color:var(--c-333438)]'
              }`}
            >
              {plan.buttonText}
            </button>

            <div className="flex-1 space-y-3">
              {plan.features.map(f => (
                <div key={f} className="flex items-start gap-2 text-sm text-[color:var(--c-e5e5e5)]">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}