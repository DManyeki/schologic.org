import React, { useState } from 'react';
import { Lock, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function LoginGateway() {
  const [mode, setMode] = useState<'credentials' | 'institution'>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [campusDomain, setCampusDomain] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(
      `Sign-in request prepared for ${email}. Your Schologic LMS authentication session routing connects here.`
    );
  };

  const handleDomainSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = campusDomain.trim().toLowerCase().replace(/^https?:\/\//, '');
    const target = cleaned.includes('.') ? cleaned : `${cleaned}.schologic.org`;
    setStatusMessage(
      `Schologic LMS portal target resolved to ${target}. Automatic tenant redirection routes directly to your campus workspace.`
    );
  };

  return (
    <div className="border border-hairline bg-paper p-6 sm:p-8 space-y-6">
      <div className="flex border border-hairline bg-limestone/45 text-xs">
        <button
          type="button"
          onClick={() => {
            setMode('credentials');
            setStatusMessage(null);
          }}
          className={`flex-1 py-2.5 px-3 font-semibold cursor-pointer transition-colors ${
            mode === 'credentials' ? 'bg-ink text-paper' : 'text-muted hover:text-ink'
          }`}
        >
          Email Sign In
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('institution');
            setStatusMessage(null);
          }}
          className={`flex-1 py-2.5 px-3 font-semibold cursor-pointer transition-colors ${
            mode === 'institution' ? 'bg-ink text-paper' : 'text-muted hover:text-ink'
          }`}
        >
          Find Schologic LMS Portal
        </button>
      </div>

      {statusMessage && (
        <div className="border border-forest/40 bg-forest/[0.06] p-3.5 text-xs text-forest flex items-start gap-2 leading-relaxed">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{statusMessage}</span>
        </div>
      )}

      {mode === 'credentials' ? (
        <form onSubmit={handleCredentialsSubmit} className="space-y-4 text-sm">
          <div>
            <label htmlFor="login-email" className="block font-medium text-ink mb-1">
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@institution.ac.ke"
              className="w-full px-3 py-2.5 border border-hairline bg-paper text-ink focus:outline-none focus:border-forest"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="login-password" className="font-medium text-ink">
                Password
              </label>
              <a href="/contact" className="text-xs text-muted hover:text-forest hover:underline">
                Need access help?
              </a>
            </div>
            <input
              id="login-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3 py-2.5 border border-hairline bg-paper text-ink focus:outline-none focus:border-forest"
            />
          </div>

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-forest text-paper font-semibold hover:bg-ink transition-colors cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            Sign In to Schologic LMS
          </button>
        </form>
      ) : (
        <form onSubmit={handleDomainSubmit} className="space-y-4 text-sm">
          <div>
            <label htmlFor="campus-slug" className="block font-medium text-ink mb-1">
              Schologic LMS Subdomain or Custom Domain
            </label>
            <input
              id="campus-slug"
              type="text"
              required
              value={campusDomain}
              onChange={(e) => setCampusDomain(e.target.value)}
              placeholder="e.g. moi-university, kmtc, or lms.college.ac.ke"
              className="w-full px-3 py-2.5 border border-hairline bg-paper text-ink focus:outline-none focus:border-forest"
            />
            <p className="mt-1.5 text-xs text-muted">
              Enter your campus identifier to route to your Schologic LMS login endpoint.
            </p>
          </div>

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-ink text-paper font-semibold hover:bg-forest transition-colors cursor-pointer"
          >
            Continue to Schologic LMS Auth
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}

      <div className="pt-4 border-t border-hairline space-y-2 text-xs text-muted">
        <p className="flex items-center gap-1.5 text-ink font-medium">
          <ShieldCheck className="w-4 h-4 text-forest" />
          New lecturer or practicum coordinator?
        </p>
        <p>
          Set up a free Schologic LMS workspace on{' '}
          <a href="/start" className="text-forest font-semibold hover:underline">
            Free-Tier Onboarding →
          </a>{' '}
          or apply for an institutional pilot on{' '}
          <a
            href="https://schologic.com/demo"
            target="_blank"
            rel="noopener noreferrer"
            className="text-lapis hover:underline"
          >
            schologic.com/demo ↗
          </a>
          .
        </p>
      </div>
    </div>
  );
}
