# Codemagic Build Setup Guide

This guide explains how to build your Capacitor app on Codemagic for iOS and Android.

## Prerequisites

### For iOS Builds
- Apple Developer Account (paid membership required)
- Signing certificates and provisioning profiles
- Codemagic subscription with macOS builder access (paid plan)

### For Android Builds
- Google Play Developer Account (optional for publishing)
- Keystore file for signing (if building for release)
- Codemagic account (free tier includes Linux builders)

## Setup Instructions

### Step 1: Connect Your GitHub Repository

1. Go to [Codemagic Dashboard](https://codemagic.io/start)
2. Click "Add application"
3. Select your GitHub repository: `mackshema/client_1_billing_system`
4. Click "Finish"

### Step 2: Configure iOS Signing (For iOS Builds)

#### Option A: Automatic Signing (Recommended)

1. In Codemagic, go to **Settings** → **Code signing**
2. Click **Apple Certificates**
3. Upload your signing certificate (.p8 or .cer file)
4. Codemagic will use this for all iOS builds

#### Option B: Manual Provisioning Profiles

1. Download provisioning profile from Apple Developer Portal
   - Profile Type: "Ad Hoc" or "App Store Distribution"
   - App ID: `com.client.billing`
   
2. Upload to Codemagic:
   - Settings → Code signing → Apple Certificates
   - Upload .mobileprovision file

#### Create Signing Certificate (if needed)

```bash
# Generate certificate signing request in Keychain Access
# Then in Apple Developer Portal:
# 1. Go to Certificates, Identifiers & Profiles
# 2. Click + to create new certificate
# 3. Select "iOS Distribution"
# 4. Upload CSR from Keychain
# 5. Download certificate (.cer)
# 6. Double-click to add to Keychain
# 7. Export as .p8 from Keychain
```

### Step 3: Configure Android Signing (For Android Builds)

#### Generate Keystore (if needed)

```bash
keytool -genkey -v -keystore release.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias release-key -storepass android \
  -keypass android \
  -dname "CN=Client Billing, O=TamizhanGroups, C=IN"
```

#### Upload to Codemagic

1. In Codemagic, go to **Settings** → **Code signing**
2. Click **Android Keystores**
3. Upload `release.keystore`
4. Enter keystore password
5. Enter key alias and key password

### Step 4: Set Environment Variables

In Codemagic Settings → Environment variables, add:

```
CODEMAGIC_EMAIL = your-email@example.com
```

### Step 5: Build!

1. Go to **Workflows** tab
2. Click on `ios-release` or `android-release`
3. Click **Start new build**
4. Monitor build progress in real-time

## Build Workflow Explanation

### iOS Build (`ios-release`)

1. **Install dependencies**: `npm install`
2. **Build web assets**: `npm run build` → creates `/dist`
3. **Add iOS platform**: `npx cap add ios` (if missing)
4. **Sync Capacitor**: `npx cap sync ios` → copies web assets to Xcode project
5. **Install CocoaPods**: `pod install` → manages iOS dependencies
6. **Build for archive**: `xcodebuild` compiles app
7. **Create IPA**: Exports archive as `.ipa` file for App Store

### Android Build (`android-release`)

1. **Install dependencies**: `npm install`
2. **Build web assets**: `npm run build` → creates `/dist`
3. **Sync Capacitor**: `npx cap sync android` → copies web assets to Android project
4. **Build Bundle**: `./gradlew bundleRelease` → creates `.aab` for Google Play

## Local Testing (Before Codemagic)

### Test iOS Build (macOS only)

```bash
# Install dependencies
npm install

# Build web assets
npm run build

# Add iOS platform (first time only)
npx cap add ios

# Sync Capacitor
npx cap sync ios

# Open in Xcode
open ios/App/App.xcworkspace

# In Xcode:
# 1. Select your team in Signing & Capabilities
# 2. Click Build button or press Cmd+B
# 3. If successful, you can create IPA via Product → Archive
```

### Test Android Build (Windows, macOS, Linux)

```bash
# Install dependencies
npm install

# Build web assets
npm run build

# Sync Capacitor
npx cap sync android

# Open in Android Studio
open -a "Android Studio" android/

# Or build from command line
cd android
./gradlew bundleRelease
cd ..

# Output: android/app/build/outputs/bundle/release/app-release.aab
```

## Troubleshooting

### iOS Build Fails: "No provisioning profile found"

**Solution**: Upload provisioning profile to Codemagic

```bash
# In Codemagic Settings:
# Code signing → Apple Certificates → Add provisioning profile
```

### iOS Build Fails: "CocoaPods not installed"

**Solution**: Already handled by workflow (pod install runs automatically)

If it fails, check:
- iOS directory exists: `ls ios/App/Podfile`
- Pod specs are up to date: `pod repo update`

### Android Build Fails: "Keystore not found"

**Solution**: Upload keystore to Codemagic

```bash
# In Codemagic Settings:
# Code signing → Android Keystores → Add keystore
```

### Build Fails: "dist directory not found"

**Solution**: Ensure web build completes

```bash
# Local test:
npm run build
ls dist/
```

## Publishing

### Publish to App Store (iOS)

1. Create App Store Connect record at [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. In Codemagic, add App Store Connect credentials to Code signing
3. Modify `codemagic.yaml` to automatically submit build to App Store

### Publish to Google Play (Android)

1. Create Google Play Store record at [play.google.com/console](https://play.google.com/console)
2. In Codemagic, add Google Play credentials
3. Modify `codemagic.yaml` to automatically submit build to Google Play

## Support

- Codemagic Docs: [docs.codemagic.io](https://docs.codemagic.io)
- Capacitor Docs: [capacitorjs.com](https://capacitorjs.com)
- GitHub Issues: [github.com/mackshema/client_1_billing_system/issues](https://github.com/mackshema/client_1_billing_system/issues)
