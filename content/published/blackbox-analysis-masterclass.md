# Blackbox Analysis Masterclass: Decoding Gyro Spectral Densities & PID Traces

> An advanced research paper detailing flight data extraction, gyro noise identification, spectral notch filter validation, and propwash oscillation analysis using Betaflight Blackbox logs.

## Blackbox Analysis Masterclass: Decoding Gyro Spectral Densities & PID Traces

## 1. The Anatomy of Flight Telemetry

Blackbox logging is the flight data recorder of FPV multirotors. To debug high-frequency oscillations or validate filter performance, we must decode raw gyro and PID traces.

### 1.1 Sampling Rates & Nyquist Frequency
Multirotor control loops operate at high frequencies (typically 8kHz or 4kHz). To avoid aliasing in our data, we must sample gyro telemetry at a rate satisfying the Nyquist-Shannon sampling theorem:

$$f_{sample} > 2 \cdot f_{max}$$

In Betaflight, a logging rate of 2kHz or 4kHz is standard. Logging at 1/1 (full loop speed) records every single control loop iteration, providing pristine data for fast Fourier transforms (FFT).

### 1.2 The Gyro Spectral Density
Raw gyro traces contain both pilot command frequencies ($0-20\text{ Hz}$) and mechanical motor noise ($100-800\text{ Hz}$). A raw spectral density plot exposes mechanical resonance.

```
[Gyro Spectral Density FFT Plot]
Amplitude
  ^
  |        | | | (Motor Frame Noise)
  |       / \| |\
  |      /   \|/ \
  |     /         \    /\ (Prop wash)
  |____/___________\__/__\________> Frequency (Hz)
  0   20          150  300  600
```

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
3. If D-term gain is too low, the oscillation persists; if too high, D-term feedback loops create thermal runaways.

![FPV image from oscarliang.com](https://oscarliang.com/wp-content/uploads/2013/10/PID-three-algorithms.jpg)
_Source: oscarliang.com_

