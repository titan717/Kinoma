# Panda.fun Native Android TV Application

This directory contains the complete source code and build configuration for **Panda.fun TV**, a native Android TV application built with **Jetpack Compose for TV**, **ExoPlayer / Media3**, **Leanback launcher support**, and an **automatic private self-update system**.

## How to Build `Panda.fun.apk`

1. Open Android Studio (Hedgehog or newer recommended).
2. Select **Open** and choose the `/android` directory of this project.
3. Allow Gradle to sync dependencies.
4. Run the build or generate signed APK:
   - **Debug APK**: Run `./gradlew assembleDebug` in the terminal inside `/android`. The output APK will be generated at `/android/app/build/outputs/apk/debug/app-debug.apk` (you can rename this to `Panda.fun.apk`).
   - **Release APK**: Run `./gradlew assembleRelease` to produce `app-release.apk`.

## Features
- **Leanback Launcher**: Appears natively on Android TV home screens with custom banner and icon.
- **D-Pad Spatial Navigation**: Fully remote-navigable focus model optimized for television screens.
- **Media3 / ExoPlayer**: High performance video streaming with buffering, resume, and full-screen controls.
- **Self-Update System**: Automatically queries `https://raw.githubusercontent.com/titan717/Panda.fun/main/update/latest.json` and prompts users to download and install updates via Android's package installer.
- **Panda.fun Backend Integration**: Connects directly to the Panda.fun anime backend API for real-time catalogs and trending shows.
