import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { Sparkles, ArrowRight, Lock, Mail, User, ShieldCheck } from 'lucide-react';
import claudeLogoSvg from '../assets/claude-logo.svg';

export const LoginView: React.FC = () => {
  const { loginWithGoogle, loginWithEmail, isLoading } = useAuth();
  const { updateSettings } = useSettings();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    if (!password.trim()) {
      setErrorMessage('Please enter your password.');
      return;
    }

    try {
      const namePart = email.split('@')[0] || 'User';
      const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
      updateSettings({ userName: formattedName, userEmail: email.trim().toLowerCase() });
      await loginWithEmail(email, password);
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#141413] text-[#ECEBE7] flex flex-col justify-between select-none">
      {/* Top Navbar */}
      <header className="px-6 py-5 flex items-center justify-between max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <img
            src={claudeLogoSvg}
            alt="Claude"
            width={24}
            height={24}
            className="w-6 h-6 object-contain shrink-0"
            draggable={false}
          />
          <span className="font-serif text-xl tracking-tight font-medium text-[#ECEBE7]">
            Claude
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-[#201F1D] border border-[#2B2A27] text-[#8C8A82] text-[11px]">
            Private Workspace
          </span>
        </div>
      </header>

      {/* Center Auth Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-[#1C1B19] border border-[#2E2D2A] rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-[#ECEBE7]">
              Log in to Claude
            </h1>
            <p className="text-xs sm:text-sm text-[#9C9A92] leading-relaxed">
              Enter your authorized account email and password to access the workspace.
            </p>
          </div>

          {/* Social Login Button (Google) */}
          <div className="space-y-3">
            <button
              onClick={() => loginWithGoogle()}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-[#23221F] hover:bg-[#2C2A26] border border-[#33312D] hover:border-[#45433D] rounded-xl text-xs sm:text-sm font-medium text-[#ECEBE7] transition-all disabled:opacity-50 shadow-xs active:scale-[0.99]"
            >
              {/* Google G Logo */}
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s2.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 border-t border-[#2B2A27]" />
            <span className="text-[11px] font-medium text-[#7E7C76] tracking-wider uppercase">
              OR
            </span>
            <div className="flex-1 border-t border-[#2B2A27]" />
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-xs flex items-center gap-2">
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#B4B3AD]">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7E7C76]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-[#141413] border border-[#2E2D2A] focus:border-[#DA7756] rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-[#ECEBE7] placeholder-[#66645E] outline-none transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-[#B4B3AD]">Password</label>
                <button
                  type="button"
                  onClick={() => alert('Please contact your administrator to reset or retrieve your account password.')}
                  className="text-[11px] text-[#8C8A82] hover:text-[#DA7756] transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7E7C76]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#141413] border border-[#2E2D2A] focus:border-[#DA7756] rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-[#ECEBE7] placeholder-[#66645E] outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-[#ECEBE7] hover:bg-white text-[#141413] font-medium rounded-xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 active:scale-[0.99]"
            >
              <span>{isLoading ? 'Verifying...' : 'Continue with email'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 px-6 text-center text-xs text-[#7E7C76] space-y-1">
        <p>
          By continuing, you agree to Claude's{' '}
          <span className="text-[#A5A39C] hover:underline cursor-pointer">Terms of Service</span> and{' '}
          <span className="text-[#A5A39C] hover:underline cursor-pointer">Privacy Policy</span>.
        </p>
      </footer>
    </div>
  );
};