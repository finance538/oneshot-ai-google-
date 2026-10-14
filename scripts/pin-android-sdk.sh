#!/usr/bin/env bash
# Runs in CI after `npx cap add android` (see .github/workflows/build-apk.yml).
#  1. Pins the Android SDK versions Capacitor 8 needs.
#  2. Replaces the default Capacitor launcher icons with the oneShot brand mark
#     (resources/android/*.png generated from public/icons/icon-512.png).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

# ── 1. SDK versions ───────────────────────────────────────────────────────────
cat > android/variables.gradle <<'GRADLE'
ext {
  minSdkVersion = 23
  compileSdkVersion = 36
  targetSdkVersion = 36
  androidxActivityVersion = '1.11.0'
  androidxAppCompatVersion = '1.7.0'
  androidxCoordinatorLayoutVersion = '1.2.0'
  androidxCoreVersion = '1.17.0'
  androidxFragmentVersion = '1.8.9'
  coreSplashScreenVersion = '1.0.1'
  androidxWebkitVersion = '1.14.0'
  junitVersion = '4.13.2'
  androidxJunitVersion = '1.3.0'
  androidxEspressoCoreVersion = '3.7.0'
  cordovaAndroidVersion = '10.1.1'
}
GRADLE
echo "✓ variables.gradle pinned (compileSdk 36 / targetSdk 36)"

# ── 2. App label + launcher icons ─────────────────────────────────────────────
STRINGS="android/app/src/main/res/values/strings.xml"
if [ -f "$STRINGS" ] && ! grep -q 'oneShot Hub' "$STRINGS"; then
  sed -i 's|<string name="app_name">[^<]*</string>|<string name="app_name">oneShot Hub</string>|' "$STRINGS"
  echo "✓ app_name set to oneShot Hub"
fi

RES="resources/android"
if [ -d "$RES" ]; then
  installed=0
  for f in "$RES"/*.png; do
    [ -e "$f" ] || continue
    base="$(basename "$f")"
    rest="${base#mipmap-}"         # mdpi-ic_launcher.png
    density="mipmap-${rest%%-*}"   # mipmap-mdpi
    kind="${rest#*-}"              # ic_launcher.png | ic_launcher_foreground.png
    dest="android/app/src/main/res/$density"
    mkdir -p "$dest"
    cp "$f" "$dest/$kind"
    installed=$((installed+1))
  done
  echo "✓ installed $installed launcher icon(s)"
else
  echo "! no $RES directory — keeping default icons"
fi

# Replace the adaptive-icon background colour with the app's dark chrome
BG_XML="android/app/src/main/res/values/ic_launcher_background.xml"
if [ -f "$BG_XML" ]; then
  cat > "$BG_XML" <<'XML'
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#0a0b0e</color>
</resources>
XML
  echo "✓ adaptive icon background set to #0a0b0e"
fi

echo "Android project prepared."
