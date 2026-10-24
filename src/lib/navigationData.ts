import {
  Rocket, BookOpen, Wrench, Cpu, Radio, Video, Battery,
  Crosshair, ShieldAlert, MonitorPlay, Activity, Zap, Layers, Map, Target, Trophy,
  ShoppingBag, Star, Scale, Plane, Compass, LifeBuoy, Calendar, Newspaper,
} from 'lucide-react';

/**
 * Primary site navigation — beginner-first information architecture.
 *
 * Five top-level groups follow the visitor's journey rather than the internal
 * system structure: Start Here -> Gear -> Guides -> Tools -> Racing & News.
 * `label` is a plain-language helper line shown in dropdown headers, never an
 * alternate name for the group.
 */
export const navigationData = [
  {
    title: "Start Here",
    label: "New to FPV? Begin here",
    icon: Rocket,
    href: "/academy",
    items: [
      {
        title: "First Flight Roadmap",
        href: "/academy/roadmap",
        description: "The step-by-step path from zero to your first real flight.",
        icon: MonitorPlay
      },
      {
        title: "Simulator Training",
        href: "/academy/simulators",
        description: "Learn stick control safely before you buy a drone.",
        icon: Crosshair
      },
      {
        title: "Rules & Safety",
        href: "/regulations",
        description: "Where you can fly, registration, and battery safety.",
        icon: ShieldAlert
      },
      {
        title: "FPV Glossary",
        href: "/academy/glossary",
        description: "Plain-English answers for every acronym you'll meet.",
        icon: BookOpen
      }
    ]
  },
  {
    title: "Gear",
    label: "What should I buy?",
    icon: ShoppingBag,
    href: "/buyers-guides",
    items: [
      {
        title: "Starter Kits",
        href: "/academy/starter-kits",
        description: "Your first drone, radio, and goggles — ready-to-fly options.",
        icon: Zap
      },
      {
        title: "Buyer Guides",
        href: "/buyers-guides",
        description: "Choose gear by budget and flying style, without the hype.",
        icon: Compass
      },
      {
        title: "Reviews",
        href: "/reviews",
        description: "Hands-on hardware reviews with clear evidence limits.",
        icon: Star
      },
      {
        title: "Comparisons",
        href: "/comparisons",
        description: "Side-by-side trade-offs between popular options.",
        icon: Scale
      },
      {
        title: "Drone Types",
        href: "/archive",
        description: "Whoops, freestyle, cinematic, racing, and long-range explained.",
        icon: Plane
      }
    ]
  },
  {
    title: "Guides",
    label: "Learn, fix, and improve",
    icon: Wrench,
    href: "/search",
    items: [
      {
        title: "Beginner Guides",
        href: "/topics/beginner-fpv",
        description: "Setup and first-flight guides written for new pilots.",
        icon: Rocket
      },
      {
        title: "Troubleshooting",
        href: "/topics/troubleshooting",
        description: "Fix common problems: no video, no arm, failsafes, jello.",
        icon: LifeBuoy
      },
      {
        title: "Betaflight & Tuning",
        href: "/engineering/flight-control",
        description: "Advanced: PID tuning, filters, and Blackbox analysis.",
        icon: Activity
      },
      {
        title: "Power & Propulsion",
        href: "/engineering/propulsion",
        description: "Advanced: motors, ESCs, LiPo behavior, and propellers.",
        icon: Battery
      },
      {
        title: "Radio & Video Link",
        href: "/engineering/communication",
        description: "Advanced: ELRS, video latency, antennas, and range.",
        icon: Radio
      },
      {
        title: "Aircraft Systems",
        href: "/engineering/systems",
        description: "Advanced: frames, GPS rescue, and system integration.",
        icon: Layers
      }
    ]
  },
  {
    title: "Tools",
    label: "Calculators and analyzers",
    icon: Cpu,
    href: "/tools",
    items: [
      {
        title: "Build Calculator",
        href: "/tools/calculator",
        description: "Estimate weight, thrust, and flight time for a build.",
        icon: Target
      },
      {
        title: "Part Matcher",
        href: "/tools/part-matcher",
        description: "Check whether your components are compatible.",
        icon: Map
      },
      {
        title: "Component Duel",
        href: "/tools/component-duel",
        description: "Compare two FPV parts side by side.",
        icon: Scale
      },
      {
        title: "Blackbox Tuning",
        href: "/tools/blackbox-tuning",
        description: "Advanced: analyze flight logs to tune PIDs and filters.",
        icon: Activity
      },
      {
        title: "Flight Critic",
        href: "/tools/flight-critic",
        description: "Advanced: AI feedback on your cinematic flight footage.",
        icon: Video
      }
    ]
  },
  {
    title: "Racing & News",
    label: "Events, results, and updates",
    icon: Trophy,
    href: "/racing",
    items: [
      {
        title: "Race Calendar",
        href: "/racing/calendar",
        description: "Verified upcoming FPV race events.",
        icon: Calendar
      },
      {
        title: "Racing News",
        href: "/racing/news",
        description: "Latest updates from the FPV racing world.",
        icon: Newspaper
      },
      {
        title: "Results & Rankings",
        href: "/racing/rankings",
        description: "World rankings and recent race results.",
        icon: Trophy
      }
    ]
  }
];
