#!/bin/bash
# Builds Achilló and publishes it to the AltStore source (github.com/jyvisuals/achillo).
# After this runs, AltStore on the phone shows an Update button within a few minutes.
# Needs: Xcode (with the iOS platform installed) and git access to the achillo repo.
set -eo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
SRC="$ROOT/ios/App"
FEED="$ROOT/../achillo"                      # clone of the source repo, next to this folder
FEED_URL="https://github.com/jyvisuals/achillo.git"
RAW="https://raw.githubusercontent.com/jyvisuals/achillo/main"

# ---- version: 1.0.N, N counts up every build ----
N=$(( $(cat "$ROOT/.version" 2>/dev/null || echo 0) + 1 ))
V="1.0.$N"
NOTES="$(cat "$ROOT/notes.txt" 2>/dev/null || echo "Build $V")"

echo "→ Achilló $V"
cd "$SRC"
echo "→ resolving Swift packages"
xcodebuild -resolvePackageDependencies -project App.xcodeproj -scheme App -destination 'generic/platform=iOS' >/dev/null
echo "→ building"
xcodebuild -project App.xcodeproj -scheme App -configuration Release -destination 'generic/platform=iOS' \
  -derivedDataPath build CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO CODE_SIGN_IDENTITY="" \
  MARKETING_VERSION="$V" CURRENT_PROJECT_VERSION="$N" \
  -quiet build 2>&1 | tee build.log
APP=$(find build/Build/Products/Release-iphoneos -maxdepth 1 -name "*.app" | head -1)
[ -n "$APP" ] || { echo "no .app produced"; exit 1; }
rm -rf Payload && mkdir Payload && cp -R "$APP" Payload/
IPA="$ROOT/Achillo-$V.ipa"
rm -f "$ROOT"/Achillo-*.ipa "$ROOT/Achilles.ipa"
zip -qr "$IPA" Payload && rm -rf Payload
cp "$IPA" "$ROOT/Achilles.ipa"               # stable name for manual installs
echo "$N" > "$ROOT/.version"
echo "✓ built $IPA"

# ---- publish to the AltStore source ----
if [ ! -d "$FEED/.git" ]; then
  echo "→ cloning the source repo"
  git clone -q "$FEED_URL" "$FEED"
fi
cd "$FEED"
git pull -q --rebase origin main || true
mkdir -p ipa
cp "$IPA" "ipa/Achillo-$V.ipa"

SIZE=$(stat -f%z "ipa/Achillo-$V.ipa")
DATE=$(date -u +%Y-%m-%dT%H:%M:%SZ)
python3 - "$V" "$N" "$SIZE" "$DATE" "$RAW" "$NOTES" <<'EOF'
import json,sys
v,n,size,date,raw,notes=sys.argv[1:7]
f=json.load(open('apps.json'))
app=f['apps'][0]
entry={"version":v,"buildVersion":n,"date":date,"localizedDescription":notes,
       "downloadURL":f"{raw}/ipa/Achillo-{v}.ipa","size":int(size),"minOSVersion":"15.0"}
app['versions']=[entry]+[x for x in app.get('versions',[]) if x['version']!=v]
app['versions']=app['versions'][:3]
# keep only the IPAs still listed
import os,glob
keep={os.path.basename(x['downloadURL']) for x in app['versions']}
for p in glob.glob('ipa/Achillo-*.ipa'):
    if os.path.basename(p) not in keep: os.remove(p)
# mirror top-level fields older AltStore builds read
app['version']=v; app['versionDate']=date; app['versionDescription']=notes
app['downloadURL']=entry['downloadURL']; app['size']=int(size)
json.dump(f,open('apps.json','w'),indent=2,ensure_ascii=False)
EOF
git add -A
git -c user.name="Achilló build" -c user.email="jon@jyvisuals.com" commit -qm "Achilló $V" || true
if git push -q origin main; then
  echo "✓ published $V — AltStore shows Update in a few minutes (pull to refresh in My Apps)."
else
  echo "✗ build is done but the push to GitHub failed (sign-in?). Tell Claude; the files are staged in $FEED."
  exit 1
fi
