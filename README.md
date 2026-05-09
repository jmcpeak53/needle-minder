# Needle Minder

Needle Minder is an offline mobile app for cross-stitch and embroidery hobbyists to track physical thread inventory and plan projects. V1 targets Android and iOS with React Native, Expo, local SQLite storage, DMC Six-Strand Embroidery Floss reference data, manual entry, one-skein-at-a-time label scanning with required confirmation, and project-level thread reservations.

## Current Status

This repo now contains the first implementation scaffold:

- Expo SDK 55 app with Expo Router tabs.
- Local SQLite schema and repositories for thread types, reference colors, user inventory, projects, and thread reservations.
- Manual add, inventory management, project planning, scan/confirm, and settings screens.
- A small DMC development fixture. The full DMC catalog still needs to be sourced and audited before v1 release.

## Prerequisites

- Node.js 20.19.4 or newer. Expo SDK 55 and React Native 0.83 require Node 20; Node 18 will install with engine warnings and may not run the toolchain correctly.
- npm.
- Expo/EAS account for device builds.
- Android Studio and Xcode only when building locally. EAS cloud builds can handle native builds without local Android/iOS project folders.

## Setup

```bash
npm install
```

On Windows PowerShell, if `npm` is blocked by the local script execution policy, use `npm.cmd` for the same commands.

## Run In Development

OCR uses native ML Kit code. Expo Go is not supported — you must use a custom development build.

Development on a physical device uses a **two-phase model**:

### Phase 1 — First-Time Device Setup

Build and install an EAS development client on the target device. This is a persistent shell app that contains a Metro bundler client. You install it once; you do not rebuild it for every code change.

```bash
npm run build:dev:android   # Android
npm run build:dev:ios       # iOS
```

EAS will print a QR code and download link when the build finishes. Scan the QR code or open the link on the device to install. On Android, allow installation from unknown sources when prompted.

**Rebuild the development client only when:**
- A new npm package that contains native code is added to the project.
- `app.json` fields that affect native output change (permissions, bundle identifier, splash screen, icons, Expo SDK version).
- The Expo SDK is upgraded.

For all other changes — new screens, new components, business logic, styles — the development client does not need to be rebuilt.

### Phase 2 — Daily Development

Start the Metro bundler on your development machine. Your phone connects to it over your local network; no USB connection is required.

```bash
npm run dev
```

Open the installed development client on your device. It will discover Metro automatically if the device and development machine are on the same WiFi network. **Fast refresh is active** — code changes appear on the device within one to two seconds of saving a file.

> **Troubleshooting:** If the device cannot find Metro, ensure both are on the same WiFi network. If behind a VPN or guest network, try connecting the device via USB once to let Metro detect it, then disconnect.

### Simulator / Local Native Build (optional)

The `android` and `ios` scripts use `expo run:*` and require Android Studio or Xcode installed locally. They are an alternative to the EAS workflow for developers with a full native toolchain.

```bash
npm run android
npm run ios
```

## Test And Validate

```bash
npm test -- --runInBand
npm run typecheck
npm run lint
npm run validate:catalog
```

Validate specific catalog files only:

```bash
npm run validate:catalog -- data/reference/dmc-six-strand.csv data/reference/dmc-pearl-cotton-5.csv
```

The catalog validation command checks all CSVs in `data/reference/` (currently six-strand and pearl cotton size 5) for required fields, duplicate color codes, valid hex colors, and valid variegated flags.

## Build Profiles

| Script | EAS Profile | Platform | Use when |
|---|---|---|---|
| `npm run build:dev:android` | `development` | Android | First device setup or after native code changes |
| `npm run build:dev:ios` | `development` | iOS | First device setup or after native code changes |
| `npm run build:preview` | `preview-apk` | Android | Testing standalone APK without Metro attached |
| `npm run build:testflight` | `testflight` | iOS | TestFlight distribution |

The `preview-apk` profile produces a standalone sideloaded APK — use it to validate release behavior, not for day-to-day debugging (see Development Workflow above). The `testflight` profile targets the App Store pipeline. App store submission remains out of scope for v1.

To submit an iOS build to TestFlight after it completes:

```bash
eas submit --profile testflight --platform ios
```

## Project Structure

- `app/` - Expo Router screens.
- `src/db/` - SQLite setup, schema, and repositories.
- `src/state/` - app-level state and context providers.
- `src/inventory/` - inventory business rules.
- `src/projects/` - project business rules, reservation math, and reusable project UI.
- `src/catalog/` - reference catalog interfaces and validation.
- `src/ocr/` - OCR candidate parsing.
- `src/providers/` - device/provider integrations such as ML Kit OCR.
- `data/reference/` - importable reference catalog CSV data.
- `scripts/` - project maintenance scripts.

## Thread Puller (Standalone Tool)

`tools/thread-puller/` contains a standalone Python scraper + normalizer for generating importable thread catalog CSVs. V1 is configured for Penny Linn DMC Pearl Cotton Size 5.

Tool setup and usage are documented in [tools/thread-puller/README.md](tools/thread-puller/README.md).
