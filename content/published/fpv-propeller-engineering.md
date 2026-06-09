# FPV Propeller Engineering: Disc Loading, Blade Pitch & Aerodynamic Drag

> An advanced aerodynamic study of FPV propellers, detailing thrust-to-power calculations, pitch angles, disc loading constraints, and propwash interaction physics.

## FPV Propeller Engineering: Disc Loading, Blade Pitch & Aerodynamic Drag

## 1. Propeller Aerodynamics

multirotor propellers generate lift by pushing air downwards. The thrust $T$ generated is mathematically defined by the momentum theory equation:

$$T = 2 \cdot \rho \cdot A \cdot v_i^2$$

Where $\rho$ is air density, $A$ is the disc area, and $v_i$ is the induced velocity of the airflow.

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

High disc loading occurs when a heavy multirotor uses small propellers (e.g. 3-inch cinewhoops). High disc loading leads to severe aerodynamic instability in descents, forcing the PID controller to work in highly turbulent vortex states.

![FPV image from en.tmotor.com](https://en.tmotor.com/uploadfile/2025/1117/20251117051213250.jpg)
_Source: en.tmotor.com_

