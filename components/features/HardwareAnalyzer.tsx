'use client';

import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Activity, ShieldAlert, Cpu, Battery, Video, Send, Loader2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';

export function HardwareAnalyzerWidget() {
  const [formData, setFormData] = useState({
    frame: 'Apex 5" Freestyle',
    motor: '2207 2400KV',
    esc: '45A 4-in-1',
    battery: '6S 1300mAh LiPo',
    fc: 'SpeedyBee F405 V3 30.5x30.5',
    vtx: 'DJI O3 Air Unit'
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeHardware = async () => {
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
# ROLE: Senior FPV Engineering Architect & Hardware Compatibility Expert
# MISSION: Analyze FPV drone component lists for technical, electrical, and physical compatibility.

## 🧠 ENGINEERING LOGIC (Chain-of-Thought):
Her analizde şu adımları takip et:
1. **Power Systems Check:** Voltaj (S) uyumu. Pil, Motor KV değeri ve ESC voltaj limitleri birbirini destekliyor mu? (Örn: 6S pil + 2400KV motor = Risk!)
2. **Propulsion Dynamics:** Motor boyutu vs. Pervane boyutu vs. Frame boyutu. (Örn: 5 inç pervane, 3 inç frame'e sığmaz.)
3. **Electrical Load:** Motorun maksimum akım çekimi (Amper), ESC'nin sürekli ve burst akım değerlerinin altında mı? (+%20 güvenlik marjı bırak).
4. **Physical Mounting:** Stack montaj delikleri (20x20, 30.5x30.5), Motor montaj delikleri ve VTX alanı frame ile uyumlu mu?
5. **Video & Control Link:** Kamera/VTX protokol uyumu (DJI O3, Walksnail, Analog) ve FC üzerindeki UART sayısı.

## 🛠️ COMPATIBILITY RULES (Knowledge Base):
- **6S Build:** 1600-1950KV (5"), 30-50A ESC.
- **4S Build:** 2300-2750KV (5"), 20-40A ESC.
- **Cinewhoop (3"):** 1404-1507 Motor, 2500-3500KV (4S).
- **Mounting:** O3 Air Unit için geniş frame alanı ve 20x20/30.5x30.5 uyumu şart.

## 📝 OUTPUT FORMAT:
Yanıtlarını şu bölümlerle ver (Markdown kullanarak):

### 📊 COMPATIBILITY MATRIX
- 🟢 [Parça İsmi]: Uyumlu.
- 🟡 [Parça İsmi]: Dikkat (Kısıtlı uyum/Ayarlama gerekir).
- 🔴 [Parça İsmi]: Uyumsuz (Kritik hata!).

### 🧐 DETAILED REASONING
- Neden uyumlu veya uyumsuz olduğunun teknik açıklaması (Chain-of-Thought).

### ⚡ RISK ASSESSMENT
- Olası ısınma, yanma veya düşük verimlilik riskleri.

### 🛠️ RECOMMENDED UPGRADES
- Eğer bir parça uyumsuzsa, onun yerine geçebilecek 2 alternatif öner.
      `;

      const prompt = `
Please analyze the following FPV drone components based on the given rules:
- Frame: ${formData.frame}
- Motor: ${formData.motor}
- ESC: ${formData.esc}
- Battery: ${formData.battery}
- FC: ${formData.fc}
- VTX/Camera: ${formData.vtx}
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="flex flex-col gap-8 w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
           <label className="text-[10px] font-black tracking-widest uppercase text-[#00A8B3] flex items-center gap-2">
             <Activity className="w-3 h-3" /> Frame
           </label>
           <input 
             type="text" 
             name="frame"
             value={formData.frame}
             onChange={handleInputChange}
             placeholder='e.g., Apex 5"'
             className="w-full bg-[#0A0A0B] border border-[#333333] px-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-[#00A8B3] transition-colors" 
           />
        </div>
        
        <div className="space-y-2">
           <label className="text-[10px] font-black tracking-widest uppercase text-[#00A8B3] flex items-center gap-2">
             <Zap className="w-3 h-3" /> Motor
           </label>
           <input 
             type="text" 
             name="motor"
             value={formData.motor}
             onChange={handleInputChange}
             placeholder="e.g., 2207 2400KV"
             className="w-full bg-[#0A0A0B] border border-[#333333] px-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-[#00A8B3] transition-colors" 
           />
        </div>

        <div className="space-y-2">
           <label className="text-[10px] font-black tracking-widest uppercase text-[#00A8B3] flex items-center gap-2">
             <Cpu className="w-3 h-3" /> ESC
           </label>
           <input 
             type="text" 
             name="esc"
             value={formData.esc}
             onChange={handleInputChange}
             placeholder="e.g., 45A 4-in-1"
             className="w-full bg-[#0A0A0B] border border-[#333333] px-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-[#00A8B3] transition-colors" 
           />
        </div>

        <div className="space-y-2">
           <label className="text-[10px] font-black tracking-widest uppercase text-[#00A8B3] flex items-center gap-2">
             <Battery className="w-3 h-3" /> Battery
           </label>
           <input 
             type="text" 
             name="battery"
             value={formData.battery}
             onChange={handleInputChange}
             placeholder="e.g., 6S 1300mAh"
             className="w-full bg-[#0A0A0B] border border-[#333333] px-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-[#00A8B3] transition-colors" 
           />
        </div>

        <div className="space-y-2">
           <label className="text-[10px] font-black tracking-widest uppercase text-[#00A8B3] flex items-center gap-2">
             <Cpu className="w-3 h-3" /> Flight Controller (FC)
           </label>
           <input 
             type="text" 
             name="fc"
             value={formData.fc}
             onChange={handleInputChange}
             placeholder="e.g., SpeedyBee F405 V3"
             className="w-full bg-[#0A0A0B] border border-[#333333] px-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-[#00A8B3] transition-colors" 
           />
        </div>

        <div className="space-y-2">
           <label className="text-[10px] font-black tracking-widest uppercase text-[#00A8B3] flex items-center gap-2">
             <Video className="w-3 h-3" /> VTX / Camera
           </label>
           <input 
             type="text" 
             name="vtx"
             value={formData.vtx}
             onChange={handleInputChange}
             placeholder="e.g., DJI O3 Air Unit"
             className="w-full bg-[#0A0A0B] border border-[#333333] px-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-[#00A8B3] transition-colors" 
           />
        </div>
      </div>
      
      <Button 
        variant="cyber" 
        className="w-full h-14 text-lg" 
        onClick={analyzeHardware}
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ANALYZING SUBSYSTEMS...
          </>
        ) : (
          <>
            <Send className="w-5 h-5 mr-2" />
            RUN FULL DIAGNOSTIC
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
            <Activity className="w-5 h-5 text-[#00A8B3]" />
            <h2 className="text-xl font-black uppercase text-white tracking-tight">Diagnostic Report</h2>
          </div>
          
          <div className="prose prose-invert prose-p:font-mono prose-p:text-sm prose-p:text-[#A0A0A0] prose-headings:font-black prose-headings:uppercase prose-headings:text-white prose-li:font-mono prose-li:text-sm max-w-none">
            <ReactMarkdown>{result}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
