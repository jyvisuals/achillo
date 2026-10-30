#!/bin/sh
# Xcode Cloud: the web bundle and Capacitor plugin sources aren't in git, so build them before Xcode resolves packages.
set -e
cd "$CI_PRIMARY_REPOSITORY_PATH/app"
export HOMEBREW_NO_AUTO_UPDATE=1 HOMEBREW_NO_INSTALL_CLEANUP=1
command -v node >/dev/null && [ "$(node -p 'process.versions.node.split(".")[0]')" -ge 22 ] || brew install node
node -v
npm ci
node build.js
npx cap sync ios
# Version every Xcode Cloud build: 1.2.<build number>, so TestFlight and the app's diagnostics show which release you have.
cd "$CI_PRIMARY_REPOSITORY_PATH/app/ios/App"
V="1.2.${CI_BUILD_NUMBER:-0}"
sed -i '' "s/MARKETING_VERSION = [^;]*;/MARKETING_VERSION = $V;/" App.xcodeproj/project.pbxproj
echo "Version $V"
# TestFlight's "What to Test" note comes from app/notes.txt
mkdir -p TestFlight
{ echo "Achilló $V"; cat "$CI_PRIMARY_REPOSITORY_PATH/app/notes.txt" 2>/dev/null; } > TestFlight/WhatToTest.en-US.txt
