# FPV Troubleshooting Guide: Fix the Most Common Problems Fast

> A practical troubleshooting hub for the most common FPV issues, organized by symptom so new pilots can find a fix quickly.

## Start With Safety

Before diving into complex debugging, always start with the basics. **Remove props** before bench testing. Check your **battery voltage** with a multimeter. Verify all **solder joints** are shiny and solid. A cold solder joint is the root cause of more FPV problems than any other single issue.

![FPV image from dronechampionsleague.com](https://dronechampionsleague.com/wp-content/uploads/2025/04/1.webp)
_Source: dronechampionsleague.com_

## No Video? Isolate the Chain

When your goggles show nothing:
- Verify the **VTX and goggles are on the same channel**
- Check the **camera wiring** — is it getting power?
- Try a **different antenna**
- Is the **VTX antenna connected**? Running a VTX without an antenna can damage it

Work backwards: goggle → VRX → antenna → VTX → camera. Isolate each link.

![Drones](https://rotorriot.com/cdn/shop/files/CL2-4S-ELRS5..jpg?v=1764108025&width=1722)
_Drones_

## Won't Arm? Read the Flags

Connect to Betaflight and check the **Arming Disable Flags** in the Setup tab. Common causes:
- **Throttle not at zero** (adjust endpoints)
- **Accelerometer not calibrated** (calibrate on level surface)
- **RX loss** (check receiver binding and protocol)
- **GPS not locked** (if GPS rescue is enabled)

The arming flags tell you exactly what's wrong.

![FPV image from judgeme.imgix.net](https://judgeme.imgix.net/rotor-riot-store/1767380059__1000002620__original.jpg?auto=format&w=1024)
_Source: judgeme.imgix.net_

## Bench Testing Checklist

Before every first flight after a repair:
1. **Smoke stopper** on first power-up
2. Verify **motor direction** in Betaflight Motors tab
3. **Props off** for motor testing
4. Check **failsafe** behavior (turn off radio, verify disarm)
5. **Range test** your radio link
6. Verify **OSD elements** are visible in goggles

![Rotor Riot](https://rotorriot.com/cdn/shop/files/motor-png.png?v=1763398242&width=1800)
_Rotor Riot_

## Prevention and Maintenance

Most FPV problems are preventable with regular maintenance:
- **Conformal coat** your electronics for moisture protection
- Check **antenna connections** after every crash
- Inspect **frame screws** for tightness
- Clean **motor bearings** periodically
- Keep **spare antennas, props, and standoffs** in your field kit

![FPV image from judgeme.imgix.net](https://judgeme.imgix.net/rotor-riot/1773700959__1000002728__original.jpg?auto=format&w=1024)
_Source: judgeme.imgix.net_

