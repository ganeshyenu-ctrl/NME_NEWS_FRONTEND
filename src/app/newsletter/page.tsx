'use client';

import React, { useState } from 'react';
import Header from '@/components/website/Header';
import Footer from '@/components/website/Footer';
import { api } from '@/lib/api';
import { Check, Mail, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function NewsletterPage() {
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [frequency, setFrequency] = useState('weekly');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([
    'Shipping & Freight Markets',
    'Decarbonisation & Alternative Fuels',
    'Ship Management & Crew Welfare',
    'Regulatory, ESG & IMO Compliance',
  ]);
  const [consent, setConsent] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const allTopics = [
    'Shipping & Freight Markets',
    'Decarbonisation & Alternative Fuels',
    'Maritime Technology & Digital AI',
    'Ship Management & Crew Welfare',
    'Ports, Terminals & Supply Chain',
    'Regulatory, ESG & IMO Compliance',
    'Offshore Energy & Marine Operations',
    'Maritime Safety & Risk Mitigation',
  ];

  const toggleTopic = (topic: string) => {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics(selectedTopics.filter((t) => t !== topic));
    } else {
      setSelectedTopics([...selectedTopics, topic]);
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid work email address.');
      return;
    }

    if (!consent) {
      setErrorMsg('Consent is required to receive the newsletter.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/newsletter/subscribe', {
        email: email.trim().toLowerCase(),
        firstName: firstName.trim(),
        topics: selectedTopics,
        frequency,
        source: 'newsletter_strategic_briefing',
      });

      if (res.data?.success) {
        setSuccess(true);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Subscription failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <main className="flex-1 bg-white py-12">
        <div className="mx-auto max-w-2xl px-5">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-navy-700 bg-navy-50 px-3 py-1 rounded-full mb-3">
              <Mail className="h-3.5 w-3.5" />
              NME Strategic Briefing
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-navy-900 leading-tight">
              Independent maritime reporting and analysis, delivered directly.
            </h1>
            <p className="mt-3 text-sm text-muted max-w-lg mx-auto">
              Curated intelligence for vessel owners, operators, charterers, and port authorities. No press release
              regurgitations.
            </p>
          </div>

          {success ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-8 text-center space-y-3">
              <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto" />
              <h2 className="font-serif text-xl font-bold text-emerald-950">You are subscribed!</h2>
              <p className="text-sm text-emerald-800 max-w-md mx-auto">
                We have registered <strong>{email}</strong> for the {frequency} edition covering your selected
                topics. Welcome to the NME community.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="rounded-lg border border-rule bg-wash p-6 sm:p-8 space-y-6">
              {errorMsg && (
                <div className="rounded border border-red-200 bg-red-50 p-3 text-xs text-red-900">
                  {errorMsg}
                </div>
              )}

              {/* Name & Email Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-navy-900 mb-1.5">First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Captain Siddharth"
                    className="w-full rounded-md border border-rule bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60 focus:border-navy-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-navy-900 mb-1.5">Work Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="executive@maritime-group.com"
                    className="w-full rounded-md border border-rule bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60 focus:border-navy-700 focus:outline-none"
                  />
                </div>
              </div>

              {/* Frequency selection */}
              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-2">Delivery Frequency</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'weekly', label: 'Weekly Digest', desc: 'Tuesday mornings' },
                    { id: 'daily', label: 'Daily Briefing', desc: 'Weekday summary' },
                    { id: 'breaking_only', label: 'Breaking Alerts', desc: 'Critical dispatches' },
                  ].map((freq) => (
                    <button
                      key={freq.id}
                      type="button"
                      onClick={() => setFrequency(freq.id)}
                      className={`text-left p-3 rounded-md border transition-colors cursor-pointer ${
                        frequency === freq.id
                          ? 'border-navy-900 bg-white shadow-sm ring-1 ring-navy-900'
                          : 'border-rule bg-white/50 hover:bg-white'
                      }`}
                    >
                      <div className="text-xs font-bold text-navy-900">{freq.label}</div>
                      <div className="text-[11px] text-muted">{freq.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Topic Preferences */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-navy-900">Topic Focus (Select all that apply)</label>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedTopics.length === allTopics.length) {
                        setSelectedTopics([]);
                      } else {
                        setSelectedTopics([...allTopics]);
                      }
                    }}
                    className="text-[11px] font-medium text-navy-700 hover:text-navy-900 hover:underline cursor-pointer"
                  >
                    {selectedTopics.length === allTopics.length ? 'Deselect all' : 'Select all'}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {allTopics.map((topic) => {
                    const isChecked = selectedTopics.includes(topic);
                    return (
                      <div
                        key={topic}
                        onClick={() => toggleTopic(topic)}
                        className={`flex items-center gap-2 p-2.5 rounded border text-xs cursor-pointer select-none transition-colors ${
                          isChecked
                            ? 'border-navy-900 bg-white font-medium text-navy-900 shadow-2xs'
                            : 'border-rule bg-white/40 text-muted hover:bg-white'
                        }`}
                      >
                        <div
                          className={`h-4 w-4 rounded flex items-center justify-center border ${
                            isChecked ? 'bg-navy-900 border-navy-900 text-white' : 'border-rule bg-white'
                          }`}
                        >
                          {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                        <span>{topic}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Explicit Consent Checkbox */}
              <div className="rounded-md border border-rule/80 bg-white/70 p-3.5">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 rounded border-rule text-navy-900 focus:ring-0 cursor-pointer"
                  />
                  <span className="text-xs text-ink leading-relaxed">
                    I agree to receive the NME newsletter and strategic intelligence dispatches by email. Consent is recorded and I can unsubscribe anytime in one click.
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || !consent}
                className="w-full rounded-md bg-navy-900 py-3 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-50 transition-colors cursor-pointer shadow-sm"
              >
                {submitting ? 'Setting up subscription...' : 'Complete Subscription'}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted text-center pt-2">
                <ShieldCheck className="h-3.5 w-3.5 text-navy-700" />
                <span>We respect your inbox. Unsubscribe anytime in one click. Never shared.</span>
              </div>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
