import React, { useState } from 'react';
import { ArrowLeft, ChevronDown, Info } from 'lucide-react';

interface PaymentViewProps {
  planName: string; // e.g. 'Max plan'
  onBack: () => void;
}

type PlanTier = '5x' | '20x';

const COUNTRIES = [
  'India', 'United States', 'United Kingdom', 'Canada', 'Australia',
  'Germany', 'France', 'Japan', 'Singapore', 'Brazil', 'Netherlands',
  'Sweden', 'South Korea', 'Mexico', 'Indonesia', 'South Africa'
];

export const PaymentView: React.FC<PaymentViewProps> = ({ planName, onBack }) => {
  const [selectedTier, setSelectedTier] = useState<PlanTier>('5x');
  const [fullName, setFullName] = useState('');
  const [country, setCountry] = useState('India');
  const [address, setAddress] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expDate, setExpDate] = useState('');
  const [cvc, setCvc] = useState('');
  const [useDifferentName, setUseDifferentName] = useState(false);
  const [invoiceName, setInvoiceName] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Pricing based on tier
  const tierData = {
    '5x': {
      label: '5x more usage than Pro',
      monthlyPrice: 11999,
      priceDisplay: '₹11,999.00/month (includes GST)',
      subtotal: 10168.64,
      gst: 1830.36,
      total: 11999
    },
    '20x': {
      label: '20x more usage than Pro',
      monthlyPrice: 23999,
      priceDisplay: '₹23,999.00/month (includes GST)',
      subtotal: 20338.14,
      gst: 3660.86,
      total: 23999,
      saveBadge: 'Save 50%'
    }
  };

  const current = tierData[selectedTier];

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  // Format expiration date
  const formatExpDate = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) {
      return digits.slice(0, 2) + ' / ' + digits.slice(2);
    }
    return digits;
  };

  // Detect card type
  const getCardType = (num: string): string | null => {
    const d = num.replace(/\D/g, '');
    if (d.startsWith('4')) return 'visa';
    if (/^5[1-5]/.test(d) || /^2[2-7]/.test(d)) return 'mastercard';
    if (/^3[47]/.test(d)) return 'amex';
    if (/^(6011|65|64[4-9])/.test(d)) return 'discover';
    return null;
  };

  const cardType = getCardType(cardNumber);

  const handleSubscribe = () => {
    if (!fullName.trim() || !agreedToTerms) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccess(true);
      setTimeout(() => {
        onBack();
      }, 2500);
    }, 2000);
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen w-full bg-[#141413] text-[#ECEBE7] flex flex-col items-center justify-center select-none">
        <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-300">
          <div className="w-16 h-16 rounded-full bg-emerald-900/40 border border-emerald-700/50 flex items-center justify-center">
            <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold">Subscription activated!</h2>
          <p className="text-sm text-[#8C8A82]">Your {planName} is now active. Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-[#141413] text-[#ECEBE7] font-sans flex flex-col select-none overflow-hidden">

      {/* Top Header */}
      <header className="h-14 px-6 sm:px-12 flex items-center border-b border-[#1F1E1C] shrink-0 sticky top-0 bg-[#141413]/95 backdrop-blur-sm z-30">
        <button
          onClick={onBack}
          className="flex items-center gap-2.5 text-xs font-medium text-[#9C9A92] hover:text-[#ECEBE7] transition-colors py-1.5 px-2 -ml-2 rounded-lg hover:bg-[#201F1D]"
        >
          <ArrowLeft className="w-4 h-4 text-[#8C8A82]" />
          <span className="text-sm font-medium">Upgrade</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-14">

        {/* Plan Title */}
        <h1 className="font-serif text-2xl sm:text-3xl text-[#ECEBE7] font-normal tracking-tight mb-8">
          {planName}
        </h1>

        {/* Tier Selector - Two Radio Cards */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {/* 5x Tier */}
          <button
            onClick={() => setSelectedTier('5x')}
            className={`relative text-left p-4 rounded-2xl border-2 transition-all ${
              selectedTier === '5x'
                ? 'border-sky-500/60 bg-[#1A2332]'
                : 'border-[#282724] bg-[#1C1B19] hover:border-[#3A3936]'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                selectedTier === '5x'
                  ? 'border-sky-400 bg-sky-500'
                  : 'border-[#555450] bg-transparent'
              }`}>
                {selectedTier === '5x' && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </div>
              <div className="space-y-1.5">
                <div className="text-xs text-[#ECEBE7] font-medium leading-snug">
                  5x more usage than Pro
                </div>
                <div className="text-[11px] text-sky-400">
                  ₹11,999.00/month (includes GST)
                </div>
              </div>
            </div>
          </button>

          {/* 20x Tier */}
          <button
            onClick={() => setSelectedTier('20x')}
            className={`relative text-left p-4 rounded-2xl border-2 transition-all ${
              selectedTier === '20x'
                ? 'border-sky-500/60 bg-[#1A2332]'
                : 'border-[#282724] bg-[#1C1B19] hover:border-[#3A3936]'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                selectedTier === '20x'
                  ? 'border-sky-400 bg-sky-500'
                  : 'border-[#555450] bg-transparent'
              }`}>
                {selectedTier === '20x' && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </div>
              <div className="space-y-1.5">
                {/* Save badge */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-sky-900/60 text-sky-300 border border-sky-700/40">
                    Save 50%
                  </span>
                </div>
                <div className="text-xs text-[#ECEBE7] font-medium leading-snug">
                  20x more usage than Pro
                </div>
                <div className="text-[11px] text-[#8C8A82]">
                  ₹23,999.00/month (includes GST)
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Order Details Card */}
        <div className="bg-[#1C1B19] border border-[#282724] rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-[#ECEBE7] mb-5">Order details</h2>

          {/* Plan line item */}
          <div className="flex items-start justify-between mb-1">
            <div>
              <div className="text-xs text-[#ECEBE7] font-medium">{planName}</div>
              <div className="text-[11px] text-[#8C8A82]">{current.label}</div>
            </div>
            <span className="text-xs text-[#ECEBE7] font-medium">₹{current.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="border-t border-[#242320] my-4" />

          {/* Subtotal */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#8C8A82]">Subtotal</span>
            <span className="text-xs text-[#ECEBE7]">₹{current.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>

          {/* GST */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-[#8C8A82]">GST</span>
            <span className="text-xs text-[#ECEBE7]">₹{current.gst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="border-t border-[#242320] my-3" />

          {/* Total due today */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#ECEBE7] font-semibold">Total due today</span>
            <span className="text-xs text-[#ECEBE7] font-semibold">₹{current.total.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Auto-renewal notice */}
        <div className="flex items-start gap-3 mb-8 px-1">
          <Info className="w-4 h-4 text-[#706E68] shrink-0 mt-0.5" />
          <p className="text-[11px] text-[#8C8A82] leading-relaxed">
            Your subscription will auto renew on 10/1/2026. You will be charged ₹{current.total.toLocaleString('en-IN')}.00/month (includes GST).
          </p>
        </div>

        {/* ─── Payment Method Section ─── */}
        <div className="bg-[#1C1B19] border border-[#282724] rounded-2xl p-6 mb-8">
          <h2 className="text-sm font-semibold text-[#ECEBE7] mb-5">Payment method</h2>

          {/* Full name */}
          <div className="mb-4">
            <label className="block text-xs text-[#ECEBE7] mb-1.5 font-medium">Full name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder=""
              className="w-full h-10 px-3 rounded-lg bg-[#141413] border border-[#2D2C28] text-xs text-[#ECEBE7] placeholder:text-[#555450] focus:outline-none focus:border-[#4A4845] transition-colors"
            />
          </div>

          {/* Country or region */}
          <div className="mb-4 relative">
            <label className="block text-xs text-[#ECEBE7] mb-1.5 font-medium">Country or region</label>
            <button
              onClick={() => setIsCountryOpen(!isCountryOpen)}
              className="w-full h-10 px-3 rounded-lg bg-[#141413] border border-[#2D2C28] text-xs text-[#ECEBE7] flex items-center justify-between focus:outline-none focus:border-[#4A4845] transition-colors"
            >
              <span>{country}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#8C8A82]" />
            </button>
            {isCountryOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#1C1B19] border border-[#2B2A27] rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto p-1">
                {COUNTRIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => { setCountry(c); setIsCountryOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                      country === c ? 'bg-[#2A2824] text-white' : 'text-[#B4B3AD] hover:bg-[#242320]'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Address */}
          <div className="mb-5">
            <label className="block text-xs text-[#ECEBE7] mb-1.5 font-medium">Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-[#141413] border border-[#2D2C28] text-xs text-[#ECEBE7] placeholder:text-[#555450] focus:outline-none focus:border-[#4A4845] transition-colors"
            />
          </div>

          {/* Card number */}
          <div className="mb-4">
            <label className="block text-xs text-[#ECEBE7] mb-1.5 font-medium">Card number</label>
            <div className="relative">
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                placeholder="1234 1234 1234 1234"
                className="w-full h-10 px-3 pr-28 rounded-lg bg-[#141413] border border-[#2D2C28] text-xs text-[#ECEBE7] placeholder:text-[#555450] focus:outline-none focus:border-[#4A4845] transition-colors font-mono"
              />
              {/* Card brand icons */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {/* Visa */}
                <div className={`w-8 h-5 rounded flex items-center justify-center text-[8px] font-bold transition-opacity ${
                  !cardType || cardType === 'visa' ? 'opacity-100' : 'opacity-30'
                }`} style={{ background: '#1A1F71' }}>
                  <span className="text-white italic tracking-tighter" style={{ fontSize: '9px' }}>VISA</span>
                </div>
                {/* Mastercard */}
                <div className={`w-8 h-5 rounded flex items-center justify-center transition-opacity ${
                  !cardType || cardType === 'mastercard' ? 'opacity-100' : 'opacity-30'
                }`}>
                  <svg viewBox="0 0 32 20" className="w-7 h-4">
                    <circle cx="11" cy="10" r="7" fill="#EB001B" opacity="0.9" />
                    <circle cx="21" cy="10" r="7" fill="#F79E1B" opacity="0.9" />
                    <path d="M16 4.58a6.97 6.97 0 0 1 2.5 5.42 6.97 6.97 0 0 1-2.5 5.42A6.97 6.97 0 0 1 13.5 10 6.97 6.97 0 0 1 16 4.58z" fill="#FF5F00" />
                  </svg>
                </div>
                {/* Amex */}
                <div className={`w-8 h-5 rounded flex items-center justify-center text-[7px] font-bold transition-opacity ${
                  !cardType || cardType === 'amex' ? 'opacity-100' : 'opacity-30'
                }`} style={{ background: '#006FCF' }}>
                  <span className="text-white" style={{ fontSize: '6px' }}>AMEX</span>
                </div>
                {/* JCB */}
                <div className={`w-8 h-5 rounded flex items-center justify-center text-[7px] font-bold transition-opacity ${
                  !cardType || cardType === 'discover' ? 'opacity-100' : 'opacity-30'
                }`} style={{ background: 'linear-gradient(135deg, #0E4C96 0%, #E4002B 50%, #00A651 100%)' }}>
                  <span className="text-white font-bold" style={{ fontSize: '7px' }}>JCB</span>
                </div>
              </div>
            </div>
          </div>

          {/* Expiration date & Security code (side by side) */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div>
              <label className="block text-xs text-[#ECEBE7] mb-1.5 font-medium">Expiration date</label>
              <input
                type="text"
                value={expDate}
                onChange={(e) => setExpDate(formatExpDate(e.target.value))}
                placeholder="MM / YY"
                className="w-full h-10 px-3 rounded-lg bg-[#141413] border border-[#2D2C28] text-xs text-[#ECEBE7] placeholder:text-[#555450] focus:outline-none focus:border-[#4A4845] transition-colors font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-[#ECEBE7] mb-1.5 font-medium">Security code</label>
              <div className="relative">
                <input
                  type="text"
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="CVC"
                  className="w-full h-10 px-3 pr-10 rounded-lg bg-[#141413] border border-[#2D2C28] text-xs text-[#ECEBE7] placeholder:text-[#555450] focus:outline-none focus:border-[#4A4845] transition-colors font-mono"
                />
                {/* CVC card icon */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <svg width="20" height="14" viewBox="0 0 20 14" fill="none" className="text-[#555450]">
                    <rect x="0.5" y="0.5" width="19" height="13" rx="2" stroke="currentColor" />
                    <rect x="0" y="3" width="20" height="3" fill="currentColor" opacity="0.3" />
                    <rect x="3" y="8" width="8" height="2" rx="0.5" fill="currentColor" opacity="0.4" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Use a different name on invoices */}
          <label className="flex items-center gap-2.5 mb-5 cursor-pointer group">
            <div
              onClick={() => setUseDifferentName(!useDifferentName)}
              className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                useDifferentName
                  ? 'bg-sky-500 border-sky-500'
                  : 'border-[#555450] bg-transparent group-hover:border-[#8C8A82]'
              }`}
            >
              {useDifferentName && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className="text-xs text-[#B4B3AD]">Use a different name on invoices</span>
          </label>

          {useDifferentName && (
            <div className="mb-5">
              <label className="block text-xs text-[#ECEBE7] mb-1.5 font-medium">Invoice name</label>
              <input
                type="text"
                value={invoiceName}
                onChange={(e) => setInvoiceName(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-[#141413] border border-[#2D2C28] text-xs text-[#ECEBE7] placeholder:text-[#555450] focus:outline-none focus:border-[#4A4845] transition-colors"
              />
            </div>
          )}

          {/* Business tax ID (Optional) */}
          <div className="border-t border-[#242320] pt-5 mb-5">
            <h3 className="text-xs font-semibold text-[#ECEBE7] mb-1.5">Business tax ID (Optional)</h3>
            <p className="text-[11px] text-[#8C8A82] mb-3 leading-relaxed">
              If you provide a tax ID, the "Full name" above should be your business's name.
            </p>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#8C8A82] font-medium whitespace-nowrap">Indian GST number</span>
              <input
                type="text"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value.toUpperCase().slice(0, 15))}
                placeholder="12ABCDE3456FGZH"
                className="flex-1 h-10 px-3 rounded-lg bg-[#141413] border border-[#2D2C28] text-xs text-[#ECEBE7] placeholder:text-[#555450] focus:outline-none focus:border-[#4A4845] transition-colors font-mono"
              />
            </div>
          </div>

          {/* Terms agreement checkbox */}
          <label className="flex items-start gap-2.5 mb-6 cursor-pointer group">
            <div
              onClick={() => setAgreedToTerms(!agreedToTerms)}
              className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                agreedToTerms
                  ? 'bg-sky-500 border-sky-500'
                  : 'border-[#555450] bg-transparent group-hover:border-[#8C8A82]'
              }`}
            >
              {agreedToTerms && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className="text-[11px] text-[#8C8A82] leading-relaxed">
              You agree that Anthropic will charge your card in the amount above now and on a recurring monthly basis until you cancel in accordance with our{' '}
              <button className="text-sky-400 hover:text-sky-300 underline transition-colors">terms</button>
              . You can cancel at any time in your account settings.
            </span>
          </label>

          {/* Subscribe Button */}
          <button
            onClick={handleSubscribe}
            disabled={!fullName.trim() || !agreedToTerms || isSubmitting}
            className={`w-full py-3 rounded-xl text-sm font-semibold shadow-md transition-all active:scale-[0.98] ${
              fullName.trim() && agreedToTerms && !isSubmitting
                ? 'bg-white hover:bg-neutral-100 text-black cursor-pointer'
                : 'bg-[#2A2824] text-[#706E68] cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Processing...
              </span>
            ) : (
              'Subscribe'
            )}
          </button>
        </div>

        </div>

      </main>
    </div>
  );
};
