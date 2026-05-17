import Image from 'next/image';
import Link from 'next/link';
import { fetchDifyInsights } from '@/lib/dify';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AffiliateButton } from '@/features/monetization/components/AffiliateButton';
import { AdZone } from '@/features/monetization/components/AdZone';
import { Button } from '@/components/ui/button';
import { ChevronRight, Cpu, Wind, Zap } from 'lucide-react';
import { AdBanner, AdInFeed } from '@/features/monetization/components/NativeAds';
import { NewsletterWidget } from '@/features/tools/components/NewsletterWidget';
import { PilotPulseWidget } from '@/features/tools/components/PilotPulseWidget';

export default async function HomePage() {
  const insights = await fetchDifyInsights();

  return (
    <div className="flex flex-col gap-16 pb-16">

      {/* HERO SECTION */}
      <section className="relative min-h-[90vh] flex text-left items-center justify-start overflow-hidden pt-20 px-4 sm:px-6 lg:px-16 mb-8 group">
        {/* Aggressive Background Visuals */}
        <div className="absolute inset-0 z-0">
           {/* Dark Overlay over a tech background */}
           <div className="absolute inset-0 bg-[#050505]/80 mix-blend-multiply z-10" />
           <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0B] via-[#050505]/95 to-transparent z-10" />

           {/* Macro FPV Drone Visual / Masked */}
           <Image
             src="https://picsum.photos/seed/hero/2670/1200"
             alt="FPV Drone Motor Macro"
             fill
             className="object-cover opacity-30 mix-blend-screen scale-105 group-hover:scale-100 transition-transform duration-1000 ease-out"
           />
           {/* VTX Circuit visual masking */}
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 z-10" />
        </div>

        <div className="w-full max-w-7xl mx-auto z-20 grid lg:grid-cols-12 gap-12 items-center">
          <div className="flex flex-col gap-6 lg:col-span-7">
            <Badge variant="outline" className="w-fit mb-2 font-mono text-[#00F2FF] border-[#00F2FF]/30 tracking-[0.3em] font-bold">
               [OVERRIDE_AUTH_ENGAGED]
            </Badge>
            <h1 className="text-5xl md:text-7xl lg:text-[5rem] font-black tracking-tighter uppercase leading-[0.9] text-white">
              <span className="opacity-90">MACH-1</span><br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F2FF] to-[#00A8B3] text-glow">
                TELEMETRY
              </span>
            </h1>
            <p className="text-[#A0A0A0] max-w-xl text-sm leading-relaxed font-mono uppercase">
{"// WARNING: Entering high-performance airspace. DIFY RAG synchronized. Real-time component analysis and flight software intel active. Proceed with caution."}
</p>
            <div className="flex flex-wrap items-center gap-4 mt-6">
              <Button size="lg" className="h-14 px-8 text-lg font-black tracking-widest group/btn" variant="default">
                <span className="relative z-10 flex items-center">ARM SYSTEM <Zap className="ml-3 w-5 h-5 fill-current opacity-70 group-hover/btn:opacity-100 transition-opacity" /></span>
                <div className="absolute inset-0 bg-[#00F2FF]/20 blur-md opacity-0 group-hover/btn:opacity-100 transition-opacity" />
              </Button>
              <Button size="lg" className="h-14 px-8 font-black tracking-widest text-sm text-[#A0A0A0]" variant="cyber">
                VTX SCAN
              </Button>
            </div>

            <div className="mt-12 flex flex-col sm:flex-row gap-6 text-xs font-mono text-[#666666] uppercase tracking-widest border-t border-[#333333] pt-6 w-max">
              <div className="flex items-center gap-3">
                 <div className="w-2 h-2 bg-[#00F2FF] rounded-full animate-pulse shadow-[0_0_8px_#00F2FF]" />
                 LINK_QUALITY: 99%
              </div>
              <div className="flex items-center gap-3">
                 <div className="w-2 h-2 bg-[#FF5C00] rounded-full animate-pulse shadow-[0_0_8px_#FF5C00]" />
                 THROTTLE: ARMED
              </div>
            </div>
          </div>

          <div className="hidden lg:flex lg:col-span-5 justify-end relative h-[500px]">
             {/* Interactive Scanner UI / HUD overlay that reacts on hover */}
             <div className="relative w-full h-full flex items-center justify-center">
                 {/* Rotating Hexagonal Radars */}
                 <div className="absolute w-[400px] h-[400px] border border-[#00F2FF]/10 clip-path-hex animate-[spin_30s_linear_infinite]" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
                 <div className="absolute w-[350px] h-[350px] border-2 border-dashed border-[#FF5C00]/20 rounded-full animate-[spin_20s_linear_infinite_reverse]" />

                 {/* Central Tech Module X-Ray Simulator */}
                 <div className="relative w-64 h-64 glass hex-panel flex items-center justify-center group-hover:border-[#00F2FF]/50 transition-colors duration-500 overflow-hidden">
                    <div className="absolute inset-0 carbon-grid opacity-30" />

                    {/* The Scanline */}
                    <div className="absolute w-[200%] h-8 bg-gradient-to-b from-transparent via-[#00F2FF]/30 to-transparent -translate-x-1/2 -rotate-45 animate-[scanline_3s_linear_infinite]" />

                    <Cpu className="w-24 h-24 text-[#00F2FF] opacity-80" />
                    <div className="absolute bottom-4 text-[10px] font-mono text-[#00F2FF] font-black tracking-widest neon-text">
                       FC MODULE .// ONLINE
                    </div>
                 </div>

                 {/* Side Floating HUD Specs */}
                 <div className="absolute -right-8 top-1/4 flex flex-col gap-2 font-mono text-[9px] text-[#A0A0A0] uppercase border-l border-[#333333] pl-3 py-2">
                    <span className="text-[#00F2FF]"># GYRO SPI1</span>
                    <span>32kHz LOCKED</span>
                 </div>
                 <div className="absolute -left-12 bottom-1/4 flex flex-col gap-2 font-mono text-[9px] text-[#A0A0A0] uppercase text-right border-r border-[#333333] pr-3 py-2">
                    <span className="text-[#FF5C00]"># ESC 4-IN-1</span>
                    <span>DSHOT600 / 60A</span>
                 </div>
             </div>
          </div>
        </div>
      </section>

      {/* PILOT PULSE TICKER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10 relative mt-[-2rem] mb-4">
         <PilotPulseWidget />
      </section>

      {/* REVENUE ZONE - SPONSOR (Top Secondary Z-Path) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10 relative">
         <AdBanner title="FEATURED PARTNER: DJI ENTERPRISE" className="min-h-[120px] bg-gradient-to-r from-[#050810] to-[#00F5FF]/5" />
      </section>

      {/* DIFY INSIGHTS BENTO GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between mb-8 relative z-10">
            <h2 className="text-3xl font-black tracking-tighter text-white uppercase flex items-center gap-3">
              <span className="w-8 h-1 bg-[#00F5FF] block" /> NEURAL FEED
            </h2>
            <div className="text-sm font-mono text-slate-500">SYS.DIFY.RAG_SYNC</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[minmax(300px,_auto)]">
          {insights.map((insight, i) => (
             <Card key={insight.id} className={`flex flex-col group ${i === 0 ? 'md:col-span-2 lg:col-span-2 row-span-2' : ''}`}>
                {insight.imageUrl && (
                  <div className="relative w-full h-48 md:h-64 overflow-hidden rounded-t-xl border-b border-white/5">
                    <Image
                      src={insight.imageUrl}
                      alt={insight.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-space-card to-transparent" />
                    <Badge className="absolute top-4 left-4" variant={insight.category === 'AI Software' ? 'amber' : 'default'}>
                        {insight.category}
                    </Badge>
                  </div>
                )}

                <CardHeader className={!insight.imageUrl ? 'mt-4' : ''}>
                  {!insight.imageUrl && (
                     <Badge className="w-fit mb-3" variant={insight.category === 'AI Software' ? 'amber' : 'default'}>
                        {insight.category}
                     </Badge>
                  )}
                  <Link href={`/article/${insight.id}`}>
                    <CardTitle className="group-hover:text-[#00F5FF] transition-colors line-clamp-2 uppercase tracking-tight">{insight.title}</CardTitle>
                  </Link>
                  <CardDescription className="line-clamp-3 text-white/40">
                    {insight.summary}
                  </CardDescription>
                </CardHeader>

                <CardContent className="mt-auto">
                    <div className="flex flex-col gap-2 text-xs font-mono text-slate-400 mb-4 bg-black/30 p-3 rounded-lg border border-white/5">
                        {Object.entries(insight.technicalSpecs).slice(0, 3).map(([k, v]) => (
                            <div key={k} className="flex justify-between border-b border-white/5 pb-1 last:border-0 last:pb-0">
                                <span>{k}</span>
                                <span className="text-cyan-300 text-right">{v}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>

                <CardFooter className="pt-0 pb-6 mt-auto">
                   <div className="w-full flex items-end justify-between gap-4">
                     <Button size="icon" variant="ghost" asChild className="hidden sm:flex self-end">
                       <Link href={`/article/${insight.id}`}>
                         <ChevronRight className="w-5 h-5 text-white/30" />
                       </Link>
                     </Button>
                     {/* Bottom-Right Terminal Action (Z-Pattern Exit) */}
                     <AffiliateButton
                        url={insight.affiliateLink}
                        price={insight.price}
                        provider={insight.category === 'Flight Guides' ? 'Direct' : 'Amazon'}
                        className="flex-1 sm:flex-none justify-end"
                     />
                   </div>
                </CardFooter>
             </Card>
          ))}

          {/* IN-FEED AD ZONE (Diagonal Z-Path) */}
          <div className="md:col-span-1 lg:col-span-1 rounded-xl h-full flex">
             <AdInFeed className="w-full h-full flex-1" />
          </div>
        </div>
      </section>

      {/* NEWSLETTER AUTOMATION OUTPOST */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-12 mb-16">
         <NewsletterWidget />
      </section>

    </div>
  );
}
