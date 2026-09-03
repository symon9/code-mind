import React, { useState } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { loginApi } from '../../utils/api';
import logoImg from '../../assets/logo';

export const LoginPage: React.FC = () => {
  const login = useAuthStore((s) => s.login);
  const setCurrentView = useAuthStore((s) => s.setCurrentView);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setGlobalError(null);

    // Basic frontend check before sending to API
    const errors: Record<string, string> = {};
    if (!email.trim()) errors.email = 'Email is required';
    if (!password) errors.password = 'Password is required';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);
    try {
      const response = await loginApi(email.trim(), password);
      
      const user = response.user || {
        id: 'usr-' + Date.now(),
        email: email.trim(),
        name: email.split('@')[0],
      };

      login(user, response.accessToken);
    } catch (err: any) {
      if (err.parsed) {
        setFieldErrors(err.parsed.fieldErrors);
        setGlobalError(err.parsed.globalError || null);
      } else {
        setGlobalError(err.message || 'Failed to login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-surface-0 relative overflow-hidden select-none">
      {/* Glow background effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-accent-dark/20 rounded-full blur-3xl pointer-events-none" />

      {/* Login Card */}
      <div className="w-full max-w-md p-8 bg-surface-100/90 backdrop-blur-xl border border-border/80 rounded-2xl shadow-2xl z-10 animate-fade-in relative">
        {/* Header / Logo */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-18 h-18 rounded-2xl bg-gradient-to-br from-purple-900/40 via-accent/20 to-purple-950/40 border border-purple-500/30 flex items-center justify-center glow-accent mb-4 shadow-2xl p-2.5">
            <img src={logoImg} alt="CodeMind Logo" className="w-12 h-12 object-contain drop-shadow" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Welcome Back</h1>
          <p className="text-sm text-text-muted mt-1">Sign in to sync your preferences and code sessions</p>
        </div>

        {/* Global Error Banner */}
        {globalError && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 mt-0.5">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 5V8M8 11H8.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span>{globalError}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Email Field */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="developer@example.com"
              className={`w-full px-3.5 py-2.5 bg-surface-200/80 border rounded-lg text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 transition-all ${
                fieldErrors.email
                  ? 'border-red-500/60 focus:ring-red-500/30'
                  : 'border-border focus:border-accent/60 focus:ring-accent/20'
              }`}
            />
            {fieldErrors.email && (
              <p className="text-xs text-red-400 mt-1 font-medium">{fieldErrors.email}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`w-full px-3.5 py-2.5 bg-surface-200/80 border rounded-lg text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 transition-all ${
                fieldErrors.password
                  ? 'border-red-500/60 focus:ring-red-500/30'
                  : 'border-border focus:border-accent/60 focus:ring-accent/20'
              }`}
            />
            {fieldErrors.password && (
              <p className="text-xs text-red-400 mt-1 font-medium">{fieldErrors.password}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-accent hover:bg-accent-light text-white font-medium rounded-lg text-sm transition-all duration-200 shadow-md shadow-accent/25 hover:shadow-accent/40 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Footer Navigation */}
        <div className="mt-6 pt-5 border-t border-border/50 text-center text-xs text-text-muted">
          <span>Don't have an account? </span>
          <button
            type="button"
            onClick={() => setCurrentView('register')}
            className="text-accent-light hover:underline font-semibold transition-colors"
          >
            Create an Account
          </button>
        </div>

        {/* Skip to Editor Link */}
        <div className="mt-3 text-center">
          <button
            type="button"
            onClick={() => setCurrentView('editor')}
            className="text-xs text-text-muted/70 hover:text-text-secondary transition-colors"
          >
            Continue as Guest →
          </button>
        </div>
      </div>
    </div>
  );
};
