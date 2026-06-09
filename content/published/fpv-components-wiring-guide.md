# FPV Components and Wiring Guide: What Each Part Does

> A beginner-friendly map of every core FPV component, what it does, and how the signal and power paths fit together.

## The Six Core Components

Every FPV drone has six core components working together:
1. **Frame** — the skeleton that holds everything
2. **Flight Controller (FC)** — the brain running Betaflight
3. **ESC** (Electronic Speed Controllers) — the muscles driving motors
4. **Motors** — spin the propellers
5. **VTX + Camera** — your eyes in the sky
6. **Receiver** — listens to your radio commands

Understanding each component's role is the first step to building and repairing with confidence.

![ESCs \(Electronic Speed Controllers\)](https://www.racedayquads.com/cdn/shop/files/nav-all-electronics-escs-electronic-speed-controllers.webp?v=3773967901496022457)
_ESCs \(Electronic Speed Controllers\)_

## Power Flow: How Electricity Moves

Battery → ESC pads (main power) → FC via ESC harness (5V/3.3V regulated) → peripherals.

- **LiPo battery** provides raw voltage (4S=14.8V, 6S=22.2V) to ESC main pads
- ESC steps down voltage for FC through the **ESC-to-FC cable**
- FC distributes **5V** to VTX, camera, receiver, GPS
- Some VTXs need **direct battery voltage** (Vbat) for full power

**Golden rule**: Never connect battery voltage directly to a 5V pad. You'll fry the component instantly.

![the dimensions of cnhl 4s 5000mah 70c lipo battery](https://chinahobbyline.com/cdn/shop/files/C2C04A7642FE2DE0DC392D411A517561_512x512.jpg?v=1780479051)
_the dimensions of cnhl 4s 5000mah 70c lipo battery_

## Signal Flow: How Commands Travel

Radio sticks → Receiver → FC (via UART RX) → FC processes → ESC (via protocol) → Motors.

- **Radio gimbals** send stick positions to the transmitter module
- **Receiver** decodes the signal and sends channel values to FC via serial (SBUS/CRSF)
- **FC gyro** measures rotation, PID loop calculates motor corrections
- **ESC protocol** (DShot300/600) sends digital commands to each ESC

Video flows the opposite way: Camera → FC/OSD → VTX → antenna → goggle receiver.

![Rotor Riot](https://rotorriot.com/cdn/shop/files/col-controller.jpg?v=1763394496&width=1800)
_Rotor Riot_

## Wiring Best Practices

- **Use the right gauge wire**: 14-16AWG for battery leads, 20-22AWG for motor wires, 26-28AWG for signal wires
- **Twist signal and ground** wires together to reduce electrical noise
- **Secure wires** with zip ties away from spinning props
- **Use a smoke stopper** on first power-up — it can save your entire build
- **Label your UARTs**: know which UART is for VTX, which for receiver, which for GPS
- Common mistake: RX pad on FC goes to TX on peripheral, TX goes to RX

![FPV image from judgeme.imgix.net](https://judgeme.imgix.net/rotor-riot-store/1767477640__image_2026-01-03_170134848__original.png?auto=format&w=1024)
_Source: judgeme.imgix.net_

## Compatibility Checks

Before buying components, verify:
- **FC mounting holes** match your frame (30.5x30.5, 20x20, or whoop)
- **ESC protocol** is supported by your FC (all modern FCs support DShot)
- **Motor KV** matches your battery voltage (6S: 1700-1950KV, 4S: 2400-2700KV for 5-inch)
- **VTX mounting** fits your frame's VTX slot
- **Receiver protocol** matches your radio (ELRS, Crossfire, Tracer)

![CineMini 2.5" Frame](https://rotorriot.com/cdn/shop/files/CineMiniFrame1.png?v=1744041396&width=400)
_CineMini 2.5" Frame_

