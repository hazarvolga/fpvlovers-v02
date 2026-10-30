import React from 'react';
import Image from 'next/image';
import { CyberBreadcrumb } from '@/features/navigation/components/Breadcrumb';
import { AdStickySidebar } from '@/features/monetization/components/NativeAds';
import { AISummaryBox } from '@/components/ui/AISummaryBox';
import { AffiliateCard } from '@/features/monetization/components/AffiliateCard';
import { MonitorPlay, Trophy, Cpu, Gamepad2, Zap, ShieldAlert, CheckCircle2, AlertTriangle, PlayCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const metadata = {
  title: 'FPV Simulator Training Guide & Best Sims | FPV LOVERS',
  description: 'Master the sticks before you fly real carbon. Compare the best FPV simulators like VelociDrone, Liftoff, and Uncrashed, and find the right radio.',
};

function getSimulatorData() {
  return {
    summary: "Simulators are the definitive entry point to FPV. Data indicates pilots who spend 40+ hours in Acro mode on a simulator face an 85% lower crash rate on their maiden flight. You will crash thousands of times while learning; doing it in a simulator costs nothing, while doing it in real life costs hundreds of dollars. Avoid Bluetooth gamepads (Xbox/PlayStation) due to centered throttles and lag; a dedicated FPV radio transmitter connected via USB is mandatory for true muscle memory development.",
    whySims: [
      { title: "Zero Repair Costs", text: "Crashing is inevitable in FPV. A simulator lets you break infinite digital drones without buying new motors, arms, or props." },
      { title: "Muscle Memory", text: "Acro mode requires constant stick input to maintain attitude. Your brain needs hours of repetition to make this instinctive." },
      { title: "Risk-Free Experimentation", text: "Try new freestyle tricks, aggressive racing lines, or tuning changes without the fear of destroying your equipment." }
    ],
    topSims: [
      { 
        name: "VelociDrone", 
        type: "Racing & Esports", 
        focus: "Ultimate Physics & Racing Dynamics", 
        price: "$22.00",
        desc: "The undisputed choice of professional FPV racers. While its graphics are slightly dated compared to modern Unreal Engine 5 titles, its physics engine is incredibly accurate, especially regarding cornering grip, propwash, and aerodynamic drag.",
        physics: "10/10 - Industry standard for racing physics.",
        graphics: "6/10 - Functional but dated.",
        hardware: "Low-End PC / Mac Compatible",
        pros: ["Unmatched flight dynamics", "Huge competitive multiplayer scene", "Runs well on older laptops"],
        cons: ["Visuals lack modern polish", "UI can be confusing for beginners", "Maps feel sterile"],
        imageUrl: "https://www.velocidrone.com/assets/images/velocidrone-featured.jpg",
      },
      { 
        name: "Liftoff: FPV Drone Racing", 
        type: "Freestyle & Community", 
        focus: "Beginner Friendly & Steam Workshop", 
        price: "$19.99",
        desc: "The most popular starting point for new pilots. It strikes a great balance between realistic physics and beautiful environments. Backed by a massive Steam Workshop community for custom tracks and drones.",
        physics: "8/10 - Slightly 'floaty' but excellent for learning.",
        graphics: "8/10 - Vibrant and detailed environments.",
        hardware: "Mid-Range PC Required",
        pros: ["Massive Steam Workshop community", "Licensed real-world drone parts", "Great tutorial for absolute beginners"],
        cons: ["Physics can feel slightly gravity-defying", "High system requirements for max settings"],
        imageUrl: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/396750/header.jpg",
      },
      { 
        name: "Uncrashed : FPV Drone Simulator", 
        type: "Cinematic Freestyle", 
        focus: "Stunning Graphics & Chasing", 
        price: "$14.99",
        desc: "Built for the cinematic pilot. If you want to practice chasing rally cars, flying down mountains, or diving skyscrapers in breathtaking visual fidelity, Uncrashed is the most beautiful simulator available.",
        physics: "7.5/10 - Good for freestyle, less accurate for racing.",
        graphics: "10/10 - Unreal Engine 5 visual masterpiece.",
        hardware: "High-End PC Required",
        pros: ["Breathtaking graphics and lighting", "Dynamic moving targets (cars, trains)", "Great for cinematic practice"],
        cons: ["Demands a powerful GPU", "Physics aren't as tight as VelociDrone"],
        imageUrl: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1682970/header.jpg",
      },
      { 
        name: "Tryp FPV", 
        type: "Open World Exploration", 
        focus: "Massive Maps & Cinematic Scenarios", 
        price: "$16.99",
        desc: "Features enormous, continuous 64km² maps ideal for long-range cruising and cinematic practice. Includes unique scenarios like wingsuit base jumpers, motorcycles, and massive canyons.",
        physics: "8/10 - Solid freestyle dynamics.",
        graphics: "9.5/10 - Gorgeous open worlds.",
        hardware: "High-End PC Required",
        pros: ["Incredibly huge open-world maps", "Unique chasing scenarios (wingsuits)", "Beautiful environmental design"],
        cons: ["Extremely heavy on PC resources", "Can stutter on mid-range hardware"],
        imageUrl: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1881200/header.jpg",
      }
    ],
    gear: [
      {
        title: "Radiomaster Boxer (ELRS)",
        description: "The absolute sweet spot for most pilots. Full-size hall gimbals, a compact gamepad-style body, and a powerful built-in 1W ExpressLRS module. It's everything a modern pilot needs.",
        price: "$139.99",
        url: "https://www.radiomasterrc.com/products/boxer-radio-controller",
        image: "https://www.radiomasterrc.com/cdn/shop/products/BoxerMainBlack_1024x1024.png",
        tag: "EDITORS CHOICE"
      },
      {
        title: "Radiomaster Pocket (ELRS)",
        description: "A highly affordable, ultra-compact ELRS radio with removable stick ends. Perfect for slipping into a backpack or for pilots on a tight budget just starting in simulators.",
        price: "$64.99",
        url: "https://www.radiomasterrc.com/products/pocket-radio-controller",
        image: "https://www.radiomasterrc.com/cdn/shop/files/Pocket_Charcoal_2_1024x1024.png",
        tag: "BUDGET ENTRY"
      },
      {
        title: "Radiomaster TX16S MKII",
        description: "The gold standard traditional radio. Features a large color touch screen, CNC hall effect gimbals, and maximum switches for complex setups and fixed-wing pilots.",
        price: "$199.99",
        url: "https://www.radiomasterrc.com/products/tx16s-mark-ii-radio-controller",
        image: "https://www.radiomasterrc.com/cdn/shop/products/TX16SMKII-ELRS-1_1024x1024.png",
        tag: "PREMIUM CHOICE"
      }
    ]
  };
}

export default function SimulatorsPage() {
  const data = getSimulatorData();
  const breadcrumbs = [
    { label: 'Learn', href: '/academy' },
    { label: 'Simulators', isCurrentPage: true },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28">
      <CyberBreadcrumb items={breadcrumbs} className="mb-8" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-8 flex flex-col gap-12">

          {/* HERO */}
          <div className="relative p-10 md:p-14 border border-white/5 bg-zinc-950 rounded-2xl overflow-hidden shadow-2xl">
             <div className="absolute inset-0 bg-gradient-to-br from-[#00F2FF]/10 via-[#00F2FF]/5 to-transparent pointer-events-none" />
             <div className="absolute -right-10 -top-10 w-64 h-64 bg-[#00F2FF]/10 blur-[80px] rounded-full pointer-events-none" />
             
             <MonitorPlay className="w-14 h-14 text-[#00F2FF] mb-6 opacity-90 drop-shadow-[0_0_15px_rgba(0,242,255,0.5)]" />
             <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-zinc-100 mb-4 leading-none">
               Simulator <br/><span className="text-[#00F2FF]">Training Guide</span>
             </h1>
             <p className="text-xs md:text-sm font-mono text-[#00F2FF]/80 max-w-2xl leading-relaxed uppercase tracking-[0.2em] mt-6 border-l-2 border-[#00F2FF]/50 pl-4">
                {"// Execute initial muscle memory calibration. Real-world gravity algorithms simulated in safe environments."}
             </p>
          </div>

          <AISummaryBox content={data.summary} />

          {/* WHY USE A SIMULATOR */}
          <div className="space-y-8">
             <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <ShieldAlert className="w-6 h-6 text-[#22C55E]" />
                <h2 className="text-2xl font-bold uppercase text-zinc-100 tracking-tight">Why You Must Start Here</h2>
             </div>
             <div className="grid sm:grid-cols-3 gap-6">
                {data.whySims.map((reason, i) => (
                   <div key={i} className="bg-zinc-900/50 p-6 border border-white/5 rounded-xl hover:border-[#22C55E]/40 hover:bg-[#22C55E]/5 transition-all duration-300 shadow-lg">
                      <div className="flex items-center gap-2 mb-4">
                        <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                        <h4 className="text-zinc-100 font-bold uppercase text-sm tracking-widest">{reason.title}</h4>
                      </div>
                      <p className="text-zinc-400 text-sm leading-relaxed">{reason.text}</p>
                   </div>
                ))}
             </div>
          </div>

          {/* TOP SIMULATORS COMPARISON */}
          <div className="space-y-8">
             <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <Gamepad2 className="w-6 h-6 text-[#00F2FF]" />
                <h2 className="text-2xl font-bold uppercase text-zinc-100 tracking-tight">Top FPV Simulators Compared</h2>
             </div>

             <div className="flex flex-col gap-8">
                {data.topSims.map((sim, i) => (
                   <div key={i} className="bg-zinc-950 border border-white/5 rounded-2xl overflow-hidden group hover:border-[#00F2FF]/40 transition-all duration-500 shadow-xl flex flex-col md:flex-row">
                      {/* Image Side */}
                      <div className="relative w-full md:w-2/5 aspect-[16/9] md:aspect-auto overflow-hidden bg-zinc-900">
                         <Image
                           src={sim.imageUrl}
                           alt={sim.name}
                           fill
                           unoptimized={true}
                           className="object-cover group-hover:scale-105 transition-transform duration-700 opacity-80 group-hover:opacity-100"
                         />
                         <div className="absolute inset-0 bg-gradient-to-r from-transparent to-zinc-950/90 md:to-zinc-950/80" />
                         <div className="absolute top-4 left-4">
                           <Badge className="bg-zinc-900/50 backdrop-blur-md border border-white/10 text-zinc-100 font-mono text-[10px] uppercase">{sim.hardware}</Badge>
                         </div>
                      </div>
                      
                      {/* Content Side */}
                      <div className="p-6 md:p-8 flex flex-col w-full md:w-3/5 relative z-10 -mt-6 md:mt-0 bg-gradient-to-t from-zinc-950/90 md:bg-none to-transparent">
                         <div className="flex justify-between items-start mb-4">
                            <div>
                               <div className="text-[10px] text-[#00F2FF] mb-2 tracking-[0.2em] uppercase font-bold">{sim.type}</div>
                               <h3 className="text-zinc-100 font-bold text-2xl tracking-tight">{sim.name}</h3>
                            </div>
                            <div className="text-[#FF5C00] font-bold bg-[#FF5C00]/10 px-3 py-1.5 rounded border border-[#FF5C00]/20 text-sm shadow-[0_0_10px_rgba(255,92,0,0.2)]">
                              {sim.price}
                            </div>
                         </div>
                         
                         <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                           {sim.desc}
                         </p>

                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                            <div className="bg-zinc-900 p-3 rounded-lg border border-white/5">
                               <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1 flex items-center gap-1"><Cpu className="w-3 h-3"/> Physics</div>
                               <div className="text-xs text-zinc-100 font-semibold">{sim.physics}</div>
                            </div>
                            <div className="bg-zinc-900 p-3 rounded-lg border border-white/5">
                               <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1 flex items-center gap-1"><PlayCircle className="w-3 h-3"/> Graphics</div>
                               <div className="text-xs text-zinc-100 font-semibold">{sim.graphics}</div>
                            </div>
                         </div>

                         <div className="grid grid-cols-2 gap-4 mt-auto">
                            <div>
                               <div className="text-[10px] text-[#22C55E] uppercase tracking-widest font-bold mb-2">Pros</div>
                                <ul className="space-y-1">
                                 {sim.pros.map((pro, j) => (
                                   <li key={j} className="text-[11px] text-zinc-400 flex items-start gap-1.5">
                                      <span className="text-[#22C55E] mt-0.5">+</span> {pro}
                                   </li>
                                 ))}
                               </ul>
                            </div>
                            <div>
                               <div className="text-[10px] text-red-400 uppercase tracking-widest font-bold mb-2">Cons</div>
                               <ul className="space-y-1">
                                 {sim.cons.map((con, j) => (
                                   <li key={j} className="text-[11px] text-zinc-400 flex items-start gap-1.5">
                                      <span className="text-red-400 mt-0.5">-</span> {con}
                                   </li>
                                 ))}
                               </ul>
                            </div>
                         </div>
                      </div>
                   </div>
                ))}
             </div>
          </div>

          {/* REQUIRED HARDWARE */}
          <div className="space-y-8 mt-4">
             <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <Trophy className="w-6 h-6 text-[#FF5C00]" />
                <h2 className="text-2xl font-bold uppercase text-zinc-100 tracking-tight">Required Interface Hardware</h2>
             </div>
             
             <div className="bg-[#FF5C00]/10 border border-[#FF5C00]/20 rounded-xl p-5 flex items-start gap-4">
                <AlertTriangle className="w-6 h-6 text-[#FF5C00] flex-shrink-0 mt-0.5" />
                <div>
                   <h4 className="text-zinc-100 font-bold mb-1">Crucial Warning: Do Not Use Gamepads!</h4>
                   <p className="text-zinc-400 text-sm leading-relaxed">
                     To fly a simulator correctly, you need a real FPV radio transmitter. Do not use an Xbox or PlayStation controller; their throttle sticks re-center automatically, which will teach you the wrong muscle memory for Acro mode and lead to immediate crashes in real life.
                   </p>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-6">
                {data.gear.map((item, i) => (
                   <div key={i} className="flex h-full">
                     <AffiliateCard {...item} linkKind="source" tag={`${item.tag} — MANUFACTURER SOURCE, NOT AFFILIATE`} />
                   </div>
                ))}
             </div>
          </div>

        </div>

        {/* SIDEBAR */}
        <aside className="lg:col-span-4 hidden lg:flex flex-col gap-8 sticky top-28">
           <div className="bg-zinc-950 border border-white/5 rounded-xl p-6 shadow-xl">
             <h3 className="text-sm font-bold uppercase text-zinc-100 tracking-widest mb-4 flex items-center gap-2">
               <Zap className="w-4 h-4 text-[#FFD700]" /> Pro Tip
             </h3>
             <p className="text-sm text-zinc-400 leading-relaxed">
               Most modern ELRS radios (like the Radiomaster Boxer) support Bluetooth Joystick mode, but for the absolute lowest latency, always connect your radio to your PC using a high-quality USB-C data cable.
             </p>
           </div>
           
           <AdStickySidebar />
        </aside>
      </div>
    </div>
  );
}
