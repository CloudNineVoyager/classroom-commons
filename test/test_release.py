import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import posixpath
import subprocess
import sys
import tempfile
import time
import unittest
from urllib.parse import unquote, urlsplit
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parents[1]


class HTMLReferences(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self.resources = []
        self.scripts = 0

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if tag == "a" and values.get("href"):
            self.links.append(values["href"])
        if tag == "script":
            self.scripts += 1
        if tag in {"img", "script", "iframe", "source", "audio", "video"} and values.get("src"):
            self.resources.append(values["src"])
        if tag == "link" and values.get("href"):
            self.resources.append(values["href"])


class ReleasePreflightTests(unittest.TestCase):
    def test_packaging_rejects_mismatched_workbench_before_writing_archives(self):
        with tempfile.TemporaryDirectory() as temporary:
            folder = Path(temporary)
            for name in ("scripts", "releases", "skills/classroom-commons/assets"):
                (folder / name).mkdir(parents=True)
            script = folder / "scripts/release.py"
            script.write_bytes((ROOT / "scripts/release.py").read_bytes())
            (folder / "releases/Classroom-Commons.html").write_text("new build", encoding="utf-8")
            (folder / "skills/classroom-commons/assets/workbench.html").write_text("old build", encoding="utf-8")
            result = subprocess.run([sys.executable, "-X", "utf8", str(script)], cwd=folder, capture_output=True, text=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("Workbench and Skill asset do not match", result.stderr)
            self.assertFalse(list((folder / "releases").glob("*.zip")))


class ReleaseTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        subprocess.run([sys.executable, str(ROOT / "scripts/release.py")], cwd=ROOT, check=True, capture_output=True)

    def test_workbuddy_package_has_required_metadata_and_all_resources(self):
        with zipfile.ZipFile(ROOT / "releases/classroom-commons-workbuddy.zip") as package:
            self.assertIsNone(package.testzip())
            skill = package.read("classroom-commons/SKILL.md").decode("utf-8")
            frontmatter, body = skill.split("---", 2)[1:]
            fields = {key: json.loads(value) for key, value in (line.split(": ", 1) for line in frontmatter.strip().splitlines())}
            required = {"name", "description", "description_zh", "description_en", "version", "author"}
            self.assertTrue(required.issubset(fields))
            self.assertEqual(fields["display_name"], "课堂共作")
            self.assertIn("课堂", fields["description"])
            canonical = (ROOT / "skills/classroom-commons/SKILL.md").read_text(encoding="utf-8").split("---", 2)[2]
            self.assertEqual(body, canonical)
            for relative in ("assets/workbench.html", "scripts/workbench.py", "references/project-format.md"):
                self.assertEqual(package.read("classroom-commons/" + relative), (ROOT / "skills/classroom-commons" / relative).read_bytes())

    def test_generic_skill_entrypoint_is_not_replaced_with_host_specific_fields(self):
        with zipfile.ZipFile(ROOT / "releases/classroom-commons-skill.zip") as package:
            self.assertEqual(package.read("classroom-commons/SKILL.md"), (ROOT / "skills/classroom-commons/SKILL.md").read_bytes())
            self.assertFalse(any("__pycache__" in name for name in package.namelist()))
            self.assertEqual(package.read("classroom-commons/THIRD_PARTY_NOTICES.txt"), (ROOT / "THIRD_PARTY_NOTICES.txt").read_bytes())

    def test_mission_and_maintenance_ship_with_teacher_and_source_bundles(self):
        with zipfile.ZipFile(ROOT / "releases/Classroom-Commons-portable.zip") as teacher, zipfile.ZipFile(ROOT / "releases/Classroom-Commons-source.zip") as source:
            for name in ("MISSION.md", "MAINTENANCE.md", "CHANGELOG.md"):
                expected = (ROOT / name).read_bytes()
                self.assertEqual(teacher.read(name), expected)
                self.assertEqual(source.read("classroom-commons/" + name), expected)
            for lang in ("en", "zh"):
                name = "no-materials-" + lang + ".course.json"
                self.assertEqual(teacher.read("示例课程/" + name), (ROOT / "examples" / name).read_bytes())

    def test_teacher_bundle_opens_with_a_plain_html_guide(self):
        with zipfile.ZipFile(ROOT / "releases/Classroom-Commons-portable.zip") as package:
            self.assertIsNone(package.testzip())
            names = package.namelist()
            self.assertIn("老师先看这里.html", names)
            self.assertIn("Classroom-Commons.html", names)
            self.assertIn("技能安装包/classroom-commons-workbuddy.zip", names)
            self.assertNotIn("package.json", names)
            self.assertEqual(package.read("THIRD_PARTY_NOTICES.txt"), (ROOT / "THIRD_PARTY_NOTICES.txt").read_bytes())
            guide = package.read("老师先看这里.html").decode("utf-8")
            self.assertIn('href="Classroom-Commons.html"', guide)
            self.assertIn("不买", guide)

    def test_portable_bundle_contains_current_workbench_and_installers(self):
        with zipfile.ZipFile(ROOT / "releases/Classroom-Commons-portable.zip") as package:
            self.assertEqual(package.read("Classroom-Commons.html"), (ROOT / "releases/Classroom-Commons.html").read_bytes())
            for installer in ("classroom-commons-skill.zip", "classroom-commons-workbuddy.zip"):
                self.assertEqual(package.read("技能安装包/" + installer), (ROOT / "releases" / installer).read_bytes())
            self.assertEqual(package.read("老师先看这里.html"), (ROOT / "guides/老师先看这里.html").read_bytes())

    def test_all_teacher_guides_are_present_and_local_html_targets_resolve(self):
        with zipfile.ZipFile(ROOT / "releases/Classroom-Commons-portable.zip") as package:
            names = set(package.namelist())
            for guide in (ROOT / "guides").iterdir():
                if guide.is_file():
                    self.assertEqual(package.read(guide.name), guide.read_bytes(), guide.name)
            for name in names:
                if not name.endswith(".html"):
                    continue
                page = HTMLReferences()
                page.feed(package.read(name).decode("utf-8"))
                for reference in page.links + page.resources:
                    with self.subTest(page=name, reference=reference[:80]):
                        url = urlsplit(reference)
                        if reference in page.resources:
                            self.assertNotIn(url.scheme, {"http", "https"}, "An offline page fetches a remote asset")
                        if url.scheme or not url.path:
                            continue
                        target = posixpath.normpath(posixpath.join(posixpath.dirname(name), unquote(url.path)))
                        self.assertFalse(target.startswith("../"))
                        self.assertIn(target, names)
                if name == "老师先看这里.html":
                    self.assertEqual(page.scripts, 0)

    def test_source_archive_readme_links_and_images_resolve(self):
        import re

        with zipfile.ZipFile(ROOT / "releases/Classroom-Commons-source.zip") as package:
            names = set(package.namelist())
            for name in ("README.md", "README.zh-CN.md"):
                source_name = "classroom-commons/" + name
                content = package.read(source_name).decode("utf-8")
                for reference in re.findall(r"\[[^\]]+\]\(([^\s)]+)\)", content):
                    url = urlsplit(reference)
                    if not url.scheme and url.path:
                        target = posixpath.normpath(posixpath.join("classroom-commons", unquote(url.path)))
                        self.assertIn(target, names, (name, reference))

    def test_workbench_is_identical_across_teacher_and_skill_packages(self):
        content = (ROOT / "releases/Classroom-Commons.html").read_bytes()
        self.assertEqual(content, (ROOT / "skills/classroom-commons/assets/workbench.html").read_bytes())
        for filename in ("classroom-commons-skill.zip", "classroom-commons-workbuddy.zip"):
            with self.subTest(package=filename), zipfile.ZipFile(ROOT / "releases" / filename) as package:
                self.assertEqual(package.read("classroom-commons/assets/workbench.html"), content)

    def test_release_manifest_matches_all_delivered_artifacts(self):
        manifest = json.loads((ROOT / "releases/release-manifest.json").read_text(encoding="utf-8"))
        metadata = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
        self.assertEqual(manifest["version"], metadata["version"])
        names = [artifact["file"] for artifact in manifest["artifacts"]]
        self.assertEqual(len(names), len(set(names)))
        self.assertEqual(set(names), {"Classroom-Commons.html", "老师先看这里.html", "Classroom-Commons-portable.zip", "classroom-commons-skill.zip", "classroom-commons-workbuddy.zip", "Classroom-Commons-source.zip"})
        for artifact in manifest["artifacts"]:
            with self.subTest(artifact=artifact["file"]):
                self.assertEqual(Path(artifact["file"]).name, artifact["file"])
                content = (ROOT / "releases" / artifact["file"]).read_bytes()
                self.assertEqual(artifact["bytes"], len(content))
                self.assertEqual(artifact["sha256"], hashlib.sha256(content).hexdigest())

    def test_source_archive_excludes_private_data_and_teacher_examples_are_readable(self):
        with zipfile.ZipFile(ROOT / "releases/Classroom-Commons-source.zip") as source:
            self.assertIsNone(source.testzip())
            for name in source.namelist():
                with self.subTest(source_file=name):
                    parts = name.split("/")
                    self.assertEqual(parts[0], "classroom-commons")
                    self.assertFalse({".qa", "node_modules", "releases", "__pycache__", ".git", ".."}.intersection(parts))
            for name in ("app/project-file.mjs", "LICENSE", "package.json"):
                self.assertEqual(source.read("classroom-commons/" + name), (ROOT / name).read_bytes())
        with zipfile.ZipFile(ROOT / "releases/Classroom-Commons-portable.zip") as teacher:
            examples = [file for file in (ROOT / "examples").iterdir() if file.is_file()]
            self.assertTrue(examples)
            courses = []
            for example in examples:
                with self.subTest(example=example.name):
                    content = teacher.read("示例课程/" + example.name)
                    self.assertEqual(content, example.read_bytes())
                    if example.name.endswith(".course.json"):
                        course = json.loads(content.decode("utf-8-sig"))
                        self.assertEqual(course["format"], "classroom-commons-course")
                        self.assertEqual(course["fileVersion"], 1)
                        self.assertTrue(course["project"]["groups"])
                        self.assertTrue(course["project"]["tasks"])
                        self.assertTrue(course["schedule"])
                        courses.append(example.name)
            self.assertIn("maths-en.course.json", courses)
            self.assertIn("maths-zh.course.json", courses)

    def test_extracted_workbuddy_package_runs_without_installed_dependencies(self):
        with tempfile.TemporaryDirectory() as temporary:
            folder = Path(temporary)
            with zipfile.ZipFile(ROOT / "releases/classroom-commons-workbuddy.zip") as package:
                package.extractall(folder)
            script = folder / "classroom-commons/scripts/workbench.py"
            workspace = folder / "我的备课"
            command = [sys.executable, "-I", str(script)]
            subprocess.run(command + ["launch", "--workspace", str(workspace), "--no-browser"], check=True, capture_output=True)
            session = json.loads((workspace / "session.json").read_text(encoding="utf-8"))
            base = session["url"].split("#")[0]

            def call(route, data=None):
                request = urllib.request.Request(base.rstrip("/") + route,
                    headers={"X-Classroom-Token": session["token"], "Content-Type": "application/json"},
                    data=json.dumps(data).encode("utf-8") if data is not None else None)
                with urllib.request.urlopen(request, timeout=2) as response:
                    return json.load(response)

            try:
                with urllib.request.urlopen(base, timeout=2) as response:
                    self.assertEqual(response.read(), (folder / "classroom-commons/assets/workbench.html").read_bytes())
                project = {"version": 1, "title": "数的组成", "duration": 20, "groups": [], "resources": [], "tasks": []}
                call("/request", {"id": "packaged-request", "notes": "保留现有材料", "project": project})
                candidate = workspace / "草稿.json"
                candidate.write_text(json.dumps(project, ensure_ascii=False), encoding="utf-8")
                result = subprocess.run(command + ["deliver", "--workspace", str(workspace), "--project", str(candidate), "--request-id", "packaged-request"], check=True, capture_output=True, text=True)
                self.assertEqual(json.loads(result.stdout)["status"], "delivered_for_teacher_review")
                self.assertEqual(call("/reply")["project"]["title"], "数的组成")
                self.assertEqual(call("/state")["request"]["notes"], "保留现有材料")
            finally:
                subprocess.run(command + ["stop", "--workspace", str(workspace)], check=True, capture_output=True)
                for _ in range(50):
                    if not (workspace / "session.json").exists():
                        break
                    time.sleep(0.02)


if __name__ == "__main__":
    unittest.main()
