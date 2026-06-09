# Video Latency Engineering: Glass-to-Glass Measurements & Penetration Limits

> An advanced technical report analyzing FPV video transmission latencies, detailing encoding pipelines, signal penetration, and digital vs analog glass-to-glass delay metrics.

## Video Latency Engineering: Glass-to-Glass Measurements & Penetration Limits

## 1. The FPV Video Pipeline

The video link is a pilot's eyes. Glass-to-glass latency represents the total delay from the camera sensor capturing a frame to the goggle display illuminating.

### 1.1 Analog Zero-Latency
Analog video systems stream raw video lines as they are read from the sensor, bypassing digital encoding. Glass-to-glass latency is constant ($< 10\text{ ms}$), providing unmatched feedback for racing.

---

## 2. Digital Video encoding (DJI, Walksnail, HDZero)

Digital FPV systems convert the analog sensor data into compressed digital streams (H.264/H.265) before transmitting.

### 2.1 HDZero (Uncompressed Digital)
HDZero uses uncompressed digital transmission. Like analog, it transmits line-by-line. Latency is constant and fixed at $\approx 14-16\text{ ms}$ regardless of range.

### 2.2 DJI & Walksnail (Compressed Digital)
DJI and Walksnail compress frames to achieve high resolution (1080p).
* **Variable Latency:** Total delay varies ($25-45\text{ ms}$) depending on signal quality.
* **Buffer Delay:** Bad RF conditions force packet retransmissions, increasing buffer delays and causing frame drops.

---

## 3. Signal Penetration & Frequency Dynamics

Digital systems rely on error correction coding to survive signal reflections. If RF attenuation exceeds the error correction threshold, the stream will instantly pixelate or freeze.

![sponsor-banner](https://oscarliang.com/wp-content/uploads/2025/08/pcbway-banner-22-08-2025-1-1.jpg)
_sponsor-banner_

