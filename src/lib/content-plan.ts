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
