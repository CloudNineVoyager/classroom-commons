"""Package already-built artifacts; Python standard library only."""
from pathlib import Path
import json
import shutil
import hashlib
import zipfile

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "releases"
SKILL = ROOT / "skills" / "classroom-commons"
workbench = OUT / "Classroom-Commons.html"
skill_workbench = SKILL / "assets/workbench.html"
if not workbench.is_file() or not skill_workbench.is_file():
    raise SystemExit("Run npm run build first")
if workbench.read_bytes() != skill_workbench.read_bytes():
    raise SystemExit("Workbench and Skill asset do not match. Run npm run build before packaging.")
shutil.copyfile(ROOT / "guides/老师先看这里.html", OUT / "老师先看这里.html")

metadata = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
workbuddy = json.loads((ROOT / "adapters/workbuddy/frontmatter.json").read_text(encoding="utf-8"))
workbuddy = {"name": "classroom-commons", **workbuddy, "version": metadata["version"], "author": metadata["author"]}
body = (SKILL / "SKILL.md").read_text(encoding="utf-8").split("---", 2)[2]
workbuddy_skill = "---\n" + "\n".join(key + ": " + json.dumps(value, ensure_ascii=False) for key, value in workbuddy.items()) + "\n---" + body

for filename, skill_override in (("classroom-commons-skill.zip", None), ("classroom-commons-workbuddy.zip", workbuddy_skill)):
    with zipfile.ZipFile(OUT / filename, "w", zipfile.ZIP_DEFLATED) as package:
        for file in SKILL.rglob("*"):
            if file.is_file() and "__pycache__" not in file.parts:
                target = str(file.relative_to(SKILL.parent)).replace("\\", "/")
                if file.name == "SKILL.md" and skill_override:
                    package.writestr(target, skill_override)
                else:
                    package.write(file, target)
        package.write(ROOT / "LICENSE", "classroom-commons/LICENSE.txt")
        package.write(ROOT / "THIRD_PARTY_NOTICES.txt", "classroom-commons/THIRD_PARTY_NOTICES.txt")

with zipfile.ZipFile(OUT / "Classroom-Commons-portable.zip", "w", zipfile.ZIP_DEFLATED) as package:
    package.write(OUT / "Classroom-Commons.html", "Classroom-Commons.html")
    for name in ("classroom-commons-skill.zip", "classroom-commons-workbuddy.zip"):
        package.write(OUT / name, "技能安装包/" + name)
    package.write(ROOT / "LICENSE", "LICENSE")
    package.write(ROOT / "THIRD_PARTY_NOTICES.txt", "THIRD_PARTY_NOTICES.txt")
    for name in ("MISSION.md", "MAINTENANCE.md", "CHANGELOG.md"):
        package.write(ROOT / name, name)
    for file in (ROOT / "guides").iterdir():
        if file.is_file():
            package.write(file, file.name)
    for file in (ROOT / "examples").iterdir():
        if file.is_file():
            package.write(file, "示例课程/" + file.name)

with zipfile.ZipFile(OUT / "Classroom-Commons-source.zip", "w", zipfile.ZIP_DEFLATED) as package:
    for name in (".gitignore", "LICENSE", "THIRD_PARTY_NOTICES.txt", "README.md", "README.zh-CN.md", "PROJECT_STATE.md", "MISSION.md", "MAINTENANCE.md", "CHANGELOG.md", "package.json", "package-lock.json"):
        package.write(ROOT / name, "classroom-commons/" + name)
    for directory in ("app", "adapters", "examples", "guides", "research", "scripts", "skills", "test"):
        for file in (ROOT / directory).rglob("*"):
            if file.is_file() and "__pycache__" not in file.parts:
                package.write(file, "classroom-commons/" + file.relative_to(ROOT).as_posix())

artifacts = ["Classroom-Commons.html", "老师先看这里.html", "Classroom-Commons-portable.zip", "classroom-commons-skill.zip", "classroom-commons-workbuddy.zip", "Classroom-Commons-source.zip"]
manifest = {"version": metadata["version"], "artifacts": [{"file": name, "bytes": (OUT / name).stat().st_size, "sha256": hashlib.sha256((OUT / name).read_bytes()).hexdigest()} for name in artifacts]}
(OUT / "release-manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
print("Packaged Skill and portable teacher toolkit in releases/")
