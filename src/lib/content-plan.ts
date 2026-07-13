import type { ContentBrief, ContentCategory } from './content-types';

export const firstWaveContentPlan = [
  {
    slug: 'fpv-beginner-setup-guide',
    title: 'FPV Beginner Setup Guide: The Easiest Way to Get Flying',
    category: 'Flight Guides',
    tier: 'pillar',
    audience: 'beginner',
    searchIntent: 'informational',
    primaryKeyword: 'FPV beginner setup guide',
    secondaryKeywords: [
      'how to start FPV',
      'FPV setup for beginners',
      'first FPV drone checklist',
    ],
    seoTitle: 'FPV Beginner Setup Guide for New Pilots',
    metaDescription:
      'Learn the simplest FPV starter setup, from the radio and goggles to the drone, batteries, and first flight checklist.',
    summary:
      'A beginner-first walkthrough of the FPV starter stack, the order to buy gear, and the safest way to get ready for a first flight.',
    whyThisMatters:
      'This is the highest-intent starting point for new pilots and creates a strong internal path into build, component, and troubleshooting content.',
    outline: [
      'What FPV is and how the gear works together',
      'The best first purchase order for new pilots',
      'Analog versus digital at a beginner level',
      'A simple first-flight prep checklist',
      'What to learn before buying a second drone',
    ],
    estimatedWordCount: 2200,
  },
  {
    slug: 'fpv-troubleshooting-guide',
    title: 'FPV Troubleshooting Guide: Fix the Most Common Problems Fast',
    category: 'Troubleshooting',
    tier: 'pillar',
    audience: 'beginner',
    searchIntent: 'diagnostic',
    primaryKeyword: 'FPV troubleshooting guide',
    secondaryKeywords: [
      'FPV drone problems',
      'no video FPV fix',
      'FPV drone will not arm',
    ],
    seoTitle: 'FPV Troubleshooting Guide for Common Drone Problems',
    metaDescription:
      'Diagnose no-video, no-arm, binding, and startup issues with a simple FPV troubleshooting flow built for beginners.',
    summary:
      'A practical troubleshooting hub for the most common FPV issues, organized by symptom so new pilots can find a fix quickly.',
    whyThisMatters:
      'Troubleshooting content captures strong search intent and keeps beginner pilots from abandoning the hobby after a first problem.',
    outline: [
      'Start with power, wiring, and basic safety checks',
      'How to isolate radio, video, and flight-controller issues',
      'No video, no arm, and failsafe troubleshooting',
      'When the problem is a setup mistake versus a broken part',
      'A repeatable checklist for bench testing and repair',
    ],
    estimatedWordCount: 2400,
  },
  {
    slug: 'fpv-components-wiring-guide',
    title: 'FPV Components and Wiring Guide: What Each Part Does',
    category: 'Build Guides',
    tier: 'pillar',
    audience: 'beginner-to-intermediate',
    searchIntent: 'informational',
    primaryKeyword: 'FPV components and wiring guide',
    secondaryKeywords: [
      'FPV drone parts explained',
      'how FPV drone wiring works',
      'motor ESC flight controller basics',
    ],
    seoTitle: 'FPV Components and Wiring Guide for Beginners',
    metaDescription:
      'Understand the main FPV drone parts, how they connect, and the wiring logic behind a clean beginner build.',
    summary:
      'A beginner-friendly map of every core FPV component, what it does, and how the signal and power paths fit together.',
    whyThisMatters:
      'This pillar supports future build articles and helps readers understand upgrades, repairs, and compatibility decisions.',
    outline: [
      'The job of each core FPV component',
      'Power flow, signal flow, and basic wiring logic',
      'Motor, ESC, FC, camera, VTX, antenna, and receiver roles',
      'Common compatibility mistakes to avoid',
      'How to read a simple wiring diagram',
    ],
    estimatedWordCount: 2300,
  },
  {
    slug: 'how-to-choose-your-first-fpv-radio',
    title: 'How to Choose Your First FPV Radio Without Buying Twice',
    category: 'Components',
    tier: 'support',
    audience: 'beginner',
    searchIntent: 'commercial',
    primaryKeyword: 'best FPV radio for beginners',
    secondaryKeywords: [
      'first FPV transmitter',
      'radio protocol for FPV beginners',
      'ELRS or Crossfire beginner',
    ],
    seoTitle: 'How to Choose Your First FPV Radio',
    metaDescription:
      'Compare beginner FPV radios, protocol support, ergonomics, and upgrade path so you can buy once and fly longer.',
    summary:
      'A practical buying guide that helps new pilots choose a radio based on protocol support, ergonomics, and future upgrade path.',
    whyThisMatters:
      'Radio choice shapes the whole pilot experience and is often the first meaningful hardware purchase after goggles.',
    outline: [
      'What a radio link does in FPV',
      'ELRS, Crossfire, and legacy options at a beginner level',
      'Size, gimbals, switches, and ergonomics',
      'What to look for if you plan to keep upgrading',
      'Recommended decision path by budget',
    ],
    estimatedWordCount: 1700,
  },
  {
    slug: 'fpv-goggles-buying-guide',
    title: 'FPV Goggles Buying Guide: Analog vs Digital for Beginners',
    category: 'News and Reviews',
    tier: 'support',
    audience: 'beginner',
    searchIntent: 'comparative',
    primaryKeyword: 'FPV goggles buying guide',
    secondaryKeywords: [
      'analog vs digital FPV goggles',
      'best FPV goggles for beginners',
      'FPV headset comparison',
    ],
    seoTitle: 'FPV Goggles Buying Guide for Beginners',
    metaDescription:
      'Compare FPV goggles by ecosystem, image quality, comfort, latency, and budget so beginner pilots can choose with confidence.',
    summary:
      'A comparison-led guide to the first goggle purchase, with a clear look at analog and digital tradeoffs for new pilots.',
    whyThisMatters:
      'Goggles are one of the biggest purchase decisions in FPV, and searchers want a clean comparison before they commit.',
    outline: [
      'How FPV goggles fit into the pilot setup',
      'Analog versus digital image quality and cost',
      'Comfort, fit, and receiver options',
      'Budget tiers and upgrade paths',
      'Which choice makes sense for first-time buyers',
    ],
    estimatedWordCount: 1800,
  },
  {
    slug: 'vtx-and-camera-setup-guide',
    title: 'VTX and Camera Setup Guide: Clean Video From the Start',
    category: 'Build Guides',
    tier: 'support',
    audience: 'beginner-to-intermediate',
    searchIntent: 'informational',
    primaryKeyword: 'VTX and camera setup guide',
    secondaryKeywords: [
      'FPV camera wiring',
      'VTX channel setup',
      'FPV video transmitter basics',
    ],
    seoTitle: 'VTX and Camera Setup Guide for FPV Drones',
    metaDescription:
      'Set up your FPV camera and VTX correctly with a simple wiring and configuration guide that prevents common video problems.',
    summary:
      'A focused guide to setting up the video system so beginners can get a clean image and avoid the usual channel and wiring mistakes.',
    whyThisMatters:
      'Video setup mistakes create some of the most frustrating beginner failures, including bad signal, black screens, and noisy footage.',
    outline: [
      'What the camera and VTX do',
      'Wiring basics and common pin mistakes',
      'Channel, band, and power setup',
      'How to test video before the first flight',
      'Avoiding overheating and interference issues',
    ],
    estimatedWordCount: 1600,
  },
  {
    slug: 'no-video-fpv-troubleshooting',
    title: 'No Video in FPV: A Beginner Troubleshooting Checklist',
    category: 'Troubleshooting',
    tier: 'support',
    audience: 'beginner',
    searchIntent: 'diagnostic',
    primaryKeyword: 'FPV no video fix',
    secondaryKeywords: [
      'FPV goggles show no signal',
      'black screen FPV drone',
      'video transmitter troubleshooting',
    ],
    seoTitle: 'No Video FPV Troubleshooting Checklist',
    metaDescription:
      'Use this step-by-step checklist to fix common FPV no-video problems in the camera, VTX, antenna, and goggle chain.',
    summary:
      'A symptom-based checklist for the most common FPV problem: the goggles power on, but no usable video appears.',
    whyThisMatters:
      'No-video issues are a common first-flight blocker and one of the most valuable beginner troubleshooting searches.',
    outline: [
      'Check power, antenna, and channel settings first',
      'Separate camera, VTX, and goggle failures',
      'What to inspect on the bench before re-arming',
      'Easy fixes for wiring and configuration problems',
      'When to replace a component',
    ],
    estimatedWordCount: 1500,
  },
  {
    slug: 'betaflight-pid-basics-for-beginners',
    title: 'Betaflight PID Basics for Beginners: Start With the Right Mental Model',
    category: 'Flight Guides',
    tier: 'support',
    audience: 'beginner-to-intermediate',
    searchIntent: 'informational',
    primaryKeyword: 'Betaflight PID basics',
    secondaryKeywords: [
      'Betaflight tuning for beginners',
      'what are PID values',
      'FPV flight controller tuning',
    ],
    seoTitle: 'Betaflight PID Basics for Beginners',
    metaDescription:
      'Learn the beginner-friendly meaning of PID tuning in Betaflight and how to approach small changes without breaking a good tune.',
    summary:
      'A simple explanation of PID tuning that helps new pilots understand what changes matter and what to leave alone.',
    whyThisMatters:
      'PID tuning is a frequent search path for pilots who want better handling, and beginner clarity here reduces fear and mistakes.',
    outline: [
      'What PID tuning actually changes',
      'Why a decent stock tune is enough at first',
      'How to think about drift, bounce, and oscillation',
      'Safe beginner adjustments and testing habits',
      'When tuning should stop and component checks should start',
    ],
    estimatedWordCount: 1700,
  },
  {
    slug: 'fpv-racing-beginner-guide',
    title: 'FPV Racing for Beginners: What to Practice First',
    category: 'Racing',
    tier: 'support',
    audience: 'beginner',
    searchIntent: 'informational',
    primaryKeyword: 'FPV racing for beginners',
    secondaryKeywords: [
      'how to start FPV racing',
      'FPV race practice drills',
      'beginner FPV race setup',
    ],
    seoTitle: 'FPV Racing for Beginners',
    metaDescription:
      'Start FPV racing with the right practice drills, race mindset, and basic setup choices that keep learning simple.',
    summary:
      'A beginner racing guide that focuses on practice structure, track awareness, and the simplest path into competition.',
    whyThisMatters:
      'Racing brings a distinct audience and helps broaden the site beyond setup content while still serving beginners.',
    outline: [
      'What makes racing different from freestyle or cinematic flying',
      'Core practice drills for new racers',
      'Radio, goggles, and drone setup priorities',
      'How to read a race line',
      'First event expectations and etiquette',
    ],
    estimatedWordCount: 1600,
  },
  {
    slug: 'fpv-regulations-for-beginners-united-states',
    title: 'FPV Regulations for Beginners in the United States',
    category: 'Regulations',
    tier: 'support',
    audience: 'beginner',
    searchIntent: 'informational',
    primaryKeyword: 'FPV regulations United States',
    secondaryKeywords: [
      'Remote ID for FPV',
      'where can I fly FPV',
      'beginner drone rules US',
    ],
    seoTitle: 'FPV Regulations for Beginners in the United States',
    metaDescription:
      'Understand the basic U.S. FPV rules, Remote ID, and safe flying habits before your first pack.',
    summary:
      'A beginner-friendly overview of the U.S. FPV rules, with practical focus on safe flying habits and common compliance questions.',
    whyThisMatters:
      'Regulation content builds trust, protects new pilots, and supports future region-specific compliance articles.',
    outline: [
      'The basic legal frame for FPV flying in the U.S.',
      'Remote ID, location awareness, and common questions',
      'How to think about safe flying spots',
      'Recreational versus other use cases at a high level',
      'Where to verify current rules before flying',
    ],
    estimatedWordCount: 1500,
  },
  {
    slug: 'best-fpv-drones-for-beginners-buying-framework',
    title: 'Best FPV Drones for Beginners: A Practical Buying Framework',
    category: 'News and Reviews',
    tier: 'support',
    audience: 'beginner',
    searchIntent: 'commercial',
    primaryKeyword: 'best FPV drones for beginners',
    secondaryKeywords: ['beginner FPV drone', 'first FPV drone', 'RTF FPV kit'],
    seoTitle: 'Best FPV Drones for Beginners Buying Framework',
    metaDescription:
      'Choose a first FPV drone by skill level, indoor versus outdoor use, repairability, radio protocol, and upgrade path.',
    summary:
      'A buyer-intent guide that explains how beginners should compare whoops, toothpicks, cinewhoops, and starter kits without pretending to be hands-on testing.',
    whyThisMatters:
      'Beginner drone searches are high-intent affiliate pages and should route readers toward honest decision criteria before products.',
    outline: [
      'What makes a drone beginner-friendly',
      'TinyWhoop, toothpick, cinewhoop, and 5-inch tradeoffs',
      'RTF versus BNF versus DIY decision path',
      'Repairability, batteries, radio link, and spare parts',
      'Budget tiers and upgrade path',
    ],
    estimatedWordCount: 1900,
  },
  {
    slug: 'best-fpv-goggles-decision-guide-analog-dji-walksnail-hdzero',
    title: 'Best FPV Goggles Decision Guide: Analog, DJI, Walksnail, and HDZero',
    category: 'Components',
    tier: 'support',
    audience: 'beginner-to-intermediate',
    searchIntent: 'commercial',
    primaryKeyword: 'best FPV goggles',
    secondaryKeywords: ['DJI vs Walksnail goggles', 'analog FPV goggles', 'HDZero goggles'],
    seoTitle: 'Best FPV Goggles Decision Guide',
    metaDescription:
      'Compare FPV goggle ecosystems by latency, image quality, price, receiver support, and upgrade path.',
    summary:
      'A commercial comparison guide focused on ecosystem fit rather than fake rankings or unsupported hands-on claims.',
    whyThisMatters:
      'Goggles are a major purchase and a central affiliate category for FPVLovers.',
    outline: [
      'The ecosystem decision before the model decision',
      'Analog, DJI, Walksnail, and HDZero strengths',
      'Latency, penetration, recording, and comfort',
      'Budget and upgrade path',
      'Which pilot profile fits each ecosystem',
    ],
    estimatedWordCount: 1900,
  },
  {
    slug: 'best-fpv-radios-elrs-buying-guide',
    title: 'Best FPV Radios for ELRS Pilots: Buying Guide by Budget',
    category: 'Components',
    tier: 'support',
    audience: 'beginner-to-intermediate',
    searchIntent: 'commercial',
    primaryKeyword: 'best FPV radio ELRS',
    secondaryKeywords: ['best ELRS radio', 'Radiomaster radio guide', 'FPV transmitter buying guide'],
    seoTitle: 'Best FPV Radios for ELRS Pilots',
    metaDescription:
      'Choose an ELRS FPV radio by size, gimbals, battery format, module bay, screen, and long-term upgrade path.',
    summary:
      'A buyer guide for ELRS radios that helps pilots avoid buying twice while staying honest about product-fit criteria.',
    whyThisMatters:
      'Radio purchases are sticky, high-trust affiliate opportunities and support future ELRS educational content.',
    outline: [
      'Why ELRS changes the radio decision',
      'Gamepad versus full-size radio ergonomics',
      'Gimbals, switches, battery, and module bay',
      'Budget tiers for first-time and upgrading pilots',
      'Common mistakes before buying',
    ],
    estimatedWordCount: 1800,
  },
  {
    slug: 'fpv-starter-kits-by-budget-2026',
    title: 'FPV Starter Kits by Budget: What to Buy First in 2026',
    category: 'Build Guides',
    tier: 'support',
    audience: 'beginner',
    searchIntent: 'commercial',
    primaryKeyword: 'FPV starter kit budget',
    secondaryKeywords: ['FPV starter kit 2026', 'beginner FPV setup cost', 'FPV kit under budget'],
    seoTitle: 'FPV Starter Kits by Budget',
    metaDescription:
      'Plan a beginner FPV kit by budget, including radio, goggles, drone, charger, batteries, tools, and spares.',
    summary:
      'A practical kit-planning guide that turns beginner uncertainty into budget tiers and purchase order.',
    whyThisMatters:
      'Starter kit content connects tutorials, buyer guides, and affiliate CTAs without pretending to own every product.',
    outline: [
      'The purchase order that saves money',
      'Minimum viable simulator-first kit',
      'Indoor whoop kit budget',
      'Outdoor beginner kit budget',
      'Safety gear, spares, and hidden costs',
    ],
    estimatedWordCount: 2000,
  },
  {
    slug: 'best-lipo-chargers-for-fpv-safety-first-guide',
    title: 'Best LiPo Chargers for FPV: Safety-First Buying Guide',
    category: 'Components',
    tier: 'support',
    audience: 'beginner-to-intermediate',
    searchIntent: 'commercial',
    primaryKeyword: 'best LiPo charger for FPV',
    secondaryKeywords: ['FPV battery charger', 'LiPo balance charger', 'parallel charging FPV'],
    seoTitle: 'Best LiPo Chargers for FPV',
    metaDescription:
      'Understand FPV LiPo charger specs, balance charging, power supplies, wattage, and safety features before buying.',
    summary:
      'A safety-first commercial guide for charger selection that avoids risky oversimplification.',
    whyThisMatters:
      'Chargers are evergreen affiliate products and bad advice here can create real safety risk.',
    outline: [
      'What a LiPo charger must do',
      'Wattage, cell count, charge current, and power supply',
      'Balance charging and storage charging',
      'Parallel charging cautions',
      'Beginner-safe buying criteria',
    ],
    estimatedWordCount: 1800,
  },
  {
    slug: 'dji-o3-vs-walksnail-avatar-fpv-system-comparison',
    title: 'DJI O3 vs Walksnail Avatar: FPV System Comparison',
    category: 'Components',
    tier: 'support',
    audience: 'beginner-to-intermediate',
    searchIntent: 'comparative',
    primaryKeyword: 'DJI O3 vs Walksnail',
    secondaryKeywords: ['Walksnail vs DJI FPV', 'digital FPV system comparison', 'FPV video system'],
    seoTitle: 'DJI O3 vs Walksnail Avatar Comparison',
    metaDescription:
      'Compare DJI O3 and Walksnail Avatar by image quality, latency, air unit size, recording, cost, and build fit.',
    summary:
      'A comparison guide for digital FPV buyers based on decision criteria, not unsupported lab claims.',
    whyThisMatters:
      'This is a high-value comparison cluster that supports goggles, cinewhoop, and build content.',
    outline: [
      'The ecosystem choice',
      'Image quality and recording considerations',
      'Latency and racing suitability',
      'Air unit size, mounting, and heat',
      'Which system fits each pilot profile',
    ],
    estimatedWordCount: 1900,
  },
  {
    slug: 'elrs-radio-setup-guide-for-beginners',
    title: 'ELRS Radio Setup Guide for Beginners',
    category: 'Flight Guides',
    tier: 'support',
    audience: 'beginner',
    searchIntent: 'informational',
    primaryKeyword: 'ELRS radio setup',
    secondaryKeywords: ['ExpressLRS beginner guide', 'ELRS binding phrase', 'FPV radio setup'],
    seoTitle: 'ELRS Radio Setup Guide for Beginners',
    metaDescription:
      'Set up an ELRS radio with model profiles, binding phrase basics, packet rate concepts, and safe first checks.',
    summary:
      'A beginner-friendly ELRS setup guide that supports radio buyer guides and troubleshooting paths.',
    whyThisMatters:
      'ELRS is a core FPV protocol and creates strong internal linking across radio, receiver, and troubleshooting pages.',
    outline: [
      'What ELRS does in an FPV setup',
      'Binding phrase and model profile basics',
      'Packet rate and telemetry at a beginner level',
      'Common setup mistakes',
      'Pre-flight control link checks',
    ],
    estimatedWordCount: 1700,
  },
  {
    slug: 'cinewhoop-kit-buying-guide-for-indoor-and-real-estate-fpv',
    title: 'Cinewhoop Kit Buying Guide for Indoor and Real Estate FPV',
    category: 'Build Guides',
    tier: 'support',
    audience: 'beginner-to-intermediate',
    searchIntent: 'commercial',
    primaryKeyword: 'best cinewhoop kit',
    secondaryKeywords: ['cinewhoop for indoor video', 'real estate FPV drone', 'ducted FPV drone'],
    seoTitle: 'Cinewhoop Kit Buying Guide',
    metaDescription:
      'Choose a cinewhoop kit by prop size, duct design, camera system, payload, noise, safety, and indoor control needs.',
    summary:
      'A commercial cinewhoop guide for pilots comparing indoor, cinematic, and paid-shoot requirements.',
    whyThisMatters:
      'Cinewhoop content connects product discovery with cinematic FPV and creator monetization topics.',
    outline: [
      'What cinewhoops are good at',
      'Prop size, ducts, guards, and payload',
      'Analog versus digital camera systems',
      'Indoor safety and noise expectations',
      'Budget and upgrade considerations',
    ],
    estimatedWordCount: 1800,
  },
  {
    slug: 'long-range-fpv-setup-guide-safety-signal-and-power',
    title: 'Long-Range FPV Setup Guide: Safety, Signal, and Power',
    category: 'Build Guides',
    tier: 'support',
    audience: 'intermediate',
    searchIntent: 'informational',
    primaryKeyword: 'long range FPV setup',
    secondaryKeywords: ['long range FPV build', 'FPV GPS rescue', 'long range drone gear'],
    seoTitle: 'Long-Range FPV Setup Guide',
    metaDescription:
      'Plan a long-range FPV setup around signal reliability, GPS rescue, battery choice, antenna strategy, and legal awareness.',
    summary:
      'A serious long-range planning guide that prioritizes safety and system reliability over hype.',
    whyThisMatters:
      'Long-range FPV has strong search demand and requires careful, trust-building editorial handling.',
    outline: [
      'Why long-range setups need a different mindset',
      'Control link, video link, GPS, and failsafe planning',
      'Battery, prop, and efficiency tradeoffs',
      'Antenna placement and ground station basics',
      'Safety and regulation checkpoints',
    ],
    estimatedWordCount: 2100,
  },
  {
    slug: 'fpv-racing-gear-checklist-for-first-event',
    title: 'FPV Racing Gear Checklist for Your First Event',
    category: 'Racing',
    tier: 'support',
    audience: 'beginner',
    searchIntent: 'informational',
    primaryKeyword: 'FPV racing gear checklist',
    secondaryKeywords: ['first drone race checklist', 'FPV race day gear', 'drone racing tools'],
    seoTitle: 'FPV Racing Gear Checklist',
    metaDescription:
      'Prepare for a first FPV race with a practical checklist for batteries, props, tools, antennas, charging, and pit workflow.',
    summary:
      'A community-first race day checklist that helps new racers show up prepared without overbuying.',
    whyThisMatters:
      'Race checklist content creates internal links into tools, batteries, chargers, radios, and racing guides.',
    outline: [
      'Core drone and radio gear',
      'Batteries, charging, and pit power',
      'Props, tools, and repair supplies',
      'Video channel and antenna preparation',
      'Race-day etiquette and workflow',
    ],
    estimatedWordCount: 1600,
  },
  {
    slug: 'fpv-drone-toolkit-beginner-build-and-repair-checklist',
    title: 'FPV Drone Toolkit: Beginner Build and Repair Checklist',
    category: 'Build Guides',
    tier: 'support',
    audience: 'beginner',
    searchIntent: 'commercial',
    primaryKeyword: 'FPV drone toolkit',
    secondaryKeywords: ['FPV tools checklist', 'drone repair tools', 'FPV soldering tools'],
    seoTitle: 'FPV Drone Toolkit Checklist',
    metaDescription:
      'Build a practical FPV toolkit with drivers, soldering gear, smoke stopper, battery safety gear, and field repair basics.',
    summary:
      'A buying-intent tools checklist focused on safe building, bench testing, and field repairs.',
    whyThisMatters:
      'Tools are evergreen affiliate products and reduce beginner repair frustration.',
    outline: [
      'The minimum toolkit for a first FPV build',
      'Soldering and smoke stopper basics',
      'Field repair tools',
      'Battery safety accessories',
      'What beginners can skip at first',
    ],
    estimatedWordCount: 1700,
  },
  {
    slug: 'analog-vs-digital-fpv-for-beginners',
    title: 'Analog vs Digital FPV for Beginners: Which Video System Should You Choose?',
    category: 'Components',
    tier: 'support',
    audience: 'beginner',
    searchIntent: 'comparative',
    primaryKeyword: 'analog vs digital FPV',
    secondaryKeywords: ['digital FPV beginner', 'analog FPV beginner', 'FPV video system comparison'],
    seoTitle: 'Analog vs Digital FPV for Beginners',
    metaDescription:
      'Compare analog and digital FPV systems by cost, latency, image quality, durability, and upgrade path.',
    summary:
      'A beginner comparison that helps pilots pick a video path before buying goggles and drones.',
    whyThisMatters:
      'This is a gateway article for goggles, cinewhoops, racing, and digital ecosystem content.',
    outline: [
      'What analog and digital FPV mean',
      'Cost and upgrade path',
      'Latency and racing considerations',
      'Image quality and penetration',
      'Best fit by pilot profile',
    ],
    estimatedWordCount: 1700,
  },
  {
    slug: 'fpv-battery-buying-guide-cells-capacity-and-c-rating',
    title: 'FPV Battery Buying Guide: Cells, Capacity, and C-Rating Explained',
    category: 'Components',
    tier: 'support',
    audience: 'beginner',
    searchIntent: 'commercial',
    primaryKeyword: 'FPV battery buying guide',
    secondaryKeywords: ['FPV LiPo battery', '4S vs 6S FPV', 'LiPo C rating explained'],
    seoTitle: 'FPV Battery Buying Guide',
    metaDescription:
      'Choose FPV LiPo batteries by cell count, capacity, discharge rating, connector, weight, and flight style.',
    summary:
      'A safety-aware battery guide that supports charger, starter kit, and build compatibility pages.',
    whyThisMatters:
      'Battery selection is high-intent and safety-sensitive, making it important for trust and affiliate readiness.',
    outline: [
      'Cell count and voltage basics',
      'Capacity, weight, and flight time',
      'C-rating without marketing confusion',
      'Connector and charger compatibility',
      'Safe buying and storage habits',
    ],
    estimatedWordCount: 1800,
  },
  {
    slug: 'fpv-propeller-buying-guide-size-pitch-and-blade-count',
    title: 'FPV Propeller Buying Guide: Size, Pitch, and Blade Count',
    category: 'Components',
    tier: 'support',
    audience: 'beginner-to-intermediate',
    searchIntent: 'commercial',
    primaryKeyword: 'FPV propeller buying guide',
    secondaryKeywords: ['FPV props explained', 'prop pitch FPV', 'best props for 5 inch FPV'],
    seoTitle: 'FPV Propeller Buying Guide',
    metaDescription:
      'Understand FPV prop size, pitch, blade count, material, motor load, and flight style before buying spares.',
    summary:
      'A practical prop buying guide that connects performance, safety, and compatibility.',
    whyThisMatters:
      'Props are frequent purchases and a natural affiliate category with strong internal linking potential.',
    outline: [
      'How prop size and pitch affect feel',
      'Blade count and motor load',
      'Durability and material tradeoffs',
      'Matching props to drone size and motor KV',
      'How many spare props to keep',
    ],
    estimatedWordCount: 1600,
  },
  {
    slug: 'fpv-flight-controller-buying-guide-for-beginner-builds',
    title: 'FPV Flight Controller Buying Guide for Beginner Builds',
    category: 'Components',
    tier: 'support',
    audience: 'beginner-to-intermediate',
    searchIntent: 'commercial',
    primaryKeyword: 'FPV flight controller buying guide',
    secondaryKeywords: ['best flight controller FPV', 'FPV stack buying guide', 'Betaflight FC'],
    seoTitle: 'FPV Flight Controller Buying Guide',
    metaDescription:
      'Choose an FPV flight controller by firmware support, UARTs, gyro, mounting size, voltage support, and stack compatibility.',
    summary:
      'A component buying guide that explains selection criteria without inventing missing technical specs.',
    whyThisMatters:
      'Flight controllers are high-risk technical products and need source-backed, conservative guidance.',
    outline: [
      'What the flight controller does',
      'Firmware, UARTs, gyro, and mounting basics',
      'Stack compatibility and wiring needs',
      'Beginner mistakes when selecting an FC',
      'When to choose an AIO board',
    ],
    estimatedWordCount: 1800,
  },
  {
    slug: 'fpv-esc-buying-guide-current-rating-firmware-and-stack-fit',
    title: 'FPV ESC Buying Guide: Current Rating, Firmware, and Stack Fit',
    category: 'Components',
    tier: 'support',
    audience: 'beginner-to-intermediate',
    searchIntent: 'commercial',
    primaryKeyword: 'FPV ESC buying guide',
    secondaryKeywords: ['FPV 4 in 1 ESC', 'BLHeli ESC FPV', 'ESC current rating drone'],
    seoTitle: 'FPV ESC Buying Guide',
    metaDescription:
      'Choose an FPV ESC by current rating, voltage support, firmware, mounting, connector, and motor compatibility.',
    summary:
      'A conservative ESC selection guide focused on compatibility and safety margins.',
    whyThisMatters:
      'ESC mistakes can destroy hardware, so trustworthy buying guidance is essential.',
    outline: [
      'What an ESC does in an FPV build',
      'Current rating and safety margin',
      'Voltage, firmware, and telemetry basics',
      '4-in-1 versus individual ESCs',
      'Stack fit and wiring checks',
    ],
    estimatedWordCount: 1800,
  },
  {
    slug: 'fpv-antenna-guide-lhcp-rhcp-patch-and-omni',
    title: 'FPV Antenna Guide: LHCP, RHCP, Patch, and Omni Explained',
    category: 'Components',
    tier: 'support',
    audience: 'beginner',
    searchIntent: 'informational',
    primaryKeyword: 'FPV antenna guide',
    secondaryKeywords: ['LHCP vs RHCP', 'FPV patch antenna', 'FPV omni antenna'],
    seoTitle: 'FPV Antenna Guide',
    metaDescription:
      'Understand FPV antenna polarization, omni and patch patterns, placement, durability, and beginner buying mistakes.',
    summary:
      'An evergreen antenna guide that improves video-system decisions and troubleshooting.',
    whyThisMatters:
      'Antenna content supports goggles, VTX, long-range, and no-video troubleshooting clusters.',
    outline: [
      'What FPV antennas actually change',
      'LHCP and RHCP polarization',
      'Omni versus patch antenna patterns',
      'Drone placement and goggle setup',
      'Beginner buying mistakes',
    ],
    estimatedWordCount: 1600,
  },
] as const satisfies readonly ContentBrief[];

export const firstWaveContentBySlug = Object.fromEntries(
  firstWaveContentPlan.map((item) => [item.slug, item]),
) as Record<string, (typeof firstWaveContentPlan)[number]>;

export function getFirstWaveContentByCategory(category: ContentCategory) {
  return firstWaveContentPlan.filter((item) => item.category === category);
}

export function getPillarContent() {
  return firstWaveContentPlan.filter((item) => item.tier === 'pillar');
}

export function getSupportingContent() {
  return firstWaveContentPlan.filter((item) => item.tier === 'support');
}
