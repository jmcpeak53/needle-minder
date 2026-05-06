# Needle Minder

Needle Minder is an offline mobile app for cross-stitch and embroidery hobbyists to track physical thread inventory. V1 targets Android and iOS with React Native, Expo, local SQLite storage, DMC Six-Strand Embroidery Floss reference data, manual entry, and one-skein-at-a-time label scanning with required confirmation.

## Current Status

This repo now contains the first implementation scaffold:

- Expo SDK 55 app with Expo Router tabs.
- Local SQLite schema and repositories for thread types, reference colors, and user inventory.
- Manual add, inventory management, scan/confirm, and settings screens.
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

## Run In Development

OCR uses native ML Kit code, so use a custom development build rather than Expo Go.

```bash
npm run start
npm run android
npm run ios
```

## Test And Validate

```bash
npm test
npm run typecheck
npm run validate:catalog
```

The catalog validation command checks the CSV in `data/reference/dmc-six-strand.csv` for required fields, duplicate color codes, valid hex colors, and valid variegated flags.

## Build Profiles

```bash
eas build --profile development --platform android
eas build --profile preview-apk --platform android
eas build --profile testflight --platform ios
eas submit --profile testflight --platform ios
```

The Android `preview-apk` profile is intended for sideloaded APK testing. The iOS `testflight` profile is intended for TestFlight distribution. App store submission remains out of scope for v1.

## Project Structure

- `app/` - Expo Router screens.
- `src/db/` - SQLite setup, schema, and repositories.
- `src/inventory/` - inventory business rules.
- `src/catalog/` - reference catalog interfaces and validation.
- `src/ocr/` - OCR candidate parsing.
- `src/providers/` - device/provider integrations such as ML Kit OCR.
- `data/reference/` - importable reference catalog CSV data.
- `scripts/` - project maintenance scripts.
