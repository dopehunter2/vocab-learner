# Deployment and Installation Guide

This document provides a step-by-step guide for building a standalone `.apk` file for Android and installing it on a physical device for testing.

## Building the APK using Android Studio

This is the recommended method for creating builds as it provides the most control and detailed error logging.

### Step 1: Pre-Build Configuration (One-Time Setup)

This step is crucial to resolve environment issues between Android Studio and a macOS development setup (especially when using tools like Homebrew).

1.  **Find your Node.js Path:**
    Open a standard terminal and run the command `which node`. This will output the path to your Node.js executable. Copy this path.
    *(Example: `/opt/homebrew/bin/node`)*

2.  **Configure Android Studio:**
    -   Open the native Android project in Android Studio. The correct folder to open is `vocab-learner-app/android`.
    -   In the Android Studio project explorer, find and open the file named `local.properties`.
    -   Add the following line to the end of this file, replacing the example path with the actual path you copied in the previous step:
        ```
        node.js.executable=/opt/homebrew/bin/node
        ```

3.  **Launch Android Studio from the Terminal:**
    To ensure Android Studio inherits your shell's full environment `PATH`, it is best to launch it directly from your terminal.
    -   First, completely quit Android Studio.
    -   Then, run the following command in your terminal:
        ```bash
        open -a "Android Studio" "/path/to/your/project/vocab-learner-app/android"
        ```

### Step 2: Running the Build

Once the project is open and the initial Gradle Sync has completed successfully, you can build the release `.apk`.

1.  **Clean the Project:**
    -   In the Android Studio menu bar, go to `Build > Clean Project`. This removes any old build artifacts.

2.  **Build the Release APK:**
    -   There are two ways to generate a release build that can be installed on a device:
        -   **Method A (Recommended - Standalone App):** Go to `Build > Build Bundle(s) / APK(s) > Build APK(s)`. This creates a debuggable APK. For a release build, it's better to use the command line.
        -   **Method B (Command Line Release):** Open a terminal, navigate to the `android` directory (`cd vocab-learner-app/android`), and run the command:
            ```bash
            ./gradlew assembleRelease
            ```

### Step 3: Locating and Installing the APK

1.  **Find the File:**
    -   For a debug build from Android Studio, click the "locate" link in the build success notification. The file will be at `.../app/build/outputs/apk/debug/app-debug.apk`.
    -   For a release build from the command line, the file will be at `.../app/build/outputs/apk/release/app-release.apk`.

2.  **Transfer to Your Device:**
    -   The easiest method is to upload the `.apk` file to a cloud service like Google Drive.
    -   Alternatively, connect your Android phone to your Mac via a USB cable and transfer the file.

3.  **Install:**
    -   On your phone, open a file manager app and navigate to where you saved the `.apk`.
    -   Tap the file to install it. You may need to grant your file manager permission to "install from unknown sources."

---

## Troubleshooting

-   **Error: `Cause: error=2, No such file or directory` during Gradle Sync:**
    This means Android Studio cannot find your `node` executable. Ensure you have completed **Step 1: Pre-Build Configuration** correctly. Launching from the terminal is the most reliable fix.

-   **App Crashes on Launch with "Unable to load script":**
    This occurs if you install a **debug** build (`app-debug.apk`) but do not have the Metro development server running. To fix this, run `npx expo start` in your project's root directory (`vocab-learner-app`) on your computer while your phone is on the same Wi-Fi network. For standalone testing, always build and install a **release** build.
