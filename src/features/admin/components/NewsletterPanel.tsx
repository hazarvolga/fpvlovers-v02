'use client';

import React, { useState, useEffect } from 'react';
import { Send, Users, History, FileText, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NewsletterPanel() {
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'campaigns' | 'subscribers' | 'compose'>('campaigns');

  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/newsletter/campaigns');
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || []);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (activeSubTab === 'campaigns') fetchCampaigns();
  }, [activeSubTab]);

  const handleGenerateDraft = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/api/admin/newsletter/generate-draft', { method: 'POST' });
      if (!res.ok) throw new Error('Taslak oluşturulamadı.');
      setSuccess('Haftalık taslak bülten başarıyla oluşturuldu.');
      fetchCampaigns();
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleDispatch = async (id: string) => {
    if (!confirm('Bu bülteni tüm aktif abonelere göndermek istediğinize emin misiniz?')) return;
    
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/newsletter/campaigns/${id}/dispatch`, { method: 'POST' });
      if (!res.ok) throw new Error('Gönderim sırasında hata oluştu.');
      const data = await res.json();
      setSuccess(`${data.sentCount} kişiye başarıyla gönderildi!`);
      fetchCampaigns();
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleCreateCustom = async () => {
    if (!subject || !content) {
      setError('Konu ve içerik zorunludur.');
      return;
    }
    setSending(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/newsletter/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, content_html: content })
      });
      if (!res.ok) throw new Error('Özel bülten oluşturulamadı.');
      setSuccess('Özel bülten başarıyla oluşturuldu.');
      setSubject('');
      setContent('');
      setActiveSubTab('campaigns');
    } catch (err: any) {
      setError(err.message);
    }
    setSending(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-black uppercase text-white tracking-tight flex items-center gap-2">
          <Send className="text-[#FF5C00]" /> Newsletter & Campaigns
        </h2>
        <p className="text-[#A0A0A0] font-mono text-xs mt-1">Manage weekly automated dispatches and custom ad-hoc campaigns.</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 p-4 font-mono text-sm text-red-500 flex items-center gap-3">
          <AlertCircle className="w-5 h-5" /> {error}
        </div>
      )}
      
      {success && (
        <div className="bg-[#00FF66]/10 border border-[#00FF66]/50 p-4 font-mono text-sm text-[#00FF66] flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5" /> {success}
        </div>
      )}

      <div className="flex gap-4 border-b border-[#333] pb-2">
        <button
          onClick={() => setActiveSubTab('campaigns')}
          className={`font-mono uppercase text-xs tracking-widest px-4 py-2 transition-colors ${activeSubTab === 'campaigns' ? 'text-[#FF5C00] border-b-2 border-[#FF5C00]' : 'text-[#666] hover:text-[#A0A0A0]'}`}
        >
          <History className="w-3.5 h-3.5 inline mr-2" />
          Campaigns
        </button>
        <button
          onClick={() => setActiveSubTab('compose')}
          className={`font-mono uppercase text-xs tracking-widest px-4 py-2 transition-colors ${activeSubTab === 'compose' ? 'text-[#FF5C00] border-b-2 border-[#FF5C00]' : 'text-[#666] hover:text-[#A0A0A0]'}`}
        >
          <FileText className="w-3.5 h-3.5 inline mr-2" />
          Custom Draft
        </button>
        <button
          onClick={() => setActiveSubTab('subscribers')}
          className={`font-mono uppercase text-xs tracking-widest px-4 py-2 transition-colors ${activeSubTab === 'subscribers' ? 'text-[#FF5C00] border-b-2 border-[#FF5C00]' : 'text-[#666] hover:text-[#A0A0A0]'}`}
        >
          <Users className="w-3.5 h-3.5 inline mr-2" />
          Subscribers
        </button>
      </div>

      {activeSubTab === 'campaigns' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Button variant="cyber" size="sm" onClick={handleGenerateDraft} disabled={loading} className="border-[#00F2FF] text-[#00F2FF] hover:bg-[#00F2FF] hover:text-white">
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Generate Weekly Draft
            </Button>
            <Button variant="outline" size="sm" onClick={fetchCampaigns} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {campaigns.length === 0 && !loading && (
              <div className="text-[#666] font-mono text-sm text-center py-8">Henüz kampanya bulunmuyor.</div>
            )}
            {campaigns.map(camp => (
              <div key={camp.id} className="bg-[#0A0A0B] border border-[#333] p-5 relative overflow-hidden flex flex-col md:flex-row gap-4 items-start md:items-center justify-between group">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 ${camp.status === 'sent' ? 'bg-[#00FF66]/20 text-[#00FF66]' : 'bg-yellow-500/20 text-yellow-500'}`}>
                      {camp.status}
                    </span>
                    <span className="text-white font-mono text-sm">{camp.subject}</span>
                  </div>
                  <div className="text-[#A0A0A0] text-xs font-mono">
                    Created: {new Date(camp.created_at).toLocaleString('tr-TR')}
                    {camp.sent_at && ` | Sent: ${new Date(camp.sent_at).toLocaleString('tr-TR')} | Delivered: ${camp.recipient_count}`}
                  </div>
                </div>
                
                {camp.status === 'draft' && (
                  <Button variant="cyber" size="sm" onClick={() => handleDispatch(camp.id)} disabled={loading} className="border-[#00FF66] text-[#00FF66] hover:bg-[#00FF66] hover:text-white shrink-0">
                    <Send className="w-4 h-4 mr-2" /> Dispatch Now
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'compose' && (
        <div className="bg-[#0A0A0B] border border-[#333] p-6 space-y-4">
          <div>
            <label className="block text-[#A0A0A0] text-[10px] uppercase font-mono tracking-widest mb-2">Konu (Subject)</label>
            <input 
              value={subject} 
              onChange={e => setSubject(e.target.value)} 
              className="w-full bg-black border border-[#333] p-3 text-white focus:border-[#FF5C00] outline-none font-mono text-sm"
              placeholder="Örn: FPV Dünyasında Bu Hafta %50 İndirim!"
            />
          </div>
          <div>
            <label className="block text-[#A0A0A0] text-[10px] uppercase font-mono tracking-widest mb-2">İçerik (HTML veya Text)</label>
            <textarea 
              value={content} 
              onChange={e => setContent(e.target.value)} 
              rows={12}
              className="w-full bg-black border border-[#333] p-3 text-white focus:border-[#FF5C00] outline-none font-mono text-sm"
              placeholder="<h1>Merhaba Pilot...</h1>"
            />
          </div>
          <Button variant="cyber" onClick={handleCreateCustom} disabled={sending} className="w-full border-[#FF5C00] text-[#FF5C00] hover:bg-[#FF5C00] hover:text-white">
            {sending ? 'Oluşturuluyor...' : 'Draft Olarak Kaydet'}
          </Button>
        </div>
      )}

      {activeSubTab === 'subscribers' && (
        <div className="bg-[#0A0A0B] border border-[#333] p-6 text-center text-[#666] font-mono text-sm">
          Abonelik listesi görünümü yakında eklenecek.
        </div>
      )}

    </div>
  );
}
