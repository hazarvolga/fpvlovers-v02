---
title: "RF Link Engineering: ELRS Packet Rates, LQ Interpretation & Signal Propagation"
slug: "rf-link-engineering"
category: "Communication"
excerpt: "A technical study of high-speed FPV control links, analyzing ExpressLRS packet rates, signal-to-noise ratio boundaries, and Link Quality indicators."
publishedAt: "2026-06-02T07:41:42.020Z"
---

## 1. ExpressLRS Architecture & Packet Rates

ExpressLRS (ELRS) utilizes LoRa (Long Range) modulation on $2.4\text{ GHz}$ or $900\text{ MHz}$ bands.
* **150Hz Packet Rate:** Slow updates, but extremely long range due to high sensitivity.
* **1000Hz (1kHz) Packet Rate:** Near-zero latency ($1\text{ ms}$ updates), ideal for racing, but highly vulnerable to RF path attenuation.

---

## 2. Link Quality (LQ) vs. RSSI

### 2.1 RSSI (Received Signal Strength Indicator)
RSSI measures raw signal power. However, high background noise can inflate RSSI while the link is failing.

### 2.2 Link Quality (LQ)
LQ measures the percentage of successfully received packets over a rolling window. An LQ of 100% means zero packet loss. If LQ drops below 80%, control delay increases, and a failsafe is imminent.

```
[RF Signal Range vs Link Quality]
Link Quality (%)
100 |==============================\
    |                              \
 80 |                               \  <-- Warning Zone
    |                                \
  0 +---------------------------------\-------> Distance (km)
                                   (Failsafe)
```

---

## 3. Multipath Interference & Antenna Diversity

Radio waves reflect off concrete structures, arriving at the receiver at slightly different times. Antenna diversity systems mitigate this by dynamically switching to the receiver antenna with the cleanest phase angle.
