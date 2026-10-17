// Builds www/ from the tracker page:
//   1. copies src/achilles-tracker.html -> www/index.html, injecting the native bridge script
//   2. bundles src/native.js (+ Capacitor plugins) -> www/native.js
// Run: node build.js   (then: npx cap sync ios)
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const SRC = path.join(__dirname, 'src', 'achilles-tracker.html');
const OUT = path.join(__dirname, 'www');
fs.mkdirSync(OUT, { recursive: true });

// The artifact file is a fragment (the artifact host wraps it in a document); wrap it here.
let frag = fs.readFileSync(SRC, 'utf8');
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
<script>window.__nativeApp=true;</script>
<script src="native.js"></script>
<style>html{background:#e7ebe5}@media(prefers-color-scheme:dark){html{background:#0d1512}}.wrap{padding-top:calc(14px + env(safe-area-inset-top))!important;padding-bottom:calc(104px + env(safe-area-inset-bottom))!important}html,body{touch-action:manipulation;-webkit-text-size-adjust:100%}button,a,summary{touch-action:manipulation}input,select,textarea{font-size:16px!important}</style>
</head>
<body>
${frag}
</body>
</html>
`;
fs.writeFileSync(path.join(OUT, 'index.html'), html);
for (const f of ['icon.png', 'icon-512.png']) {
  const p = path.join(__dirname, 'src', f);
  if (fs.existsSync(p)) fs.copyFileSync(p, path.join(OUT, f));
}

esbuild.buildSync({
  entryPoints: [path.join(__dirname, 'src', 'native.js')],
  bundle: true,
  format: 'iife',
  target: ['safari16'],
  outfile: path.join(OUT, 'native.js'),
  minify: false,
  logLevel: 'info',
});
console.log('www/ built');
