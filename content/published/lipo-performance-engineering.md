---
title: "LiPo Performance Engineering: Internal Resistance, Voltage Sag & Thermal Physics"
slug: "lipo-performance-engineering"
category: "Propulsion"
excerpt: "A scientific research paper exploring Lithium Polymer battery dynamics, examining internal resistance curves, high-current discharge sag, and thermal degradation risks."
publishedAt: "2026-06-02T07:41:42.019Z"
---

## 1. The Chemistry of LiPo Discharge

Lithium Polymer (LiPo) batteries store electrical energy chemically. During flight, lithium ions move from the anode to the cathode, creating an external current.

### 1.1 Internal Resistance (IR) & Ohmic Sag
Every cell possesses an internal resistance ($R_{int}$). When drawing a high current $I$ (often exceeding 100A in FPV punchouts), the terminal voltage drops instantly due to ohmic losses:

$$V_{terminal} = V_{oc} - I \cdot R_{int}$$

This voltage sag reduces overall motor RPM, limiting maximum thrust.

---

## 2. Decoding C-Ratings & Capacity

The C-rating represents the maximum continuous discharge rate of the pack:

$$I_{max} = \text{Capacity (Ah)} \cdot \text{C-Rating}$$

### 2.1 The C-Rating Myth
Many FPV packs claim 150C+ continuous ratings. However, continuous discharge at these levels would melt the internal nickel tabs within seconds. Real continuous C-ratings rarely exceed 40-50C.

---

## 3. Thermal Degradation & Swelling

Drawing current raises cell temperature. If the internal temperature exceeds $60^\circ\text{C}$, the polymer electrolyte degrades, producing gas that causes cell swelling (puffing) and irreversible capacity loss.
