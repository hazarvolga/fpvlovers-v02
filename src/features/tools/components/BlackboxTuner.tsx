'use client';

import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Activity, ShieldAlert, Cpu, Radio, Send, Loader2, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';

export function BlackboxTunerWidget() {
  const [formData, setFormData] = useState({
    droneType: '5" Freestyle',
    batterySpec: '6S',
    problem: 'Propwash oscillations during sharp turns',
    logData: 'Gyro traces show 150Hz resonance, mostly on Yaw axis. Step response shows mild bounce-back on Roll.',
    currentPIDs: 'P: 45, I: 80, D: 40, FF: 100'
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeLog = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Gemini API key is not configured.");
      }

      const ai = new GoogleGenAI({ apiKey });

      const systemInstruction = `
# ROLE: Elite FPV Flight Dynamics Engineer & Betaflight Tuning Master
# MISSION: Analyze flight log data (Blackbox) to diagnose vibrations, oscillations, and optimize PID/Filter settings for maximum performance.

## 🧠 TUNING LOGIC (Chain-of-Thought):
Analiz sırasında şu teknik hiyerarşiyi takip et:
1. **Noise Analysis:** Gyro verilerindeki kirlilik seviyesi. Filtreler (RPM, Dynamic Notch) gürültüyü yeterince temizliyor mu?
2. **Step Response:** Pilotun komutuna (Setpoint) drone'un tepkisi. Bounce-back (D yetersiz) veya Overshoot (P fazla) var mı?
3. **Oscillation Profile:** Yüksek frekanslı (D-term kaynaklı) veya düşük frekanslı (I-term/Wind-up) titreşimlerin tespiti.
4. **Thermal Safety:** Önerilen D-gain değerlerinin motorları yakma riski olup olmadığının kontrolü.

## 📝 OUTPUT FORMAT (Response Structure Markdown):

### 🔍 DIAGNOSTIC REPORT
- ⚠️ **[Problem]**: (Örn: Propwash Oscillations on Yaw axis)
- 📉 **[Observation]**: (Örn: Gyro traces show 150Hz resonance)

### 🛠️ PROPOSED SETTINGS (Betaflight Ready)
- **PIDs:** [P: XX, I: XX, D: XX, FF: XX]
- **Sliders:** [D-Term Damping: X.X, Tracking: X.X]
- **Filters:** [Gyro Lowpass Hz, RPM Filter ON/OFF]

### 💡 EXPLANATION (The Why)
- "D-gain'i artırdık çünkü stop-bounce sorununu sönümlemek istiyoruz, ancak motor sıcaklığını takip etmelisiniz."

### 🚀 NEXT STEPS
- "Bu ayarları yaptıktan sonra 30 saniyelik bir test uçuşu yapıp motorları elle kontrol edin."
      `;

      const prompt = `
Please analyze the following Blackbox / tuning data based on the given rules:
- Drone Type: ${formData.droneType}
- Battery: ${formData.batterySpec}
- Description of the Problem: ${formData.problem}
- Log / Gyro Data Insights: ${formData.logData}
- Current PIDs: ${formData.currentPIDs}
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.2,
        }
      });

      setResult(response.text || "No analysis returned from the Oracle.");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred during analysis.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="flex flex-col gap-8 w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
           <label className="text-[10px] font-black tracking-widest uppercase text-[#FF5C00] flex items-center gap-2">
             <Cpu className="w-3 h-3" /> Drone Configuration
           </label>
           <input
             type="text"
             name="droneType"
             value={formData.droneType}
             onChange={handleInputChange}
             placeholder='e.g., 5" Freestyle'
             className="w-full bg-[#0A0A0B] border border-[#333333] px-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-[#FF5C00] transition-colors"
           />
        </div>

        <div className="space-y-2">
           <label className="text-[10px] font-black tracking-widest uppercase text-[#FF5C00] flex items-center gap-2">
             <Activity className="w-3 h-3" /> Battery Setup
           </label>
           <input
             type="text"
             name="batterySpec"
             value={formData.batterySpec}
             onChange={handleInputChange}
             placeholder="e.g., 6S"
             className="w-full bg-[#0A0A0B] border border-[#333333] px-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-[#FF5C00] transition-colors"
           />
        </div>

        <div className="space-y-2 md:col-span-2">
           <label className="text-[10px] font-black tracking-widest uppercase text-[#FF5C00] flex items-center gap-2">
             <ShieldAlert className="w-3 h-3" /> Issue / Symptoms
           </label>
           <input
             type="text"
             name="problem"
             value={formData.problem}
             onChange={handleInputChange}
             placeholder="e.g., Propwash oscillations during sharp turns"
             className="w-full bg-[#0A0A0B] border border-[#333333] px-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-[#FF5C00] transition-colors"
           />
        </div>

        <div className="space-y-2 md:col-span-2">
           <label className="text-[10px] font-black tracking-widest uppercase text-[#FF5C00] flex items-center gap-2">
             <BarChart2 className="w-3 h-3" /> Log Insights / Gyro Traces summary
           </label>
           <textarea
             name="logData"
             value={formData.logData}
             onChange={handleInputChange}
             rows={3}
             placeholder="e.g., Gyro traces show 150Hz resonance..."
             className="w-full bg-[#0A0A0B] border border-[#333333] px-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-[#FF5C00] transition-colors resize-none"
           />
        </div>

        <div className="space-y-2 md:col-span-2">
           <label className="text-[10px] font-black tracking-widest uppercase text-[#FF5C00] flex items-center gap-2">
             <Radio className="w-3 h-3" /> Current PIDs
           </label>
           <input
             type="text"
             name="currentPIDs"
             value={formData.currentPIDs}
             onChange={handleInputChange}
             placeholder="e.g., P: 45, I: 80, D: 40, FF: 100"
             className="w-full bg-[#0A0A0B] border border-[#333333] px-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-[#FF5C00] transition-colors"
           />
        </div>
      </div>

      <Button
        variant="cyber"
        className="w-full h-14 text-lg border-[#FF5C00] text-[#FF5C00] hover:bg-[#FF5C00] hover:text-white group"
        onClick={analyzeLog}
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin text-white" />
            <span className="text-white">EXTRACTING LOG TELEMETRY...</span>
          </>
        ) : (
          <>
            <Send className="w-5 h-5 mr-2" />
            INITIATE PID ANALYSIS
          </>
        )}
      </Button>

      {error && (
        <div className="p-4 border border-red-500/50 bg-red-500/10 text-red-400 font-mono text-sm">
          <ShieldAlert className="w-5 h-5 mb-2 inline-block" /> {error}
        </div>
      )}

      {result && (
        <div className="mt-8 pt-8 border-t border-[#333333]">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-[#FF5C00]" />
            <h2 className="text-xl font-black uppercase text-white tracking-tight">Tuning Solution Matrix</h2>
          </div>

          <div className="prose prose-invert prose-p:font-mono prose-p:text-sm prose-p:text-[#A0A0A0] prose-headings:font-black prose-headings:uppercase prose-headings:text-[#FF5C00] prose-li:font-mono prose-li:text-sm max-w-none">
            <ReactMarkdown>{result}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
