import React, { useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';

export default function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [topic, setTopic] = useState('Registry Correction / Data Update');
  const [message, setMessage] = useState('');
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const refCode = `SCH-${Math.floor(100000 + Math.random() * 900000)}`;
    setSubmittedRef(refCode);
  };

  if (submittedRef) {
    return (
      <div className="border border-forest bg-paper p-6 sm:p-8 space-y-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-6 h-6 text-forest shrink-0 mt-0.5" />
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-forest font-semibold">
              Inquiry Recorded · {submittedRef}
            </p>
            <h2 className="font-serif text-2xl font-semibold text-ink mt-1">
              Thank you, {name}.
            </h2>
          </div>
        </div>
        <p className="text-sm text-muted leading-relaxed">
          Your message regarding <strong className="text-ink">{topic}</strong> has been logged for
          review. We respond to institutional verification updates and practitioner inquiries via{' '}
          <span className="font-mono text-ink">{email}</span>.
        </p>
        <button
          type="button"
          onClick={() => {
            setSubmittedRef(null);
            setMessage('');
          }}
          className="px-4 py-2 border border-hairline bg-limestone/45 text-xs font-semibold text-ink hover:border-ink cursor-pointer"
        >
          Send Another Inquiry
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border border-hairline bg-paper p-6 sm:p-8 space-y-5">
      <div className="pb-3 border-b border-hairline">
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
          Direct Correspondence
        </p>
        <h2 className="font-serif text-2xl font-semibold text-ink mt-0.5">
          Write to the Schologic Registry &amp; Support Team
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div>
          <label htmlFor="contact-name" className="block font-medium text-ink mb-1">
            Full Name
          </label>
          <input
            id="contact-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Dr. Amina Wanjiku"
            className="w-full px-3 py-2.5 border border-hairline bg-paper text-ink focus:outline-none focus:border-forest"
          />
        </div>

        <div>
          <label htmlFor="contact-email" className="block font-medium text-ink mb-1">
            Email Address
          </label>
          <input
            id="contact-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@institution.ac.ke"
            className="w-full px-3 py-2.5 border border-hairline bg-paper text-ink focus:outline-none focus:border-forest"
          />
        </div>

        <div>
          <label htmlFor="contact-org" className="block font-medium text-ink mb-1">
            Institution / County (Optional)
          </label>
          <input
            id="contact-org"
            type="text"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            placeholder="e.g. Technical University of Kenya"
            className="w-full px-3 py-2.5 border border-hairline bg-paper text-ink focus:outline-none focus:border-forest"
          />
        </div>

        <div>
          <label htmlFor="contact-topic" className="block font-medium text-ink mb-1">
            Inquiry Topic
          </label>
          <select
            id="contact-topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full px-3 py-2.5 border border-hairline bg-paper text-ink focus:outline-none focus:border-forest"
          >
            <option>Registry Correction / Data Update</option>
            <option>Institution Verification Request</option>
            <option>Student &amp; Educator Support</option>
            <option>OER Library &amp; Practicum Inquiry</option>
            <option>Data Protection / Takedown (Kenya DPA 2019)</option>
          </select>
        </div>
      </div>

      <div className="text-sm">
        <label htmlFor="contact-message" className="block font-medium text-ink mb-1">
          Message
        </label>
        <textarea
          id="contact-message"
          rows={5}
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Share the institution name, registration number, or details of your inquiry..."
          className="w-full px-3 py-2.5 border border-hairline bg-paper text-ink focus:outline-none focus:border-forest"
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <p className="text-xs text-muted">
          Enterprise procurement?{' '}
          <a
            href="https://schologic.com/contact"
            target="_blank"
            rel="noopener noreferrer"
            className="text-lapis hover:underline"
          >
            Visit schologic.com/contact ↗
          </a>
        </p>

        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-forest text-paper text-sm font-semibold hover:bg-ink transition-colors cursor-pointer whitespace-nowrap"
        >
          <Send className="w-4 h-4" />
          Submit Inquiry
        </button>
      </div>
    </form>
  );
}
