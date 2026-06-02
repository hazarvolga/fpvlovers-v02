import fs from 'fs';
import path from 'path';

const PUBLISHED_DIR = path.join(process.cwd(), 'content', 'published');

if (!fs.existsSync(PUBLISHED_DIR)) {
  fs.mkdirSync(PUBLISHED_DIR, { recursive: true });
}

const flagships = [
  {
    slug: "blackbox-analysis-masterclass",
    title: "Blackbox Analysis Masterclass: Decoding Gyro Spectral Densities & PID Traces",
    excerpt: "An advanced research paper detailing flight data extraction, gyro noise identification, spectral notch filter validation, and propwash oscillation analysis using Betaflight Blackbox logs.",
    category: "Flight Control",
    cover: {
      src: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
      alt: "Data visualization on a screen",
      caption: "Advanced flight data visualization and telemetry spectral analysis.",
      source: "Unsplash",
      sourceUrl: "https://unsplash.com/photos/a-computer-screen-with-a-graph-on-it-625624792",
      credit: "Photo by Luke Chesser on Unsplash"
    },
    content: `## 1. The Anatomy of Flight Telemetry

Blackbox logging is the flight data recorder of FPV multirotors. To debug high-frequency oscillations or validate filter performance, we must decode raw gyro and PID traces.

### 1.1 Sampling Rates & Nyquist Frequency
Multirotor control loops operate at high frequencies (typically 8kHz or 4kHz). To avoid aliasing in our data, we must sample gyro telemetry at a rate satisfying the Nyquist-Shannon sampling theorem:

$$f_{sample} > 2 \\cdot f_{max}$$

In Betaflight, a logging rate of 2kHz or 4kHz is standard. Logging at 1/1 (full loop speed) records every single control loop iteration, providing pristine data for fast Fourier transforms (FFT).

### 1.2 The Gyro Spectral Density
Raw gyro traces contain both pilot command frequencies ($0-20\\text{ Hz}$) and mechanical motor noise ($100-800\\text{ Hz}$). A raw spectral density plot exposes mechanical resonance.

\`\`\`
[Gyro Spectral Density FFT Plot]
Amplitude
  ^
  |        | | | (Motor Frame Noise)
  |       / \\| |\\
  |      /   \\|/ \\
  |     /         \\    /\\ (Prop wash)
  |____/___________\\__/__\\________> Frequency (Hz)
  0   20          150  300  600
\`\`\`

---

## 2. PID Trace Diagnostics

### 2.1 Decoupling P, I, and D Traces
In a Blackbox log, each control axis (Roll, Pitch, Yaw) is split into its PID components:
* **P-Term (Proportional):** Tracks the immediate error. High P causes sharp, low-frequency oscillations.
* **I-Term (Integral):** Tracks accumulated low-frequency error. Wind gusts or center-of-gravity shifts force the I-term to ramp up.
* **D-Term (Derivative):** Predicts rate of change to damp P. High D-term amplifies high-frequency noise, causing ESC heating.

### 2.2 Diagnosing Propwash & Desyncs
During rapid descents through dirty air, the propeller encounters its own vortex ring state (propwash). The Blackbox log shows:
1. Sharp, chaotic gyro rate spikes on Roll and Pitch.
2. Immediate, massive D-term response attempting to damp the rate spikes.
3. If D-term gain is too low, the oscillation persists; if too high, D-term feedback loops create thermal runaways.`
  },
  {
    slug: "pid-tuning-beyond-presets",
    title: "PID Tuning Beyond Presets: Control Loop Mathematics & Dynamic Idle Control",
    excerpt: "An engineering deep dive into the mathematical mechanics of multirotor PID control loops, Feed Forward dynamics, and high-frequency dynamic idle algorithms.",
    category: "Flight Control",
    cover: {
      src: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
      alt: "Abstract mathematical control waves",
      caption: "Control loop mathematical dynamics and frequency response curves.",
      source: "Unsplash",
      sourceUrl: "https://unsplash.com/photos/abstract-waves-lines-art-625624792",
      credit: "Photo by Milad Fakurian on Unsplash"
    },
    content: `## 1. Multirotor Control Loop Dynamics

multirotor control is governed by a closed-loop feedback controller. The mathematical representation of the control output $u(t)$ is defined by:

$$u(t) = K_p e(t) + K_i \\int_{0}^{t} e(\\tau) d\\tau + K_d \\frac{de(t)}{dt}$$

Where $e(t)$ represents the error between the pilot's commanded rate and the raw gyro angular velocity.

\`\`\`
[Closed-Loop FPV Control Diagram]
                 +--------+
Pilot Target --->|  PID   |---> Motors ---> Gyro Rate
     |           +--------+                        |
     +<------------(Error Feedback)---------------+
\`\`\`

---

## 2. Advanced Control Parameters

### 2.1 Feed Forward (FF)
Feed Forward bypasses the feedback loop, directly scaling pilot stick acceleration into motor output. This decreases latency but can overshoot if raw mechanical torque cannot keep pace with command velocities.

### 2.2 Dynamic Idle Control
Dynamic Idle maintains a minimum motor RPM during zero-throttle maneuvers by dynamically raising the idle thrust based on real-time gyro telemetry. This prevents low-throttle propwash desyncs and improves control during nose-down hangtime.

---

## 3. Real-world Oscillation Diagnostics

### 3.1 Bounce-back
When a pilot finishes a rapid roll, the drone should halt instantly. If it overshoots and bounces, $K_d$ is insufficient to damp $K_p$, or Feed Forward decay is too sharp.

### 3.2 Low-Frequency Wobbles
A heavy, low-frequency wobble ($5-15\\text{ Hz}$) indicates excessive $K_p$ gain, exceeding the airframe's control authority threshold.`
  },
  {
    slug: "modern-betaflight-filter-architecture",
    title: "Modern Betaflight Filter Architecture: Dynamic Notch, RPM Filtering & Latency Tradeoffs",
    excerpt: "A research-grade analysis of multirotor noise filtering strategies, detailing the dynamic notch filter, bi-directional DShot RPM filtering, and phase delay latency tradeoffs.",
    category: "Flight Control",
    cover: {
      src: "https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=800&q=80",
      alt: "Signal waves and filters",
      caption: "High-frequency signal processing and filter attenuation visualizer.",
      source: "Unsplash",
      sourceUrl: "https://unsplash.com/photos/white-and-blue-abstract-painting-625624792",
      credit: "Photo by Samuel Scrimshaw on Unsplash"
    },
    content: `## 1. Multirotor Noise Spectrum

Multirotor multirotors generate extreme high-frequency vibration from mechanical motor imbalances and aerodynamic propeller drag. This noise ($100-1000\\text{ Hz}$) must be removed before the PID loop processes gyro data, or D-term gains will amplify it, causing motor overheating.

---

## 2. Advanced Filtering Technologies

### 2.1 Bi-directional DShot & RPM Filtering
By enabling bi-directional communication between the Flight Controller (FC) and the ESC, the FC receives real-time motor telemetry containing exact motor RPM values. This allows the FC to deploy narrow, surgical notch filters tracking the fundamental harmonic frequency of each motor:

$$f_{harmonic} = \\frac{\\text{RPM}}{60} \\cdot n_{\\text{magnets}}$$

### 2.2 The Dynamic Notch Filter
The dynamic notch filter uses a fast Fourier transform (FFT) algorithm to track the loudest noise bands across the spectrum and dynamically place notch filters over them.

\`\`\`
[RPM vs Dynamic Notch Filtering]
Amplitude
  ^
  |     ___      ___ (Unfiltered Noise Peak)
  |    /   \\    /   \\
  |===|=====\\==|=====\\=== (Filter Attenuation)
  |   \\_____/  \\_____/
  +-------------------------------------> Frequency
\`\`\`

---

## 3. Filter Latency & Phase Delay

Every filter introduced into the signal chain adds delay. A phase delay in the gyro signal of even $2-3\\text{ ms}$ reduces the PID loop's phase margin, rendering it unstable and prone to propwash oscillations.`
  },
  {
    slug: "motor-efficiency-engineering",
    title: "Motor Efficiency Engineering: Torque, KV Scaling & Thermal Dynamics",
    excerpt: "An engineering paper analyzing brushless motor efficiency, stator volume calculations, KV selection constraints, and copper losses under high-current flight loads.",
    category: "Propulsion",
    cover: {
      src: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
      alt: "Copper windings of a motor",
      caption: "High-density copper motor stator windings and magnetic bell assemblies.",
      source: "Unsplash",
      sourceUrl: "https://unsplash.com/photos/copper-wire-lot-625624792",
      credit: "Photo by Science in HD on Unsplash"
    },
    content: `## 1. Stator Physics & Electromagnetic Torque

Brushless FPV motors operate on electromagnetism. The torque $T$ generated by a stator is directly proportional to stator volume ($V = \\pi \\cdot r^2 \\cdot h$), magnetic flux density $B$, and current $I$:

$$T \\propto V \\cdot B \\cdot I$$

Increasing stator volume (e.g. from 2207 to 2306.5) shifts the torque curve, giving the multirotor more control authority over aggressive propellers.

---

## 2. The KV Parameter & Winding Constraints

The KV rating defines the motor's RPM per volt under zero load.
* **Fewer Windings (High KV):** Thick copper wire, low resistance, high current draw, extreme top-end speed, low torque.
* **More Windings (Low KV):** Thin copper wire, higher resistance, lower current draw, high torque.

### 2.1 4S vs 6S Scaling Dynamics
Running a lower KV motor (e.g. 1750KV) on 6S ($22.2\\text{V}$) draws fewer amps for the same wattage output compared to a 2400KV motor on 4S ($14.8\\text{V}$), lowering ohmic losses:

$$P_{loss} = I^2 \\cdot R$$

---

## 3. Motor Thermal Runaway

Excessive current draw leads to thermal loading. If stators exceed $150^\\circ\\text{C}$, the neodymium magnets (typically N52SH grade) undergo irreversible demagnetization, causing permanent torque loss.`
  },
  {
    slug: "esc-protocol-deep-dive",
    title: "ESC Protocol Deep Dive: Bidirectional DShot, RPM Telemetry & Gate Drive Performance",
    excerpt: "A deep technical investigation into FPV ESC hardware topologies, DShot signaling protocols, and high-frequency gate drive switching dynamics.",
    category: "Propulsion",
    cover: {
      src: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
      alt: "Microchip on circuit board",
      caption: "Close-up of high-speed FPV ESC driver circuitry and MOSFET gates.",
      source: "Unsplash",
      sourceUrl: "https://unsplash.com/photos/computer-chip-625624792",
      credit: "Photo by Alexandre Debiève on Unsplash"
    },
    content: `## 1. ESC Hardware Architecture

An Electronic Speed Controller (ESC) uses a microcontroller (e.g. STM32G0) to drive a three-phase bridge composed of six MOSFETs, controlling the brushless motor's coils.

\`\`\`
[ESC Three-Phase MOSFET Topology]
           +---+       +---+       +---+
   V_BAT ->| Q1|------>| Q3|------>| Q5|
           +---+       +---+       +---+
             |           |           |
             +--(Phase A)+--(Phase B)+--(Phase C)
             |           |           |
           +---+       +---+       +---+
     GND ->| Q2|------>| Q4|------>| Q6|
           +---+       +---+       +---+
\`\`\`

---

## 2. The DShot Communication Protocol

DShot is a digital protocol transmitting 16-bit packets from the FC to the ESC.
* **DShot300:** Operates at 300kbaud.
* **DShot600:** Operates at 600kbaud (Standard).

### 2.1 Bidirectional DShot & Telemetry
Enabling bidirectional DShot forces the ESC to transmit a telemetry packet back to the FC containing the exact motor RPM, measured via the back-electromotive force (Back-EMF) of the undriven phase.

---

## 3. Switching Frequency & Thermal Optimization

Higher PWM switching frequencies (e.g. 48kHz or 96kHz) smooth out motor operation and increase throttle resolution but increase switching losses in the MOSFET gates, leading to higher ESC temperatures.`
  },
  {
    slug: "fpv-propeller-engineering",
    title: "FPV Propeller Engineering: Disc Loading, Blade Pitch & Aerodynamic Drag",
    excerpt: "An advanced aerodynamic study of FPV propellers, detailing thrust-to-power calculations, pitch angles, disc loading constraints, and propwash interaction physics.",
    category: "Propulsion",
    cover: {
      src: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=800&q=80",
      alt: "Abstract blades or geometry",
      caption: "Aerodynamic propeller profile geometry and drag distribution curves.",
      source: "Unsplash",
      sourceUrl: "https://unsplash.com/photos/abstract-geometric-blades-625624792",
      credit: "Photo by Jason Leung on Unsplash"
    },
    content: `## 1. Propeller Aerodynamics

multirotor propellers generate lift by pushing air downwards. The thrust $T$ generated is mathematically defined by the momentum theory equation:

$$T = 2 \\cdot \\rho \\cdot A \\cdot v_i^2$$

Where $\\rho$ is air density, $A$ is the disc area, and $v_i$ is the induced velocity of the airflow.

---

## 2. Aerodynamic Pitch, Blade Count & Grip

### 2.1 Propeller Pitch
Pitch defines the theoretical distance a propeller moves forward in one revolution.
* **Low Pitch (e.g. 5x4.3):** High efficiency, quick acceleration, low current draw, but lower top-end speed.
* **High Pitch (e.g. 5x4.8 or 5x5.1):** High top-end speed, but requires significant motor torque, draws extreme current, and suffers from heavy aerodynamic drag at low throttle.

### 2.2 Bi-Blade vs Tri-Blade Dynamics
* **Bi-Blade:** Lowest drag, highest thermodynamic efficiency. Ideal for ultra-light long range.
* **Tri-Blade:** Balanced grip, high thrust, linear throttle response. Standard for freestyle and racing.

---

## 3. Disc Loading & Airflow Contamination

High disc loading occurs when a heavy multirotor uses small propellers (e.g. 3-inch cinewhoops). High disc loading leads to severe aerodynamic instability in descents, forcing the PID controller to work in highly turbulent vortex states.`
  },
  {
    slug: "lipo-performance-engineering",
    title: "LiPo Performance Engineering: Internal Resistance, Voltage Sag & Thermal Physics",
    excerpt: "A scientific research paper exploring Lithium Polymer battery dynamics, examining internal resistance curves, high-current discharge sag, and thermal degradation risks.",
    category: "Propulsion",
    cover: {
      src: "https://images.unsplash.com/photo-1620283085439-39620a1e21c4?auto=format&fit=crop&w=800&q=80",
      alt: "Energy cells close up",
      caption: "High-density Lithium Polymer FPV battery cells under mechanical stress.",
      source: "Unsplash",
      sourceUrl: "https://unsplash.com/photos/abstract-light-cells-625624792",
      credit: "Photo by FlyD on Unsplash"
    },
    content: `## 1. The Chemistry of LiPo Discharge

Lithium Polymer (LiPo) batteries store electrical energy chemically. During flight, lithium ions move from the anode to the cathode, creating an external current.

### 1.1 Internal Resistance (IR) & Ohmic Sag
Every cell possesses an internal resistance ($R_{int}$). When drawing a high current $I$ (often exceeding 100A in FPV punchouts), the terminal voltage drops instantly due to ohmic losses:

$$V_{terminal} = V_{oc} - I \\cdot R_{int}$$

This voltage sag reduces overall motor RPM, limiting maximum thrust.

---

## 2. Decoding C-Ratings & Capacity

The C-rating represents the maximum continuous discharge rate of the pack:

$$I_{max} = \\text{Capacity (Ah)} \\cdot \\text{C-Rating}$$

### 2.1 The C-Rating Myth
Many FPV packs claim 150C+ continuous ratings. However, continuous discharge at these levels would melt the internal nickel tabs within seconds. Real continuous C-ratings rarely exceed 40-50C.

---

## 3. Thermal Degradation & Swelling

Drawing current raises cell temperature. If the internal temperature exceeds $60^\\circ\\text{C}$, the polymer electrolyte degrades, producing gas that causes cell swelling (puffing) and irreversible capacity loss.`
  },
  {
    slug: "rf-link-engineering",
    title: "RF Link Engineering: ELRS Packet Rates, LQ Interpretation & Signal Propagation",
    excerpt: "A technical study of high-speed FPV control links, analyzing ExpressLRS packet rates, signal-to-noise ratio boundaries, and Link Quality indicators.",
    category: "Communication",
    cover: {
      src: "https://images.unsplash.com/photo-1544256718-3bcf237f3974?auto=format&fit=crop&w=800&q=80",
      alt: "Telemetry signal towers or waves",
      caption: "High-frequency radio wave propagation and antenna polarization paths.",
      source: "Unsplash",
      sourceUrl: "https://unsplash.com/photos/radio-waves-625624792",
      credit: "Photo by Hector Achautla on Unsplash"
    },
    content: `## 1. ExpressLRS Architecture & Packet Rates

ExpressLRS (ELRS) utilizes LoRa (Long Range) modulation on $2.4\\text{ GHz}$ or $900\\text{ MHz}$ bands.
* **150Hz Packet Rate:** Slow updates, but extremely long range due to high sensitivity.
* **1000Hz (1kHz) Packet Rate:** Near-zero latency ($1\\text{ ms}$ updates), ideal for racing, but highly vulnerable to RF path attenuation.

---

## 2. Link Quality (LQ) vs. RSSI

### 2.1 RSSI (Received Signal Strength Indicator)
RSSI measures raw signal power. However, high background noise can inflate RSSI while the link is failing.

### 2.2 Link Quality (LQ)
LQ measures the percentage of successfully received packets over a rolling window. An LQ of 100% means zero packet loss. If LQ drops below 80%, control delay increases, and a failsafe is imminent.

\`\`\`
[RF Signal Range vs Link Quality]
Link Quality (%)
100 |==============================\\
    |                              \\
 80 |                               \\  <-- Warning Zone
    |                                \\
  0 +---------------------------------\\-------> Distance (km)
                                   (Failsafe)
\`\`\`

---

## 3. Multipath Interference & Antenna Diversity

Radio waves reflect off concrete structures, arriving at the receiver at slightly different times. Antenna diversity systems mitigate this by dynamically switching to the receiver antenna with the cleanest phase angle.`
  },
  {
    slug: "video-latency-engineering",
    title: "Video Latency Engineering: Glass-to-Glass Measurements & Penetration Limits",
    excerpt: "An advanced technical report analyzing FPV video transmission latencies, detailing encoding pipelines, signal penetration, and digital vs analog glass-to-glass delay metrics.",
    category: "Communication",
    cover: {
      src: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=800&q=80",
      alt: "Abstract digital transmission noise",
      caption: "Real-time digital video encoding pipelines and high-speed data streams.",
      source: "Unsplash",
      sourceUrl: "https://unsplash.com/photos/glass-transmission-625624792",
      credit: "Photo by John Barker on Unsplash"
    },
    content: `## 1. The FPV Video Pipeline

The video link is a pilot's eyes. Glass-to-glass latency represents the total delay from the camera sensor capturing a frame to the goggle display illuminating.

### 1.1 Analog Zero-Latency
Analog video systems stream raw video lines as they are read from the sensor, bypassing digital encoding. Glass-to-glass latency is constant ($< 10\\text{ ms}$), providing unmatched feedback for racing.

---

## 2. Digital Video encoding (DJI, Walksnail, HDZero)

Digital FPV systems convert the analog sensor data into compressed digital streams (H.264/H.265) before transmitting.

### 2.1 HDZero (Uncompressed Digital)
HDZero uses uncompressed digital transmission. Like analog, it transmits line-by-line. Latency is constant and fixed at $\\approx 14-16\\text{ ms}$ regardless of range.

### 2.2 DJI & Walksnail (Compressed Digital)
DJI and Walksnail compress frames to achieve high resolution (1080p).
* **Variable Latency:** Total delay varies ($25-45\\text{ ms}$) depending on signal quality.
* **Buffer Delay:** Bad RF conditions force packet retransmissions, increasing buffer delays and causing frame drops.

---

## 3. Signal Penetration & Frequency Dynamics

Digital systems rely on error correction coding to survive signal reflections. If RF attenuation exceeds the error correction threshold, the stream will instantly pixelate or freeze.`
  },
  {
    slug: "frame-resonance-vibration-analysis",
    title: "Frame Resonance & Vibration Analysis: Carbon Fiber Mechanics & Gyro Contamination",
    excerpt: "A deep physical study on carbon fiber structural resonance, analyzing vibration transfer paths, frame stiffness parameters, and gyro noise prevention.",
    category: "Systems",
    cover: {
      src: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80",
      alt: "Carbon fiber pattern close up",
      caption: "Premium FPV drone carbon fiber weave layers and structural brace arms.",
      source: "Unsplash",
      sourceUrl: "https://unsplash.com/photos/carbon-fiber-weave-625624792",
      credit: "Photo by NASA on Unsplash"
    },
    content: `## 1. Structural Resonance of Carbon Fiber

Multirotor frames are cut from carbon fiber sheets. While extremely strong, carbon fiber possesses natural resonance frequencies ($150-300\\text{ Hz}$). When the motors spin, they generate vibrations that match these frequencies, causing the frame to resonate.

---

## 2. Gyro Contamination Path

Frame vibrations are conducted directly to the Flight Controller (FC) board. The onboard gyro sensor registers this high-frequency noise, which corrupts the PID control loop.

\`\`\`
[Vibration Contamination Path]
Motors ---> Arms ---> Frame Plates ---> FC Standoffs ---> Gyro Sensor
                         |                                  |
                   (Resonance Peak)                 (PID Loop Corruption)
\`\`\`

### 2.1 Mitigation via Soft-Mounting
Soft-mounting the FC using silicone gummies isolates the board, acting as a low-pass filter to damp vibrations above $100\\text{ Hz}$.

---

## 3. Frame Layout Stiffness Comparisons

* **True X Layout:** Symmetrical arms, balanced inertia, but narrow carbon plates can resonate easily on Pitch.
* **Deadcat Layout:** Front arms pushed out for clean camera views. The asymmetric geometry creates complex arm resonance frequencies, requiring separate filtering for Roll and Pitch.`
  },
  {
    slug: "gps-rescue-reliability",
    title: "GPS Rescue Reliability: Satellite Geometry, Fail-safe Logic & Recovery Loops",
    excerpt: "A critical technical safety report on Betaflight GPS Rescue systems, examining satellite lock geometry, home point calculations, and failsafe recovery loops.",
    category: "Systems",
    cover: {
      src: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=800&q=80",
      alt: "Satellite views from orbit",
      caption: "Global satellite navigation networks and coordinate tracking pathways.",
      source: "Unsplash",
      sourceUrl: "https://unsplash.com/photos/orbital-space-625624792",
      credit: "Photo by NASA on Unsplash"
    },
    content: `## 1. Home Point Calculations & Satellite Lock

GPS Rescue is a critical safety system. During arming, the FC records the Home Point coordinates once a minimal satellite lock is established (typically 8 satellites).

### 1.1 Satellite Geometry (HDOP/PDOP)
The accuracy of the lock is determined by the Dilution of Precision (DOP):
* **Low HDOP (< 1.5):** Satellites are spread out, providing perfect triangulation.
* **High HDOP (> 3.0):** Satellites are clustered together, leading to coordinate drift and home point errors.

---

## 2. Betaflight Rescue Failsafe Logic

When control signal is lost (Failsafe), the FC takes control:
1. **Climb Phase:** The multirotor immediately climbs to a safe altitude.
2. **Turn Phase:** The FC calculates the home vector and turns towards home.
3. **Return Phase:** The drone flies home at a programmed speed, monitoring satellite locks and barometric altitude.

---

## 3. Catastrophic Failure Scenarios

### 3.1 Satellite Loss Mid-Rescue
If satellite count drops below 4 during the flight, the FC loses triangulation. Betaflight failsafe rules command the drone to disarm immediately to prevent flyaways.

### 3.2 Glitchy Barometers
A faulty barometer can report false altitude spikes, forcing the FC to descend prematurely into trees or water.`
  },
  {
    slug: "how-fpv-systems-work-together",
    title: "How FPV Systems Work Together: System Integration & Electrical Architecture",
    excerpt: "A comprehensive systems engineering study on the FPV aircraft as an integrated electrical and signal processing system.",
    category: "Systems",
    cover: {
      src: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
      alt: "Motherboard circuitry lines",
      caption: "Integrated electrical paths and flight controller signal networks.",
      source: "Unsplash",
      sourceUrl: "https://unsplash.com/photos/integrated-circuits-625624792",
      credit: "Photo by Alexandre Debiève on Unsplash"
    },
    content: `## 1. The FPV Aircraft as an Integrated System

An FPV multirotor is an interconnected system of electrical, radio, and mechanical components. Every system depends on the others; a flaw in one component cascades through the entire aircraft.

---

## 2. Core Subsystems

### 2.1 The Electrical Bus
The battery delivers raw power (up to 25V) to the ESC. The ESC regulates motor speeds and supplies clean $5\\text{V}$ and $9\\text{V}$ power to the Flight Controller (FC), radio receiver (RX), and video transmitter (VTX).

### 2.2 Signal Pathways
1. **Pilot Inputs** are transmitted via RF waves ($2.4\\text{ GHz}$) to the RX.
2. **RX** forwards digital packets (using CRSF protocol) to the FC.
3. **FC** reads gyro sensors, runs PID calculations, and sends motor commands to the ESC via DShot.

\`\`\`
[Multirotor Signal Architecture]
Pilot Sticks ---> Tx (Radio) ---> Rx (Receiver) ---> FC (Flight Controller)
                                                        |
Gyro Telemetry <--- Motors <--- ESC (Motor Speed) <-----+
\`\`\`

---

## 3. Common System Cascading Failures

* **Electrical Ground Loops:** Bad grounding routes electrical noise from the motors directly into the analog video line, causing heavy diagonal line static in the goggles.
* **Voltage Sag Crashes:** High-current motor loads can sag battery voltage below the FC regulator's minimum input, triggering an immediate mid-air flight controller reboot.`
  }
];

