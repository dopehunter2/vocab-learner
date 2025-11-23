# Deployment and Build Guide

This document provides a step-by-step guide for building a standalone `.apk` file for Android.

## 1. Build Environment Requirements
- **Node.js:** Use a stable LTS version (Node 18 or 20 are confirmed to work).
- **Android Studio:** Required for the Android SDK, command-line tools, and emulator.
- **`local.properties`:** Ensure you have an `android/local.properties` file with the correct `sdk.dir` path pointing to your Android SDK installation.
    - *Example:* `sdk.dir=/Users/mac/Library/Android/sdk`

## 2. Key Build Configuration
The project is now configured to build using **React Native's New Architecture (Fabric)**. This is a critical requirement for our current dependencies.

- **`android/gradle.properties`**:
    - `newArchEnabled` **must be set to `true`**.
    - `org.gradle.jvmargs` has been increased to `-Xmx4g -XX:MaxMetaspaceSize=1g` to prevent memory-related build failures.

- **`package.json`**:
    - `react-native-reanimated` must be a version that supports the New Architecture (e.g., `^4.x.x`). Downgrading this package will cause the build to fail.

## 3. Building the Release APK

1.  **Navigate to the `android` directory:**
    ```bash
    cd vocab-learner-restored/android
    ```

2.  **(Optional) Clean the project:**
    If you encounter strange issues, run this command to clear previous build artifacts.
    ```bash
    ./gradlew clean
    ```

3.  **Run the release build command:**
    This process will bundle the JavaScript code and compile the native Android app. It can take several minutes.
    ```bash
    ./gradlew assembleRelease
    ```

4.  **Locate the APK:**
    Upon successful completion, the installable APK file will be located at:
    `vocab-learner-restored/android/app/build/outputs/apk/release/app-release.apk`

## 4. Installation
You can install the generated APK on an Android emulator or a physical device using the Android Debug Bridge (`adb`).

1.  **Uninstall any old versions:**
    ```bash
    adb uninstall com.dieselboy85.vocablearnerapp
    ```

2.  **Install the new APK:**
    ```bash
    adb install path/to/app-release.apk
    ```
    *(Replace `path/to/` with the actual path from the previous step)*

## 5. Troubleshooting Common Build Failures

-   **Error: `Metaspace`**
    -   **Cause:** The Gradle build process ran out of memory.
    -   **Solution:** Ensure `org.gradle.jvmargs` in `android/gradle.properties` is set to a higher value, like `-Xmx4g -XX:MaxMetaspaceSize=1g`.

-   **Error: `javax.xml.bind.UnmarshalException ... Premature end of file.`**
    -   **Cause:** A `package.xml` file within your Android SDK is corrupted (e.g., it is a 0-byte empty file). This is a critical failure.
    -   **Solution:**
        1.  Identify the corrupted SDK platform folder (e.g., `/Users/mac/Library/Android/sdk/platforms/android-36`).
        2.  Delete that entire folder (`rm -rf ...`).
        3.  Re-run the Gradle build. Gradle will automatically detect the missing platform and re-download a fresh, uncorrupted version.

-   **Error: `[Reanimated] Reanimated requires new architecture to be enabled.` OR `[Worklets] Worklets require new architecture...`**
    -   **Cause:** You are trying to build with `newArchEnabled=false`, but your version of `react-native-reanimated` (or one of its dependencies) requires it.
    -   **Solution:** You **must** enable the New Architecture. Set `newArchEnabled=true` in `android/gradle.properties` and ensure your `react-native-reanimated` version is up-to-date. Downgrading is no longer a viable option for this project.
