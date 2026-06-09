# GPS Rescue Reliability: Satellite Geometry, Fail-safe Logic & Recovery Loops

> A critical technical safety report on Betaflight GPS Rescue systems, examining satellite lock geometry, home point calculations, and failsafe recovery loops.

## GPS Rescue Reliability: Satellite Geometry, Fail-safe Logic & Recovery Loops

## 1. Home Point Calculations & Satellite Lock

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
A faulty barometer can report false altitude spikes, forcing the FC to descend prematurely into trees or water.

![FPV image from oscarliang.com](https://oscarliang.com/wp-content/uploads/2019/07/betaflight-static-notch-filter.jpg)
_Source: oscarliang.com_

