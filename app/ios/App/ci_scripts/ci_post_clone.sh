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
