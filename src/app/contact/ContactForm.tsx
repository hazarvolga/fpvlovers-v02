'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Send, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

export function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    inquiryType: 'General',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const INQUIRY_TYPES = ['General', 'Affiliate', 'Partnership', 'Vendor', 'Content Correction'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear errors when typing
    setErrors([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors([]);

    // Client-side quick checks
    const clientErrors: string[] = [];
    if (formData.name.trim().length < 2) {
      clientErrors.push('Name must be at least 2 characters.');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      clientErrors.push('Please provide a valid email address.');
    }
    if (formData.message.trim().length < 10) {
      clientErrors.push('Message must be at least 10 characters.');
    }

    if (clientErrors.length > 0) {
      setErrors(clientErrors);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess(true);
      } else {
        setErrors(result.errors || ['Message delivery failed. Please try again.']);
      }
    } catch (err: unknown) {
      setErrors(['Network connection error. Server unreachable.']);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      email: '',
      inquiryType: 'General',
      message: '',
    });
    setSuccess(false);
    setErrors([]);
  };

  if (success) {
    return (
      <div className="space-y-6 rounded-xl border border-[#00FF66]/30 bg-[#00FF66]/5 p-8 text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-[#00FF66]" />
        <h3 className="text-xl font-mono font-black uppercase text-zinc-100 tracking-wider">
          Message Received
        </h3>
        <div className="space-y-1 rounded border border-white/5 bg-black/60 p-4 text-left font-mono text-[10px] text-zinc-400">
          <div>Status: inquiry logged successfully</div>
          <div>Timestamp: {new Date().toISOString()}</div>
          <div>Responder: FPVLovers editorial team</div>
        </div>
        <p className="text-sm text-zinc-400">
          Your inquiry has been received. We will reply to your registered email address as soon as possible.
        </p>
        <Button
          variant="amber"
          onClick={handleReset}
          className="w-full sm:w-auto flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Send Another Message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 md:p-8 border border-white/5 bg-zinc-950/40 rounded-xl space-y-6">
      <h3 className="text-lg font-mono font-black uppercase text-zinc-100 tracking-widest border-b border-white/5 pb-3">
        Inquiry Form
      </h3>

      {errors.length > 0 && (
        <div className="p-4 border border-[#FF5C00]/30 bg-[#FF5C00]/5 rounded text-xs text-zinc-300 font-mono space-y-1.5">
          <div className="flex items-center gap-1.5 text-[#FF5C00] font-black uppercase tracking-wider mb-1">
            <AlertTriangle className="w-4 h-4" /> Form Validation Failure:
          </div>
          {errors.map((err, idx) => (
            <div key={idx} className="flex items-start gap-1">
              <span>&bull;</span>
              <span>{err}</span>
            </div>
          ))}
        </div>
      )}

      {/* Name & Email Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-[10px] font-mono font-black uppercase tracking-widest text-[#FF5C00] mb-2">
            Your Name
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. John Doe"
            disabled={loading}
            className="w-full px-3 py-2 bg-black/60 border border-white/10 hover:border-white/20 focus:border-[#FF5C00] rounded text-white font-mono text-xs focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-[10px] font-mono font-black uppercase tracking-widest text-[#FF5C00] mb-2">
            Email Address
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="e.g. john@example.com"
            disabled={loading}
            className="w-full px-3 py-2 bg-black/60 border border-white/10 hover:border-white/20 focus:border-[#FF5C00] rounded text-white font-mono text-xs focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Inquiry Type */}
      <div>
        <label className="block text-[10px] font-mono font-black uppercase tracking-widest text-[#FF5C00] mb-2">
          Inquiry Department
        </label>
        <select
          name="inquiryType"
          value={formData.inquiryType}
          onChange={handleChange}
          disabled={loading}
          className="w-full px-3 py-2 bg-black/85 border border-white/10 hover:border-white/20 focus:border-[#FF5C00] rounded text-white font-mono text-xs focus:outline-none transition-colors"
        >
          {INQUIRY_TYPES.map((type) => (
            <option key={type} value={type}>
              {type} Inquiries
            </option>
          ))}
        </select>
      </div>

      {/* Message */}
      <div>
        <label className="block text-[10px] font-mono font-black uppercase tracking-widest text-[#FF5C00] mb-2">
          Your Message
        </label>
        <textarea
          name="message"
          rows={6}
          value={formData.message}
          onChange={handleChange}
          placeholder="Describe your request, correction link, or vendor business offer details here..."
          disabled={loading}
          className="w-full px-3 py-2 bg-black/60 border border-white/10 hover:border-white/20 focus:border-[#FF5C00] rounded text-white font-mono text-xs focus:outline-none transition-colors resize-y min-h-[120px]"
        />
      </div>

      {/* Submit */}
      <Button
        variant="amber"
        size="lg"
        disabled={loading}
        className="w-full sm:w-auto uppercase tracking-wider font-mono font-black flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" /> Sending Message...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" /> Send Secure Message
          </>
        )}
      </Button>
    </form>
  );
}
