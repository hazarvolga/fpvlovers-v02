# Modern Betaflight Filter Architecture: Dynamic Notch, RPM Filtering & Latency Tradeoffs

> A research-grade analysis of multirotor noise filtering strategies, detailing the dynamic notch filter, bi-directional DShot RPM filtering, and phase delay latency tradeoffs.

## Modern Betaflight Filter Architecture: Dynamic Notch, RPM Filtering & Latency Tradeoffs

## 1. Multirotor Noise Spectrum

Multirotor multirotors generate extreme high-frequency vibration from mechanical motor imbalances and aerodynamic propeller drag. This noise ($100-1000\text{ Hz}$) must be removed before the PID loop processes gyro data, or D-term gains will amplify it, causing motor overheating.

---

## 2. Advanced Filtering Technologies

### 2.1 Bi-directional DShot & RPM Filtering
By enabling bi-directional communication between the Flight Controller (FC) and the ESC, the FC receives real-time motor telemetry containing exact motor RPM values. This allows the FC to deploy narrow, surgical notch filters tracking the fundamental harmonic frequency of each motor:

$$f_{harmonic} = \frac{\text{RPM}}{60} \cdot n_{\text{magnets}}$$

### 2.2 The Dynamic Notch Filter
The dynamic notch filter uses a fast Fourier transform (FFT) algorithm to track the loudest noise bands across the spectrum and dynamically place notch filters over them.

```
[RPM vs Dynamic Notch Filtering]
Amplitude
  ^
  |     ___      ___ (Unfiltered Noise Peak)
  |    /   \    /   \
  |===|=====\==|=====\=== (Filter Attenuation)
  |   \_____/  \_____/
  +-------------------------------------> Frequency
```

---

## 3. Filter Latency & Phase Delay

Every filter introduced into the signal chain adds delay. A phase delay in the gyro signal of even $2-3\text{ ms}$ reduces the PID loop's phase margin, rendering it unstable and prone to propwash oscillations.

![FPV image from oscarliang.com](https://oscarliang.com/wp-content/uploads/2019/07/betaflight-static-notch-filter.jpg)
_Source: oscarliang.com_

