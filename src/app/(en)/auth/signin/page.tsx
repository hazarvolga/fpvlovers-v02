"use client";

// "use client" single-line rationale: Client-side states manage login toggle, form submissions, and loading telemetry animations.
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  
  // HUD Telemetry loading screen states
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const router = useRouter();

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    setLoadingMessage("Sinyal doğrulanıyor... Pilot oturumu açılıyor.");

    try {
      if (isSignUp) {
        // Registration Flow
        const res = await fetch("/api/pilot/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Kayıt sırasında bir hata oluştu.");
        }

        setLoadingMessage("Pilot başarıyla tescil edildi! Oturum başlatılıyor...");
      }

      // Perform NextAuth Credentials Sign In
      const authRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (authRes?.error) {
        throw new Error("Kimlik doğrulama başarısız. Bilgilerinizi kontrol edin.");
      }

      // Direct pilot to roadmap after successful login
      router.push("/academy/roadmap");
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Bir bağlantı hatası oluştu.");
      setLoading(false);
    }
  };

  const handleOAuthLogin = (provider: "google" | "discord" | "github") => {
    setErrorMsg("");
    setLoading(true);
    const providerNames = {
      google: "Google Uydusu",
      discord: "Discord Ana Üssü",
      github: "GitHub Terminali",
    };
    setLoadingMessage(`${providerNames[provider]}'na bağlanılıyor... Sinyal aranıyor. Lütfen bekleyin.`);
    
    // Trigger NextAuth OAuth Sign In redirecting to provider
    signIn(provider, { callbackUrl: "/academy/roadmap" });
  };

  return (
    <div className="min-h-screen bg-[#050810] text-[#f8fafc] font-mono flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Dynamic scanlines & grids to simulate FPV Goggles HUD */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,242,255,0.01)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,242,255,0.02)_0%,transparent_70%)] pointer-events-none"></div>

      {/* 1. HUD Telemetry Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-[#050810]/95 backdrop-blur-md z-50 flex flex-col justify-center items-center p-6 text-center">
          <div className="w-20 h-20 border-4 border-[#00F2FF]/20 border-t-[#00F2FF] rounded-full animate-spin mb-6"></div>
          <div className="text-xs uppercase tracking-widest text-[#00F2FF] mb-2 animate-pulse">📡 TELEMETRY LINK ACTIVE</div>
          <p className="text-sm max-w-sm text-gray-400 font-semibold">{loadingMessage}</p>
        </div>
      )}

      {/* 2. Authentication Panel */}
      <div className="w-full max-w-md bg-[#0A0E1A]/80 border border-white/5 shadow-[0_0_50px_rgba(0,242,255,0.03)] rounded-2xl p-8 backdrop-blur-md relative z-10">
        <div className="flex flex-col items-center mb-8 border-b border-white/5 pb-6">
          <div className="w-3 h-3 rounded-full bg-[#FF5C00] animate-pulse mb-3"></div>
          <h1 className="text-xl font-bold uppercase tracking-wider text-white">FPV Lovers Cockpit</h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Flight Authorization Terminal</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-950/30 border border-red-500/20 text-red-400 text-xs rounded-lg uppercase tracking-wider leading-relaxed">
            [!] ERROR: {errorMsg}
          </div>
        )}

        <form onSubmit={handleCredentialsSubmit} className="space-y-5">
          {isSignUp && (
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1.5 font-bold">Pilot Callsign / Adı</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ÖRN: HAZARVOLGA"
                required
                className="w-full bg-[#050810] border border-white/5 focus:border-[#00F2FF]/40 rounded-lg py-2.5 px-4 text-sm font-semibold outline-none transition-colors placeholder:text-gray-700"
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1.5 font-bold">E-Posta Adresi</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="pilot@fpvlovers.com"
              required
              className="w-full bg-[#050810] border border-white/5 focus:border-[#00F2FF]/40 rounded-lg py-2.5 px-4 text-sm font-semibold outline-none transition-colors placeholder:text-gray-700"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1.5 font-bold">Güvenlik Parolası</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              className="w-full bg-[#050810] border border-white/5 focus:border-[#00F2FF]/40 rounded-lg py-2.5 px-4 text-sm font-semibold outline-none transition-colors placeholder:text-gray-700"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#FF5C00] hover:bg-[#FF5C00]/90 active:scale-[0.98] transition-all text-black font-black uppercase text-xs tracking-widest rounded-lg mt-2 cursor-pointer shadow-[0_0_20px_rgba(255,92,0,0.15)]"
          >
            {isSignUp ? "Deploy Credentials" : "Boot Pilot Session"}
          </button>
        </form>

        {/* 3. Divider */}
        <div className="relative flex py-5 items-center">
          <div className="flex-grow border-t border-white/5"></div>
          <span className="flex-shrink mx-4 text-[9px] text-gray-600 uppercase tracking-widest">Satellite Link Options</span>
          <div className="flex-grow border-t border-white/5"></div>
        </div>

        {/* 4. Social OAuth Logins */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => handleOAuthLogin("discord")}
            className="py-2.5 bg-[#5865F2]/10 hover:bg-[#5865F2]/20 border border-[#5865F2]/20 rounded-lg flex flex-col justify-center items-center text-[10px] font-bold text-gray-300 transition-colors cursor-pointer"
          >
            DISCORD
          </button>
          <button
            onClick={() => handleOAuthLogin("google")}
            className="py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex flex-col justify-center items-center text-[10px] font-bold text-gray-300 transition-colors cursor-pointer"
          >
            GOOGLE
          </button>
          <button
            onClick={() => handleOAuthLogin("github")}
            className="py-2.5 bg-[#24292F]/20 hover:bg-[#24292F]/40 border border-[#24292F]/30 rounded-lg flex flex-col justify-center items-center text-[10px] font-bold text-gray-300 transition-colors cursor-pointer"
          >
            GITHUB
          </button>
        </div>

        {/* 5. Registration Toggle Footer */}
        <div className="text-center mt-8 border-t border-white/5 pt-6 text-[10px] text-gray-500">
          {isSignUp ? (
            <span>
              Zaten tescilli pilot musunuz?{" "}
              <button
                onClick={() => setIsSignUp(false)}
                className="text-[#00F2FF] hover:underline cursor-pointer"
              >
                Giriş Terminaline Dön
              </button>
            </span>
          ) : (
            <span>
              Uçuş tesciliniz yok mu?{" "}
              <button
                onClick={() => setIsSignUp(true)}
                className="text-[#00F2FF] hover:underline cursor-pointer"
              >
                Yeni Pilot Kaydı Oluştur
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
