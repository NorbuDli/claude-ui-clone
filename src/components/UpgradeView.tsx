import React, { useState } from 'react';
import {
  ArrowLeft,
  Check,
  ArrowRight,
  Sparkles,
  Users,
  Building2,
  ShieldCheck,
  Zap,
  Layers,
  MessageSquare
} from 'lucide-react';
import { PaymentView } from './PaymentView';

interface UpgradeViewProps {
  onBack: () => void;
}

export const UpgradeView: React.FC<UpgradeViewProps> = ({ onBack }) => {
  const [activeCategory, setActiveCategory] = useState<'individual' | 'team'>('individual');
  const [proBillingCycle, setProBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [paymentPlan, setPaymentPlan] = useState<string | null>(null);

  // If a plan was selected for payment, show the PaymentView
  if (paymentPlan) {
    return (
      <PaymentView
        planName={paymentPlan}
        onBack={() => setPaymentPlan(null)}
      />
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#141413] text-[#ECEBE7] font-sans flex flex-col select-none overflow-y-auto">
      
      {/* 1. TOP MINIMAL HEADER */}
      <header className="h-14 px-6 sm:px-12 flex items-center border-b border-[#1F1E1C] shrink-0 sticky top-0 bg-[#141413]/95 backdrop-blur-sm z-30">
        <button
          onClick={onBack}
          className="flex items-center gap-2.5 text-xs font-medium text-[#9C9A92] hover:text-[#ECEBE7] transition-colors py-1.5 px-2 -ml-2 rounded-lg hover:bg-[#201F1D]"
        >
          <ArrowLeft className="w-4 h-4 text-[#8C8A82]" />
          <span className="text-sm font-medium">Upgrade</span>
        </button>
      </header>

      {/* 2. MAIN CONTAINER */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-8 py-10 sm:py-14 flex flex-col items-center">
        
        {/* Main Heading */}
        <h1 className="font-serif text-3xl sm:text-4xl text-[#ECEBE7] font-normal tracking-tight text-center mb-6">
          Plans that grow with you
        </h1>

        {/* 3. CATEGORY SEGMENTED CONTROL */}
        <div className="bg-[#1C1B19] p-1 rounded-2xl border border-[#2B2A27] flex items-center mb-10 shadow-sm">
          <button
            onClick={() => setActiveCategory('individual')}
            className={`px-5 py-2 rounded-xl text-xs font-medium transition-all ${
              activeCategory === 'individual'
                ? 'bg-[#2A2824] text-[#ECEBE7] shadow-sm'
                : 'text-[#8C8A82] hover:text-[#ECEBE7]'
            }`}
          >
            Individual
          </button>
          <button
            onClick={() => setActiveCategory('team')}
            className={`px-5 py-2 rounded-xl text-xs font-medium transition-all ${
              activeCategory === 'team'
                ? 'bg-[#2A2824] text-[#ECEBE7] shadow-sm'
                : 'text-[#8C8A82] hover:text-[#ECEBE7]'
            }`}
          >
            Team and Enterprise
          </button>
        </div>

        {/* 4. INDIVIDUAL CARDS (3 CARDS) */}
        {activeCategory === 'individual' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full max-w-5xl items-stretch">
            
            {/* CARD 1: FREE */}
            <div className="bg-[#1C1B19] rounded-3xl border border-[#282724] p-7 flex flex-col justify-between shadow-lg">
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-[#ECEBE7]">Free</h2>
                  <p className="text-xs text-[#8C8A82] mt-1">Meet your AI assistant</p>
                </div>

                <div className="py-2">
                  <div className="text-3xl sm:text-4xl font-bold tracking-tight text-[#ECEBE7]">₹0</div>
                </div>

                <button
                  disabled
                  className="w-full py-2.5 rounded-xl bg-[#242320] text-[#8C8A82] text-xs font-medium border border-[#2D2C28] cursor-default"
                >
                  Use for free
                </button>

                <div className="border-t border-[#242320] pt-6 space-y-3.5 text-xs text-[#B4B3AD]">
                  {[
                    'Chat on web, iOS, Android, and desktop',
                    'Generate code and visualize data',
                    'Connect supported apps and tools',
                    'Extended thinking for complex work',
                    'Built-in web search'
                  ].map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-snug">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CARD 2: PRO (CURRENT ACTIVE PLAN) */}
            <div className="bg-[#1E1D1B] rounded-3xl border-2 border-[#DA7756]/60 p-7 flex flex-col justify-between shadow-2xl relative">
              
              {/* Active Badge */}
              <div className="absolute -top-3.5 right-6 px-3 py-0.5 rounded-full bg-[#DA7756] text-white text-[11px] font-semibold shadow-md">
                Active Plan
              </div>

              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-[#ECEBE7] flex items-center gap-2">
                      <span>Pro</span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-sky-950/70 border border-sky-800/60 text-sky-400">
                        Pro
                      </span>
                    </h2>
                    <p className="text-xs text-[#8C8A82] mt-1">Research, code, and organize</p>
                  </div>

                  {/* Monthly / Yearly Billing Toggle */}
                  <div className="bg-[#141413] p-0.5 rounded-xl border border-[#2B2A27] flex items-center text-[10px]">
                    <button
                      onClick={() => setProBillingCycle('monthly')}
                      className={`px-2 py-1 rounded-lg transition-all ${
                        proBillingCycle === 'monthly'
                          ? 'bg-[#2A2824] text-[#ECEBE7] font-medium'
                          : 'text-[#7E7C76]'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setProBillingCycle('yearly')}
                      className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 ${
                        proBillingCycle === 'yearly'
                          ? 'bg-[#2A2824] text-[#ECEBE7] font-medium'
                          : 'text-[#7E7C76]'
                      }`}
                    >
                      <span>Yearly</span>
                      <span className="text-[9px] text-emerald-400 font-semibold">Save 17%</span>
                    </button>
                  </div>
                </div>

                <div className="py-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-bold tracking-tight text-[#ECEBE7]">
                      {proBillingCycle === 'yearly' ? '₹1,999' : '₹2,399'}
                    </span>
                    <span className="text-xs text-[#8C8A82]">/ month</span>
                  </div>
                </div>

                <div>
                  <button
                    disabled
                    className="w-full py-2.5 rounded-xl bg-sky-950/70 border border-sky-800/60 text-sky-300 text-xs font-semibold shadow transition-all cursor-default flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4 text-sky-400" />
                    <span>Current plan</span>
                  </button>
                  <p className="text-center text-[10px] text-[#706E68] mt-2">
                    No commitment · Cancel anytime
                  </p>
                </div>

                <div className="border-t border-[#2A2926] pt-6 space-y-3 text-xs">
                  <div className="font-semibold text-xs text-[#ECEBE7] mb-2">Everything in Free and:</div>
                  {[
                    'More usage and higher bandwidth',
                    'Advanced coding and analysis capabilities',
                    'Access to full model suite (Opus 5, Sonnet 5, Haiku 4.5)',
                    'More powerful agentic workflows',
                    'Interactive sandboxed React & HTML Artifacts',
                    'Long-term Memory across conversations'
                  ].map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-[#ECEBE7]">
                      <Check className="w-4 h-4 text-[#DA7756] shrink-0 mt-0.5" />
                      <span className="leading-snug">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CARD 3: MAX */}
            <div className="bg-[#1C1B19] rounded-3xl border border-[#282724] p-7 flex flex-col justify-between shadow-lg">
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-[#ECEBE7]">Max</h2>
                  <p className="text-xs text-[#8C8A82] mt-1">Higher limits, priority access</p>
                </div>

                <div className="py-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs text-[#8C8A82]">From</span>
                    <span className="text-3xl sm:text-4xl font-bold tracking-tight text-[#ECEBE7]">₹11,999</span>
                  </div>
                  <div className="text-[11px] text-[#706E68] mt-0.5">INR / month · billed monthly</div>
                </div>

                <div>
                  <button
                    onClick={() => setPaymentPlan('Max plan')}
                    className="w-full py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-semibold shadow transition-all active:scale-95"
                  >
                    Get Max plan
                  </button>
                  <p className="text-center text-[10px] text-[#706E68] mt-2">
                    No commitment · Cancel anytime
                  </p>
                </div>

                <div className="border-t border-[#242320] pt-6 space-y-3.5 text-xs text-[#B4B3AD]">
                  <div className="font-semibold text-xs text-[#ECEBE7] mb-2">Everything in Pro, plus:</div>
                  {[
                    'Highest token generation & output limits',
                    'Dedicated high-throughput priority access',
                    'Priority execution during peak traffic',
                    'Extended reasoning budgets and memory limits',
                    'Early preview access to cutting-edge models'
                  ].map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-snug">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* 5. TEAM AND ENTERPRISE TAB (2 CARDS) */}
        {activeCategory === 'team' && (
          <div className="w-full max-w-4xl space-y-6">
            
            {/* Contact Specialist Banner */}
            <div className="bg-[#1C1B19] rounded-2xl border border-[#2B2A27] p-4 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#242320] text-[#DA7756]">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-xs text-[#ECEBE7]">
                    Questions? Chat with our buying specialist.
                  </span>
                  <p className="text-[11px] text-[#8C8A82]">Get custom seat licensing, volume discounts, and migration support.</p>
                </div>
              </div>
              <button
                onClick={() => alert('Specialist support: contact@norbu-ai.workspace')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#252422] hover:bg-[#2E2D2A] text-xs text-[#ECEBE7] border border-[#33312E] transition-colors"
              >
                <span>Contact sales</span>
                <ArrowRight className="w-3 h-3 text-[#DA7756]" />
              </button>
            </div>

            {/* Team and Enterprise 2 Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* TEAM PLAN */}
              <div className="bg-[#1C1B19] rounded-3xl border border-[#282724] p-7 flex flex-col justify-between shadow-xl">
                <div className="space-y-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-[#ECEBE7]">Team</h2>
                      <p className="text-xs text-[#8C8A82] mt-1">Predictable usage per seat</p>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#242320] text-[#B4B3AD] border border-[#2D2C28]">
                      2–150 users
                    </span>
                  </div>

                  {/* Seats Breakdown */}
                  <div className="bg-[#141413] p-3.5 rounded-2xl border border-[#242320] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#8C8A82]">Standard seat</span>
                      <span className="font-semibold text-[#ECEBE7]">₹2,399 /mo</span>
                    </div>
                    <div className="border-t border-[#22211F]" />
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#8C8A82]">Premium seat</span>
                      <span className="font-semibold text-[#ECEBE7]">₹11,999 /mo</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setPaymentPlan('Team plan')}
                    className="w-full py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-semibold shadow transition-all active:scale-95"
                  >
                    Get Team plan
                  </button>

                  <div className="border-t border-[#242320] pt-6 space-y-3.5 text-xs text-[#B4B3AD]">
                    {[
                      'Includes advanced coding capabilities',
                      'Advanced design and collaborative workflow features',
                      'Connect supported services & organization cloud',
                      'Enterprise search and shared workspace projects',
                      'Central billing and seat administration',
                      'Single sign-on (SSO) integration',
                      'Admin controls and organization governance'
                    ].map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="leading-snug">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ENTERPRISE PLAN */}
              <div className="bg-[#1C1B19] rounded-3xl border border-[#282724] p-7 flex flex-col justify-between shadow-xl">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-[#ECEBE7]">Enterprise</h2>
                    <p className="text-xs text-[#8C8A82] mt-1">Flexible pooled usage</p>
                  </div>

                  <div className="bg-[#141413] p-3.5 rounded-2xl border border-[#242320]">
                    <div className="font-semibold text-xs text-[#ECEBE7]">Seat price + usage at API rates</div>
                    <p className="text-[11px] text-[#706E68] mt-1">
                      Custom pooled token billing with enterprise throughput guarantees.
                    </p>
                  </div>

                  <button
                    onClick={() => setPaymentPlan('Enterprise plan')}
                    className="w-full py-2.5 rounded-xl bg-[#242320] hover:bg-[#2D2C28] text-[#ECEBE7] text-xs font-semibold border border-[#33312E] shadow transition-all active:scale-95"
                  >
                    Get Enterprise plan
                  </button>

                  <div className="border-t border-[#242320] pt-6 space-y-3.5 text-xs text-[#B4B3AD]">
                    {[
                      'Admin-set user and organization limits',
                      'Role-based access control (RBAC)',
                      'Enterprise identity management & SCIM provisioning',
                      'Comprehensive audit logs & compliance reports',
                      'API observability & analytics pipeline',
                      'Custom data retention & privacy controls',
                      'Network-level access controls & IP allowlisting',
                      'Dedicated customer success manager'
                    ].map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-[#DA7756] shrink-0 mt-0.5" />
                        <span className="leading-snug">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
};