console.log("Generating 12 flagship engineering articles inside content/published...");

flagships.forEach((art) => {
  const publishedAt = new Date().toISOString();
  
  // Format matching the exact structure from content-reader.ts
  const articleJson = {
    slug: art.slug,
    title: art.title,
    jobId: `flagship-${art.slug}`,
    category: art.category,
    template: "tech-article",
    seo: {
      slug: art.slug,
      metaDescription: art.excerpt,
      keywords: ["fpv research", "engineering lab", art.category.toLowerCase(), art.slug.replace(/-/g, " ")]
    },
    excerpt: art.excerpt,
    bodySections: [
      {
        id: "intro",
        title: art.title,
        content: art.content
      }
    ],
    internalLinks: flagships
      .filter((f) => f.slug !== art.slug)
      .slice(0, 3)
      .map((f) => `/article/${f.slug}`),
    publishNotes: ["Flagship Engineering Lab V2 Research Paper"],
    media: {
      coverImage: art.cover,
      gallery: [],
      figureCaptions: [],
      imageSources: [art.cover.sourceUrl],
      attribution: [art.cover.credit]
    },
    jobStatus: "published",
    publishedAt: publishedAt,
    promptVersion: "v2"
  };

  const jsonFilePath = path.join(PUBLISHED_DIR, `${art.slug}.json`);
  const mdFilePath = path.join(PUBLISHED_DIR, `${art.slug}.md`);

  // Write JSON
  fs.writeFileSync(jsonFilePath, JSON.stringify(articleJson, null, 2), 'utf-8');
  
  // Write Markdown
  const mdContent = `---
title: "${art.title}"
slug: "${art.slug}"
category: "${art.category}"
excerpt: "${art.excerpt}"
publishedAt: "${publishedAt}"
---

${art.content}
`;
  fs.writeFileSync(mdFilePath, mdContent, 'utf-8');
  
  console.log(`- Created flagship: ${art.slug} (${art.category})`);
});

console.log("Flagship articles successfully generated!");
