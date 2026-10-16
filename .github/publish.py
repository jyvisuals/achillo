#!/usr/bin/env python3
"""Add a built IPA to the AltStore feed. Usage: publish.py <version> <build> <ipa-path> <notes-file>"""
import json, sys, os, glob, shutil, datetime
v, n, ipa, notes_file = sys.argv[1:5]
RAW = "https://raw.githubusercontent.com/jyvisuals/achillo/main"
notes = open(notes_file).read().strip() if os.path.exists(notes_file) else f"Build {v}"
os.makedirs("ipa", exist_ok=True)
dest = f"ipa/Achillo-{v}.ipa"
if os.path.abspath(ipa) != os.path.abspath(dest): shutil.copy(ipa, dest)
size = os.path.getsize(dest)
date = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
f = json.load(open("apps.json"))
app = f["apps"][0]
entry = {"version": v, "buildVersion": n, "date": date, "localizedDescription": notes,
         "downloadURL": f"{RAW}/ipa/Achillo-{v}.ipa", "size": size, "minOSVersion": "15.0"}
app["versions"] = ([entry] + [x for x in app.get("versions", []) if x["version"] != v])[:3]
keep = {os.path.basename(x["downloadURL"]) for x in app["versions"]}
for p in glob.glob("ipa/Achillo-*.ipa"):
    if os.path.basename(p) not in keep: os.remove(p)
app.update(version=v, versionDate=date, versionDescription=notes, downloadURL=entry["downloadURL"], size=size)
json.dump(f, open("apps.json", "w"), indent=2, ensure_ascii=False)
print(f"published {v} ({size} bytes)")
