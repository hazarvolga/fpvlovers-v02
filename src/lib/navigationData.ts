import {
  Rocket, BookOpen, Wrench, Cpu, Radio, Video, Battery,
  Crosshair, ShieldAlert, MonitorPlay, Activity, Zap, Layers, Map, Target, Flag, Trophy, CalendarDays, Users
} from 'lucide-react';

export const navigationData = [
  {
    title: "Pilot Academy",
    label: "Get Started",
    icon: Rocket,
    href: "/academy",
    items: [
      {
        title: "Roadmap & Guide",
        href: "/academy/roadmap",
        description: "Step-by-step guide from zero to hero.",
        icon: MonitorPlay
      },
      {
        title: "Starter Kits",
        href: "/academy/starter-kits",
        description: "Whoops, RTF bundles, and your first gear.",
        icon: Zap
      },
      {
        title: "FPV Glossary",
        href: "/academy/glossary",
        description: "Decode the technical jargon and acronyms.",
        icon: BookOpen
      }
    ]
  },
  {
    title: "Engineering Lab",
    label: "Research & Systems",
    icon: Wrench,
    href: "/engineering",
    items: [
      {
        title: "Flight Control Research",
        href: "/engineering/flight-control",
        description: "Blackbox, PID Tuning, and Betaflight Filter architectures.",
        icon: Cpu
      },
      {
        title: "Propulsion & Power",
        href: "/engineering/propulsion",
        description: "Motor efficiency, ESC protocols, LiPo science, and propellers.",
        icon: Target
      },
      {
        title: "RF & Video Link",
        href: "/engineering/communication",
        description: "ELRS packet rates, video latency engineering, and propagation.",
        icon: Radio
      },
      {
        title: "Aircraft Systems",
        href: "/engineering/systems",
        description: "Frame resonance, GPS rescue reliability, and system integration.",
        icon: Activity
      }
    ]
  },
  {
    title: "Racing",
    label: "Competition Grid",
    icon: Trophy,
    href: "/racing",
    items: [
      {
        title: "Race Calendar",
        href: "/racing/calendar",
        description: "Upcoming, current, and completed global FPV competitions.",
        icon: CalendarDays
      },
      {
        title: "Global Events",
        href: "/racing/events",
        description: "MultiGP, FAI, DRL, DCL, national championships, and opens.",
        icon: Flag
      },
      {
        title: "Pilot Database",
        href: "/racing/pilots",
        description: "Callsigns, countries, teams, achievements, and race history.",
        icon: Users
      },
      {
        title: "World Rankings",
        href: "/racing/rankings",
        description: "Transparent pilot and team rating methodology.",
        icon: Trophy
      },
      {
        title: "Race Technology",
        href: "/racing/technology",
        description: "Latency, video links, propulsion, frames, and race optimization.",
        icon: Zap
      }
    ]
  },
  {
    title: "Drone Archive",
    label: "Types & Classes",
    icon: Layers,
    href: "/archive",
    items: [
      {
        title: "Whoops",
        href: "/archive/whoops",
        description: "Tiny acrobats for indoor and proximity flying.",
        icon: Target
      },
      {
        title: "Freestyle",
        href: "/archive/freestyle",
        description: "High-G physics and raw freestyle maneuvers.",
        icon: Video
      },
      {
        title: "Cinematic",
        href: "/archive/cinematic",
        description: "Smooth HD capture and cinewhoop platforms.",
        icon: Video
      },
      {
        title: "Racing",
        href: "/archive/racing",
        description: "Pure speed, tight tracks, maximum voltage.",
        icon: Crosshair
      },
      {
        title: "Long-Range",
        href: "/archive/long-range",
        description: "Mountain surfing and endurance flights.",
        icon: Crosshair
      }
    ]
  },
  {
    title: "Pilot Tools",
    label: "The Powerhouses",
    icon: Cpu,
    href: "/tools",
    items: [
      {
        title: "Component Duel",
        href: "/tools/component-duel",
        description: "Side-by-Side FPV Hardware Comparisons.",
        icon: Zap
      },
      {
        title: "Build Calculator",
        href: "/tools/calculator",
        description: "Weight, Thrust, and Efficiency estimations.",
        icon: Activity
      },
      {
        title: "Part Matcher",
        href: "/tools/part-matcher",
        description: "Catalog-backed FPV component compatibility checks.",
        icon: Target
      },
      {
        title: "Pilot Pulse",
        href: "/pilot-pulse",
        description: "Live news radar for leaks, launches, and stock.",
        icon: Radio
      },
      {
        title: "Blackbox Tuning",
        href: "/tools/blackbox-tuning",
        description: "Analyze flight logs to optimize PID and filters.",
        icon: Radio
      }
    ]
  },
  {
    title: "Regulations",
    label: "Safety First",
    icon: ShieldAlert,
    href: "/regulations",
    items: [
      {
        title: "Airspace & Remote ID",
        href: "/regulations/airspace",
        description: "Global airspace maps and compliance standards.",
        icon: Map
      },
      {
        title: "Battery Safety",
        href: "/regulations/battery",
        description: "LiPo charging, storage, and fire prevention.",
        icon: Battery
      }
    ]
  }
];
