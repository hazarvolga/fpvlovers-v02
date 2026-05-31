import { enqueueContentJob } from '../src/lib/content-automation/queue';
import type { ContentJob } from '../src/lib/content-automation/types';

const newBriefs: Omit<ContentJob, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'brief-lipo-battery-safety-charging',
    briefSlug: 'lipo-battery-safety-charging-guide',
    title: 'FPV LiPo Battery Safety & Charging Guide: Prevent Fires and Fly Longer',
    category: 'Build Guides',
    status: 'queued',
    topic: 'A comprehensive safety and configuration guide explaining how LiPo batteries work, safe charging rates (1C), storage voltage (3.8-3.85V), parallel charging, and how to safely dispose of damaged cells.',
    language: 'en',
    template: 'build-guide',
    promptVersion: 'v2',
    sourceHints: [
      "What a LiPo battery is and cell voltage levels (nominal, max, storage, critical minimum)",
      "Essential rules of LiPo charging: never leave unattended, use a fire-safe bag, charge at 1C rate",
      "Storage charge and why it is critical for battery longevity",
      "Introduction to parallel charging: safety rules and common pitfalls",
      "How to identify a damaged battery and safely dispose of it"
    ],
    seo: {
      slug: 'lipo-battery-safety-charging-guide',
      metaDescription: 'Learn how to charge, store, and maintain your FPV LiPo batteries safely. Avoid common charging mistakes and prevent fires.',
      keywords: ['FPV LiPo battery guide', 'how to charge LiPo safely', 'parallel charging FPV', 'LiPo storage charge voltage']
    }
  },
  {
    id: 'brief-ultimate-vtx-video-ecosystem',
    briefSlug: 'ultimate-vtx-video-ecosystem-guide',
    title: 'The Ultimate FPV Video Ecosystem Guide in 2026: DJI vs Walksnail vs HDZero vs Analog',
    category: 'News and Reviews',
    status: 'queued',
    topic: 'A comparative review of the four major FPV video systems, outlining the tradeoffs in latency, image quality, cost, signal penetration, and weight to help new pilots choose.',
    language: 'en',
    template: 'tech-article',
    promptVersion: 'v2',
    sourceHints: [
      "Brief overview of the four video systems currently dominating the market",
      "Tradeoffs in latency: HDZero (lowest/fixed) vs DJI/Walksnail (variable but high detail) vs Analog (lowest cost/latency but low res)",
      "Image quality and range comparison under real-world conditions",
      "Cost breakdown of goggles, receivers, and VTXs by ecosystem",
      "Recommendations for racers, freestylers, and cinematic pilots"
    ],
    seo: {
      slug: 'ultimate-vtx-video-ecosystem-guide',
      metaDescription: 'Compare DJI, Walksnail, HDZero, and Analog FPV video systems. Discover the latency, cost, and image quality differences before you buy.',
      keywords: ['analog vs digital FPV 2026', 'DJI O3 vs Walksnail Avatar', 'HDZero vs Walksnail', 'best digital FPV system']
    }
  },
  {
    id: 'brief-elrs-binding-flashing-guide',
    briefSlug: 'elrs-binding-flashing-guide',
    title: 'ExpressLRS Binding and Flashing Guide: Step-by-Step for EdgeTX & Betaflight',
    category: 'Flight Guides',
    status: 'queued',
    topic: 'A step-by-step tutorial explaining how to configure ExpressLRS (ELRS) on FPV drones, compile firmware via ELRS Configurator, flash receivers via Wi-Fi/Passthrough, and bind using a binding phrase.',
    language: 'en',
    template: 'tech-article',
    promptVersion: 'v2',
    sourceHints: [
      "What makes ExpressLRS (ELRS) the default protocol for FPV pilots today",
      "Prerequisites: compiling firmware using ExpressLRS Configurator and compiling the lua script",
      "How to flash the TX module and the RX receiver using Wi-Fi or Betaflight Passthrough",
      "The magic of binding phrases: configure once and bind automatically",
      "Basic troubleshooting for packet rate mismatches and firmware mismatches"
    ],
    seo: {
      slug: 'elrs-binding-flashing-guide',
      metaDescription: 'Compile, flash, and bind your ExpressLRS (ELRS) receiver and transmitter module with a clear, step-by-step beginner-friendly tutorial.',
      keywords: ['ExpressLRS binding guide', 'how to flash ELRS receiver', 'ELRS configurator tutorial', 'EdgeTX ELRS lua script']
    }
  },
  {
    id: 'brief-how-to-choose-fpv-motors',
    briefSlug: 'how-to-choose-fpv-motors',
    title: 'How to Choose FPV Motors: Understanding KV, Stator Size, and Propeller Matching',
    category: 'Components',
    status: 'queued',
    topic: 'An educational guide detailing stator size numbering (e.g. 2207, 2306), KV options, battery voltage (4S vs 6S) scaling, and matching propeller pitch to motor size.',
    language: 'en',
    template: 'tech-article',
    promptVersion: 'v2',
    sourceHints: [
      "What stator numbers actually mean: stator diameter (first two digits) vs height (last two digits)",
      "KV rating explained: RPM per volt and why lower KV (e.g. 1700KV) goes with 6S and higher KV (e.g. 2400KV) goes with 4S",
      "The trade-offs of stator size: 2207 (top-end throttle) vs 2306 (mid-range control)",
      "How to match motor size to frame weight and propeller pitch",
      "Warning signs of bad motor matching: overheating, oscillations, and amp spikes"
    ],
    seo: {
      slug: 'how-to-choose-fpv-motors',
      metaDescription: 'Decode FPV motor stator sizes, KV ratings, and voltages to pick the perfect motors for your 5-inch or micro drone build.',
      keywords: ['how to choose FPV motors', 'motor stator size explained', 'FPV motor KV meaning', '2207 vs 2306 motors']
    }
  },
  {
    id: 'brief-best-5-inch-fpv-frame',
    briefSlug: 'best-5-inch-fpv-frame',
    title: 'How to Pick the Best 5-Inch FPV Frame: Durability, Layout, and Weight',
    category: 'Components',
    status: 'queued',
    topic: 'A hardware guide explaining the difference between True X, Squashed X, Deadcat, and Stretch X frame geometries, carbon fiber quality, arm thickness, and assembly layout.',
    language: 'en',
    template: 'tech-article',
    promptVersion: 'v2',
    sourceHints: [
      "Why FPV frame selection defines the structure and flight feel of your drone",
      "Frame geometries compared: True X (symmetrical), Squashed X (compact), Deadcat (no props in camera view)",
      "Carbon fiber basics: weave quality, chamfered edges, and why arm thickness (5mm+) matters for durability",
      "Component protection: cage design, camera mounts, and space for ESC/FC stacks",
      "Weight considerations: lightweight racing frames vs heavy-duty freestyle frames"
    ],
    seo: {
      slug: 'best-5-inch-fpv-frame',
      metaDescription: 'Compare FPV frame shapes (True X, Deadcat, Squashed X) and carbon fiber durability factors to choose the perfect frame for your build.',
      keywords: ['best 5 inch FPV frame', 'freestyle vs cinematic frame', 'FPV frame layout comparison', 'deadcat FPV frame advantages']
    }
  },
  {
    id: 'brief-soldering-guide-for-fpv',
    briefSlug: 'soldering-guide-for-fpv',
    title: 'Soldering Guide for FPV Drone Builders: Solder Pads, Temperature, and Tools',
    category: 'Build Guides',
    status: 'queued',
    topic: 'A hands-on build tutorial covering essential soldering equipment (TS100/TS101, pinecil), choosing leaded vs lead-free solder, using flux, tinning wires, and soldering motor and ESC pads.',
    language: 'en',
    template: 'build-guide',
    promptVersion: 'v2',
    sourceHints: [
      "The importance of good soldering for reliable FPV flight (prevent mid-air power failures)",
      "Essential tools list: temperature-controlled iron, 63/37 leaded solder, rosin paste flux, brass wool",
      "Understanding heat transfer: using the right temperature (350C-400C) and tip size for big battery pads vs tiny receiver pins",
      "Step-by-step soldering technique: tin the pad, tin the wire, join with heat and flux",
      "Common soldering mistakes: cold joints, solder bridges, and scorched PCB pads"
    ],
    seo: {
      slug: 'soldering-guide-for-fpv',
      metaDescription: 'Master the art of soldering FPV drones. Get clean solder joints, prevent short circuits, and choose the right soldering iron and flux.',
      keywords: ['soldering guide for FPV', 'best soldering iron for drones', '63/37 leaded solder FPV', 'how to solder ESC pads']
    }
  },
  {
    id: 'brief-best-fpv-simulators',
    briefSlug: 'best-fpv-simulators',
    title: 'The Best FPV Simulators in 2026: Save Cash and Log Hours Virtually',
    category: 'News and Reviews',
    status: 'queued',
    topic: 'An in-depth review comparing the leading FPV flight simulators (Liftoff, Velocidrone, Uncrashed, DRL, Tryp FPV) on physics accuracy, hardware specs, graphics, and training utility.',
    language: 'en',
    template: 'tech-article',
    promptVersion: 'v2',
    sourceHints: [
      "Why FPV simulators are mandatory before flying a real carbon-fiber quadcopter",
      "Velocidrone: the ultimate simulator for realistic physics and racing practice",
      "Liftoff and Uncrashed: highly polished graphics, customized parts, and good freestyle environments",
      "Tryp FPV and DRL Simulator: massive cinematic maps and physics overview",
      "Recommended training roadmap: first 5 hours drills to master in the simulator"
    ],
    seo: {
      slug: 'best-fpv-simulators',
      metaDescription: 'Discover the best FPV drone simulators in 2026. Compare physics, graphics, and system requirements to find your perfect virtual training ground.',
      keywords: ['best FPV simulator 2026', 'Liftoff vs Velocidrone', 'FPV drone simulator pc', 'Uncrashed simulator physics']
    }
  },
  {
    id: 'brief-gps-rescue-mode-betaflight',
    briefSlug: 'gps-rescue-mode-betaflight',
    title: 'GPS Rescue Mode Setup in Betaflight: Never Lose a Drone to a Failsafe',
    category: 'Flight Guides',
    status: 'queued',
    topic: 'A step-by-step configuration tutorial detailing how to wire a GPS module, enable UBLOX/NMEA protocols in Betaflight, configure GPS ports, set up GPS Rescue failsafe, and test the return-to-home behavior.',
    language: 'en',
    template: 'build-guide',
    promptVersion: 'v2',
    sourceHints: [
      "What GPS Rescue mode does and why it is not a fully autonomous landing system",
      "Wiring a GPS module (RX to TX, TX to RX) and configuring ports in Betaflight Configurator",
      "Setting up GPS configurations: minimum satellites, lock requirements, altitude parameters",
      "Configuring the Failsafe stage 2 to trigger GPS Rescue instead of Drop",
      "Crucial pre-flight checks: testing the GPS lock and verifying coordinates on your OSD before takeoff"
    ],
    seo: {
      slug: 'gps-rescue-mode-betaflight',
      metaDescription: 'Configure GPS Rescue mode in Betaflight. Learn how to set up return-to-home functionality to save your drone during signal loss.',
      keywords: ['GPS rescue mode Betaflight', 'Betaflight GPS setup', 'return to home drone setup', 'failsafe settings FPV']
    }
  },
  {
    id: 'brief-lihv-vs-lipo-batteries',
    briefSlug: 'lihv-vs-lipo-batteries',
    title: 'LiHV vs LiPo Batteries: What Beginners Need to Know',
    category: 'Components',
    status: 'queued',
    topic: 'A comparison guide explaining High Voltage LiPo (LiHV) cells, differences in max voltage (4.35V vs 4.2V), capacity gains, sag comparisons, and safety/degradation guidelines.',
    language: 'en',
    template: 'tech-article',
    promptVersion: 'v2',
    sourceHints: [
      "What LiHV is and how it differs from traditional standard LiPo cells",
      "The voltage advantage: 4.35V per cell max charge compared to 4.20V per cell",
      "Performance benefits: higher initial thrust, lighter weight profiles, and reduced voltage sag",
      "The downsides: faster chemical degradation, shorter lifetime cycles, and strict charger compatibility requirements",
      "Practical verdict: who should use LiHV (e.g. tiny whoops, racers) and who should stick to standard LiPos"
    ],
    seo: {
      slug: 'lihv-vs-lipo-batteries',
      metaDescription: 'Understand the performance and safety differences between LiHV and standard LiPo batteries for FPV drone flying.',
      keywords: ['LiHV vs LiPo battery', 'high voltage LiPo FPV', 'whoop batteries 4.35v', 'LiHV battery life cycles']
    }
  },
  {
    id: 'brief-how-to-clean-maintain-fpv',
    briefSlug: 'how-to-clean-maintain-fpv',
    title: 'How to Clean and Maintain Your FPV Drone: Bearings, Motors, and Electronics',
    category: 'Build Guides',
    status: 'queued',
    topic: 'A checklist-based tutorial covering bearing lubrication, cleaning mud/grass out of motors, waterproofing electronics with conformal coating, checking carbon fiber stress fractures, and re-torquing screws.',
    language: 'en',
    template: 'build-guide',
    promptVersion: 'v2',
    sourceHints: [
      "Why preventive maintenance saves FPV drones from sudden crashes and smoke",
      "Waterproofing essentials: applying silicone conformal coating to FC/ESC boards safely",
      "How to clean dirty brushless motors after grass or mud contact using isopropyl alcohol (IPA) and soft brushes",
      "Motor bearing maintenance: when to oil bearings and when to replace them",
      "Carbon fiber and structural checkups: identifying delamination, tightening loose bolts, and swapping bent props"
    ],
    seo: {
      slug: 'how-to-clean-maintain-fpv',
      metaDescription: 'Extend the lifespan of your FPV drone with a complete cleaning and maintenance checklist. Waterproof and grease your quad safely.',
      keywords: ['how to clean FPV drone', 'conformal coating drone electronics', 'brushless motor maintenance', 'drone structural checks']
    }
  },
  {
    id: 'brief-props-in-vs-props-out',
    briefSlug: 'props-in-vs-props-out',
    title: 'Props In vs Props Out: Betaflight Motor Direction Explained',
    category: 'Flight Guides',
    status: 'queued',
    topic: 'An educational guide explaining the differences in prop rotation direction in Betaflight, washouts, how props-out prevents getting stuck on twigs, and pitch control during crashes.',
    language: 'en',
    template: 'tech-article',
    promptVersion: 'v2',
    sourceHints: [
      "Standard (Props In) rotation versus reversed (Props Out / props out) motor direction",
      "Why motor direction matters for flight dynamics and dirt deflection (props-out throws dirt away from the camera)",
      "Cornering and washout handling: how Props Out improves control in tight maneuvers and decreases prop wash",
      "The practical advantage for micro/whoop drones: how props-out pushes off leaves and twigs instead of pulling them in",
      "How to configure reversed motor direction in Betaflight Configurator and BLHeli"
    ],
    seo: {
      slug: 'props-in-vs-props-out',
      metaDescription: 'Should you fly props in or props out? Compare motor rotation directions in Betaflight and discover which setup handles crashes and washouts best.',
      keywords: ['props in vs props out', 'reversed motor direction Betaflight', 'FPV washout fix', 'whoop motor configuration']
    }
  },
  {
    id: 'brief-antenna-polarization-lhcp-rhcp',
    briefSlug: 'antenna-polarization-lhcp-rhcp',
    title: 'Antenna Polarization Explained: LHCP, RHCP, and Linear Antennas',
    category: 'Components',
    status: 'queued',
    topic: 'A physics-to-hardware guide explaining circular polarization (LHCP/RHCP), linear antennas, matching transmitter and receiver antennas, multi-path interference rejection, and choosing antennas for range.',
    language: 'en',
    template: 'tech-article',
    promptVersion: 'v2',
    sourceHints: [
      "Circular polarization vs linear polarization and why circular is used in FPV video systems",
      "LHCP (Left-Hand Circular Polarized) and RHCP (Right-Hand Circular Polarized) explained",
      "The golden rule: matching VTX and VRX antenna polarization to avoid -30dB signal loss",
      "How circular polarization rejects multi-path interference (reflections off walls or ground)",
      "Antenna styles: stubby, patch, omni-directional pagoda, and helical antennas"
    ],
    seo: {
      slug: 'antenna-polarization-lhcp-rhcp',
      metaDescription: 'Understand LHCP, RHCP, and linear FPV antennas. Learn how matching polarization prevents signal loss and rejects interference.',
      keywords: ['antenna polarization LHCP RHCP', 'circular polarized FPV antenna', 'RHCP vs LHCP digital FPV', 'pagoda antenna vs patch']
    }
  },
  {
    id: 'brief-failsafe-settings-safe-flight',
    briefSlug: 'failsafe-settings-safe-flight',
    title: 'Failsafe Settings & Safe Flight Practices: What Happens When You Lose Signal',
    category: 'Flight Guides',
    status: 'queued',
    topic: 'A flight safety tutorial focusing on configuring Failsafe Stage 1 and Stage 2 in Betaflight, receiver channel loss values, testing failsafe on the bench (props off!), and pre-flight link tests.',
    language: 'en',
    template: 'tech-article',
    promptVersion: 'v2',
    sourceHints: [
      "What a Failsafe actually is: the worst-case backup system during radio link loss",
      "Betaflight Failsafe Stage 1 (guard period/hold) vs Stage 2 (Drop/GPS Rescue/Land)",
      "Why 'Drop' is the default and safest failsafe setting for general backyard/park flying",
      "How to safely test a failsafe on the workbench: always remove propellers first!",
      "Safe flight habits: pre-flight RSSI/LQ checking and local visual observer guidelines"
    ],
    seo: {
      slug: 'failsafe-settings-safe-flight',
      metaDescription: 'Configure failsafe settings in Betaflight. Learn why stage 2 failsafe drops are critical for safety and how to test them props-off.',
      keywords: ['failsafe settings FPV', 'Betaflight failsafe setup', 'how to test drone failsafe', 'drop vs land failsafe']
    }
  },
  {
    id: 'brief-cinematic-vs-freestyle-drones',
    briefSlug: 'cinematic-vs-freestyle-drones',
    title: 'Cinematic FPV vs Freestyle Drones: Frame and Component Differences',
    category: 'Components',
    status: 'queued',
    topic: 'A component comparison guide explaining the structural differences between cinematic cinebops/cinewhoops and durable freestyle frames, motor choices, camera mounting, and flight controller tuning filters.',
    language: 'en',
    template: 'tech-article',
    promptVersion: 'v2',
    sourceHints: [
      "The distinct goals of cinematic FPV (smooth footage, ducted safety) vs freestyle FPV (acrobatic agility, impact resistance)",
      "Structural comparison: heavy ducted frames (cinewhoops) vs open carbon X-frames (freestyle)",
      "Component choices: smooth high-KV motors for cinematic control vs snappy high-efficiency motors for freestyle snaps",
      "GoPro and naked camera mounting: vibration dampening, TPU mounts, and camera angles",
      "Betaflight tuning profiles: smooth expo rates vs fast angular rates"
    ],
    seo: {
      slug: 'cinematic-vs-freestyle-drones',
      metaDescription: 'Compare cinematic FPV quads and freestyle drones. Learn the hardware, weight, and layout differences between Cinewhoops and 5-inch quads.',
      keywords: ['cinematic FPV vs freestyle', 'cinewhoop vs 5 inch freestyle', 'best cinematic FPV drone', 'TPU camera mount angles']
    }
  },
  {
    id: 'brief-choose-first-tiny-whoop',
    briefSlug: 'choose-first-tiny-whoop',
    title: 'How to Choose Your First Tiny Whoop: Indoor Fun & Safe Training',
    category: 'News and Reviews',
    status: 'queued',
    topic: 'A comparative review of the tiny whoop category (65mm, 75mm, 85mm), brushed vs brushless motors, choosing analog vs HD digital whoops, and battery stacks for indoor/outdoor garden flights.',
    language: 'en',
    template: 'tech-article',
    promptVersion: 'v2',
    sourceHints: [
      "What a Tiny Whoop is and why it is the safest entry point for kids and indoor flying",
      "Size categories explained: 65mm (pure indoor), 75mm (indoor/garden hybrid), 85mm (outdoor micro powerhouses)",
      "Video ecosystems on tiny whoops: lightweight analog whoops vs digital (Walksnail/HDZero) whoops",
      "Battery specs: 1S LiPo/LiHV stacks, BT2.0 vs PH2.0 battery connectors (PH2.0 sags, BT2.0 rules)",
      "Top RTF tiny whoops compared: Meteor65, Mobula6, Mobula7, and Cetus Pro"
    ],
    seo: {
      slug: 'choose-first-tiny-whoop',
      metaDescription: 'Learn how to choose your first Tiny Whoop for indoor training. Compare Mobula, Meteor, and Cetus whoops by size, cost, and battery.',
      keywords: ['choose first tiny whoop', 'Meteor65 vs Mobula6', '1S whoop battery connector', 'analog tiny whoop for beginners']
    }
  },
  {
    id: 'brief-long-range-fpv-basics',
    briefSlug: 'long-range-fpv-basics',
    title: 'Long Range FPV Basics: How to Fly Beyond the Trees Safely',
    category: 'Flight Guides',
    status: 'queued',
    topic: 'A beginner long-range guide exploring protocol choices (ELRS 915MHz vs 2.4GHz), battery options (Li-Ion vs LiPo), GPS safety, high-gain directional antennas, and pilot etiquette.',
    language: 'en',
    template: 'tech-article',
    promptVersion: 'v2',
    sourceHints: [
      "The distinct challenge of long-range FPV flying: maintaining radio link and video feed at distance",
      "Protocol optimization: why ELRS 915MHz/868MHz or high-power 2.4GHz is crucial for long-range penetration",
      "Battery choice: Li-Ion packs (high capacity/low amp drain, long flight time) vs LiPo packs (high punch, short flights)",
      "Directional antennas: patch and helical antennas on goggles to track the drone over kilometers",
      "Flight safety rules: line of sight altitude checks, battery voltage recovery, and recovery tracking using DVR"
    ],
    seo: {
      slug: 'long-range-fpv-basics',
      metaDescription: 'Start flying long-range FPV safely. Compare ELRS 915MHz, Li-Ion batteries, directional patch antennas, and GPS rescue settings.',
      keywords: ['long range FPV basics', 'Li-Ion battery pack FPV', '915MHz vs 2.4GHz ELRS long range', 'FPV patch antenna setup']
    }
  }
];

function main() {
  console.log('--- ENQUEUING 16 NEW PREMIUM FPV CONTENT BRIEFS ---');
  let enqueuedCount = 0;
  
  for (const brief of newBriefs) {
    try {
      const now = new Date().toISOString();
      const enrichedJob: ContentJob = {
        ...brief,
        createdAt: now,
        updatedAt: now
      };
      
      enqueueContentJob(enrichedJob);
      enqueuedCount++;
      console.log(`✓ Enqueued: "${brief.title}"`);
    } catch (err: any) {
      console.error(`✗ Error enqueuing "${brief.title}":`, err.message);
    }
  }
  
  console.log(`\n==================================================`);
  console.log(`COMPLETED: Enqueued ${enqueuedCount} new technical briefs into data/content-jobs.json!`);
  console.log(`==================================================\n`);
}

main();
