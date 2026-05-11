'use client';

import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Activity, ShieldAlert, Cpu, Battery, Video, Send, Loader2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';

export function PartMatcherWidget() {
  const [formData, setFormData] = useState({
    frame: '',
    motor: '',
    prop: '',
    esc: '',
    battery: '',
    fc: '',
    vtx: '',
    auw: '',
    style: 'freestyle'
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeCompatibility = async () => {
    if (!formData.frame || !formData.motor) {
      setError("Please enter at least Frame and Motor details.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "AIzaSy...") {
        throw new Error("Gemini API key is not configured in .env.local");
      }

      const ai = new GoogleGenAI({ apiKey });
      const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const systemInstruction = `
# ROLE: Senior FPV Engineering Architect & Hardware Compatibility Expert
# MISSION: Analyze FPV drone component lists for technical, electrical, and physical compatibility.

## 🧠 ENGINEERING LOGIC (Chain-of-Thought):
1. **Power Systems Check:** Voltage (S) compatibility. Check if Motor KV, Battery S, and ESC are aligned.
2. **Propulsion Dynamics (CRITICAL):** Analyze Motor KV + Propeller Size + Pitch vs. Voltage. (e.g., 2400KV on 6S with 5" prop = Danger).
3. **Thrust-to-Weight Ratio:** Calculate based on AUW. Target: >5:1 for Freestyle, >8:1 for Racing.
4. **Electrical Load:** Max current draw vs. ESC rating.
5. **Physical Mounting:** Stack size and VTX fitment.

## 📝 OUTPUT FORMAT:
### 📊 COMPATIBILITY MATRIX
- 🟢/🔴/🟡 [Component]: Status.

### 🧐 TECHNICAL ANALYSIS (Chain-of-Thought)
- Deep dive into propulsion efficiency and thermal risks.

### ⚡ PERFORMANCE METRICS (Estimated)
- **Thrust Ratio:** X:1
- **Flight Time:** X mins (based on style)
- **Thermal Load:** Low/Medium/Critical

### 🛠️ RECOMMENDED UPGRADES
- Suggested alternatives for mismatched parts.
`;

      const prompt = `
Target Style: ${formData.style}
Estimated AUW: ${formData.auw}g
Components:
- Frame: ${formData.frame}
- Motor: ${formData.motor}
- Propeller: ${formData.prop}
- ESC: ${formData.esc}
- Battery: ${formData.battery}
- FC: ${formData.fc}
- VTX: ${formData.vtx}
`;

      const response = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: systemInstruction + "\n\n" + prompt }] }]
      });

      setResult(response.response.text());
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred during analysis.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const fillDemo = () => {
    setFormData({
      frame: 'Apex 5" Freestyle',
      motor: '2207 1950KV',
      prop: 'Gemfan 51433 Tri-blade',
      esc: '50A 4-in-1',
      battery: '6S 1100mAh LiPo',
      fc: 'F722 Stack',
      vtx: 'DJI O3 Air Unit',
      auw: '650',
      style: 'freestyle'
    });
  };

  return (
    <div className="flex flex-col gap-8 w-full">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-xs font-mono text-[#666666] uppercase tracking-[0.3em]">Build Configuration v2.0</h3>
        <button 
          onClick={fillDemo}
          className="text-[10px] font-mono text-[#00F2FF]/50 hover:text-[#00F2FF] transition-colors border-b border-[#00F2FF]/20"
        >
          [LOAD_TEST_DATA]
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { label: 'Frame', name: 'frame', icon: Activity, placeholder: 'e.g., Apex 5" EVO' },
          { label: 'Motor', name: 'motor', icon: Zap, placeholder: 'e.g., 2207 1950KV' },
          { label: 'Propeller', name: 'prop', icon: Wind, placeholder: 'e.g., 51433 Tri-blade' },
          { label: 'ESC', name: 'esc', icon: Cpu, placeholder: 'e.g., 50A 4-in-1' },
          { label: 'Battery', name: 'battery', icon: Battery, placeholder: 'e.g., 6S 1100mAh' },
          { label: 'VTX / Digital Link', name: 'vtx', icon: Video, placeholder: 'e.g., DJI O3 Air Unit' },
        ].map((field) => (
          <div key={field.name} className="space-y-2">
            <label className="text-[10px] font-black tracking-widest uppercase text-[#00F2FF]/70 flex items-center gap-2">
              <field.icon className="w-3 h-3" /> {field.label}
            </label>
            <input 
              type="text" 
              name={field.name}
              value={formData[field.name as keyof typeof formData]}
              onChange={handleInputChange}
              placeholder={field.placeholder}
              className="w-full bg-[#050505] border border-[#333333] px-4 py-4 font-mono text-sm text-white focus:outline-none focus:border-[#00F2FF] focus:shadow-[0_0_15px_rgba(0,242,255,0.1)] transition-all duration-300 hex-panel" 
            />
          </div>
        ))}
        
        <div className="space-y-2">
          <label className="text-[10px] font-black tracking-widest uppercase text-[#00F2FF]/70 flex items-center gap-2">
            <Activity className="w-3 h-3" /> Estimated AUW (g)
          </label>
          <input 
            type="number" 
            name="auw"
            value={formData.auw}
            onChange={handleInputChange}
            placeholder="e.g., 650"
            className="w-full bg-[#050505] border border-[#333333] px-4 py-4 font-mono text-sm text-white focus:outline-none focus:border-[#00F2FF] transition-all hex-panel" 
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black tracking-widest uppercase text-[#00F2FF]/70 flex items-center gap-2">
            <Send className="w-3 h-3" /> Target Style
          </label>
          <select 
            name="style"
            value={formData.style}
            onChange={handleInputChange}
            className="w-full bg-[#050505] border border-[#333333] px-4 py-4 font-mono text-sm text-white focus:outline-none focus:border-[#00F2FF] transition-all hex-panel appearance-none"
          >
            <option value="freestyle">Freestyle (Balanced)</option>
            <option value="racing">Racing (Max Thrust)</option>
            <option value="cinematic">Cinematic (Smoothness)</option>
            <option value="longrange">Long Range (Efficiency)</option>
          </select>
        </div>
      </div>
      
      <Button 
        variant="default" 
        className="w-full h-16 text-lg font-black tracking-[0.2em] bg-[#00F2FF] text-black hover:bg-[#00D0DB] transition-all group relative overflow-hidden" 
        onClick={analyzeCompatibility}
        disabled={loading}
      >
        <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-full transition-transform duration-500 skew-x-12" />
        {loading ? (
          <>
            <Loader2 className="w-6 h-6 mr-3 animate-spin" />
            COMPUTING FLIGHT DYNAMICS...
          </>
        ) : (
          <>
            <Send className="w-6 h-6 mr-3" />
            INITIATE MULTI-FACTOR SCAN
          </>
        )}
      </Button>

      {error && (
        <div className="p-4 border border-red-500/50 bg-red-500/10 text-red-400 font-mono text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
          <ShieldAlert className="w-5 h-5 shrink-0" /> 
          <div>
            <div className="font-black mb-1 text-red-500 uppercase">[SCAN_ERROR]</div>
            {error}
          </div>
        </div>
      )}

      {result && (
        <div className="mt-12 pt-12 border-t border-[#333333] animate-in fade-in duration-700">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-full bg-[#00F2FF]/20 flex items-center justify-center">
               <Activity className="w-4 h-4 text-[#00F2FF]" />
            </div>
            <h2 className="text-2xl font-black uppercase text-white tracking-tighter">Diagnostic Output v2.0</h2>
          </div>
          
          <div className="prose prose-invert prose-p:font-mono prose-p:text-sm prose-p:text-[#A0A0A0] prose-headings:font-black prose-headings:uppercase prose-headings:text-[#00F2FF] prose-headings:tracking-tighter prose-li:font-mono prose-li:text-sm max-w-none bg-[#050505] p-8 border border-[#333333] hex-panel relative">
             <div className="absolute top-0 right-0 p-4 font-mono text-[8px] text-[#333333]">
                FPV_LOVERS_ORACLE_SECURE_LINK
             </div>
            <ReactMarkdown>{result}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
