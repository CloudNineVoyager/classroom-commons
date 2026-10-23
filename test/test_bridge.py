import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import threading
import time
import unittest
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "skills" / "classroom-commons" / "scripts" / "workbench.py"
spec = importlib.util.spec_from_file_location("workbench", SCRIPT)
bridge = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bridge)
PROJECT = {"version": 1, "title": "Test", "duration": 20, "groups": [], "resources": [], "tasks": []}


class BridgeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temporary = tempfile.TemporaryDirectory()
        cls.folder = Path(cls.temporary.name)
        subprocess.run([sys.executable, str(SCRIPT), "launch", "--workspace", str(cls.folder), "--no-browser"], check=True, capture_output=True)
        cls.session = bridge.read(cls.folder, "session.json")
        cls.base = cls.session["url"].split("#")[0]

    @classmethod
    def tearDownClass(cls):
        bridge.call(cls.session, "/stop", {})
        cls.temporary.cleanup()

    def setUp(self):
        for name in ("course.json", "project.json", "request.json", "reply.json"):
            (self.folder / name).unlink(missing_ok=True)

    def test_protected_endpoints_and_origin(self):
        with self.assertRaises(ValueError):
            bridge.call({"url": "https://example.org/", "token": "test"}, "/state")
        with urllib.request.urlopen(self.base) as response:
            self.assertIn(b"Classroom Commons", response.read())
        for headers in ({}, {"X-Classroom-Token": self.session["token"], "Origin": "https://example.org"}):
            request = urllib.request.Request(self.base + "state", headers=headers)
            with self.assertRaises(urllib.error.HTTPError) as caught:
                urllib.request.urlopen(request)
            self.assertEqual(caught.exception.code, 403)
            caught.exception.close()
        with self.assertRaises(urllib.error.HTTPError) as caught:
            bridge.call(self.session, "/save", {"project": {"version": 2}})
        self.assertEqual(caught.exception.code, 400)
        caught.exception.close()

    def test_matching_delivery_and_stale_request_rejection(self):
        bridge.call(self.session, "/request", {"id": "new", "notes": "Use stones", "project": PROJECT})
        candidate = self.folder / "candidate.json"
        candidate.write_text(json.dumps(PROJECT), encoding="utf-8")
        command = [sys.executable, str(SCRIPT), "deliver", "--workspace", str(self.folder), "--project", str(candidate), "--request-id"]
        stale = subprocess.run(command + ["old"], capture_output=True)
        self.assertNotEqual(stale.returncode, 0)
        self.assertIsNone(bridge.call(self.session, "/reply"))
        result = subprocess.run(command + ["new"], capture_output=True, text=True, check=True)
        self.assertEqual(json.loads(result.stdout)["constraint_checks"], "pending_in_workbench")
        self.assertEqual(bridge.call(self.session, "/reply")["requestId"], "new")

    def test_save_and_launcher_resume_without_losing_project(self):
        bridge.call(self.session, "/save", {"project": {**PROJECT, "apiKey": "discard me"}})
        self.assertNotIn("apiKey", bridge.read(self.folder, "course.json")["project"])
        self.assertFalse((self.folder / "project.json").exists())
        output = subprocess.run([sys.executable, str(SCRIPT), "launch", "--workspace", str(self.folder), "--no-browser"], capture_output=True, text=True, check=True)
        self.assertEqual(json.loads(output.stdout)["url"], self.session["url"])
        self.assertEqual(bridge.call(self.session, "/state")["project"]["title"], "Test")

    def test_invalid_request_objects_leave_saved_course_untouched(self):
        bridge.call(self.session, "/save", {"project": PROJECT})
        original = (self.folder / "course.json").read_bytes()
        for route, value in (("/request", []), ("/request", "text"), ("/save", {"project": {"version": 1, "groups": [], "resources": [], "tasks": []}})):
            with self.subTest(route=route, value=value):
                with self.assertRaises(urllib.error.HTTPError) as caught:
                    bridge.call(self.session, route, value)
                self.assertEqual(caught.exception.code, 400)
                caught.exception.close()
                self.assertEqual((self.folder / "course.json").read_bytes(), original)

    def test_legacy_project_save_replaces_authoritative_course_and_clears_schedule(self):
        course = {"format": "classroom-commons-course", "fileVersion": 1, "project": PROJECT,
                  "schedule": [{"taskId": "earlier-task", "start": 0, "end": 5}]}
        bridge.call(self.session, "/save", {"course": course})
        replacement = {**PROJECT, "title": "Replacement lesson"}
        bridge.call(self.session, "/save", {"project": replacement})
        state = bridge.call(self.session, "/state")
        self.assertEqual(state["project"], replacement)
        self.assertEqual(state["course"]["schedule"], [])
        self.assertEqual(bridge.read(self.folder, "course.json"), state["course"])
        self.assertFalse((self.folder / "project.json").exists())

    def test_course_save_keeps_unfinished_fields_and_rejects_invalid_shapes(self):
        for duration in (None, 12.5):
            course = {"format": "classroom-commons-course", "fileVersion": 1,
                      "project": {**PROJECT, "duration": duration}, "schedule": []}
            bridge.call(self.session, "/save", {"course": course})
            self.assertEqual(bridge.call(self.session, "/state")["course"], course)
        original = (self.folder / "course.json").read_bytes()
        for invalid in ([], {**course, "project": []}, {**course, "schedule": [None]},
                        {**course, "schedule": [{"taskId": "a", "start": None, "end": 3}]},
                        {**course, "project": {**PROJECT, "groups": [{}] * 7}},
                        {**course, "project": {**PROJECT, "tasks": [None]}},
                        {**course, "project": {**PROJECT, "duration": True}},
                        {**course, "project": {**PROJECT, "duration": 10 ** 500}}):
            with self.subTest(invalid=invalid):
                with self.assertRaises(urllib.error.HTTPError) as caught:
                    bridge.call(self.session, "/save", {"course": invalid})
                self.assertEqual(caught.exception.code, 400)
                caught.exception.close()
                self.assertEqual((self.folder / "course.json").read_bytes(), original)

    def test_damaged_authoritative_course_is_preserved_on_read_and_save(self):
        bridge.write(self.folder, "project.json", PROJECT)
        for damaged in (b"{unfinished", b"null", b"[]", b'{"format":"unknown"}', b"x" * (bridge.LIMIT + 1)):
            with self.subTest(damaged_bytes=len(damaged)):
                (self.folder / "course.json").write_bytes(damaged)
                for route, value in (("/state", None), ("/save", {"project": PROJECT}),
                                     ("/save", {"course": {"format": "classroom-commons-course", "fileVersion": 1, "project": PROJECT, "schedule": []}})):
                    with self.assertRaises(urllib.error.HTTPError) as caught:
                        bridge.call(self.session, route, value)
                    self.assertEqual(caught.exception.code, 409)
                    self.assertEqual(json.load(caught.exception)["file"], "course.json")
                    caught.exception.close()
                    self.assertEqual((self.folder / "course.json").read_bytes(), damaged)

    def test_unreadable_saved_files_report_error_without_modifying_original(self):
        for filename, route in (("project.json", "/state"), ("request.json", "/state"), ("reply.json", "/reply")):
            previous = (self.folder / filename).read_bytes() if (self.folder / filename).exists() else None
            try:
                for invalid in (b"{interrupted", b"[]", b"x" * (bridge.LIMIT + 1)):
                    with self.subTest(filename=filename, invalid_bytes=len(invalid)):
                        (self.folder / filename).write_bytes(invalid)
                        with self.assertRaises(urllib.error.HTTPError) as caught:
                            bridge.call(self.session, route)
                        self.assertEqual(caught.exception.code, 409)
                        error = json.load(caught.exception)
                        caught.exception.close()
                        self.assertEqual(error["file"], filename)
                        self.assertEqual((self.folder / filename).read_bytes(), invalid)
                        self.assertEqual(bridge.call(self.session, "/health")["instance"], self.session["instance"])
            finally:
                if previous is None:
                    (self.folder / filename).unlink(missing_ok=True)
                else:
                    (self.folder / filename).write_bytes(previous)


class LauncherRecoveryTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.folder = Path(self.temporary.name)
        self.sessions = []

    def tearDown(self):
        for session in self.sessions:
            try:
                bridge.call(session, "/stop", {})
            except OSError:
                pass
        # The HTTP response is sent before the server closes and removes its session.
        for _ in range(50):
            if not any(self.folder.rglob("session.json")):
                break
            time.sleep(0.02)
        self.temporary.cleanup()

    def launch(self, folder):
        result = subprocess.run([sys.executable, str(SCRIPT), "launch", "--workspace", str(folder), "--no-browser"], capture_output=True, text=True)
        self.assertEqual(result.returncode, 0,
                         f"Local launcher exited {result.returncode}; stderr:\n{result.stderr}\nstdout:\n{result.stdout}")
        session = bridge.read(folder, "session.json")
        self.sessions.append(session)
        self.assertEqual(json.loads(result.stdout)["url"], session["url"])
        return session

    def test_damaged_or_non_object_session_can_reopen_saved_lesson(self):
        for name, content in (("damaged", "{interrupted"), ("array", "[]"), ("number", "42")):
            with self.subTest(session=name):
                folder = self.folder / name
                folder.mkdir()
                (folder / "session.json").write_text(content, encoding="utf-8")
                (folder / "project.json").write_text(json.dumps(PROJECT), encoding="utf-8-sig")
                session = self.launch(folder)
                self.assertEqual(bridge.call(session, "/state")["project"], PROJECT)

    def test_copied_workspace_starts_its_own_bridge(self):
        original = self.folder / "original"
        original.mkdir()
        first = self.launch(original)
        bridge.call(first, "/save", {"project": {**PROJECT, "title": "Original lesson"}})
        copied = self.folder / "copied"
        copied.mkdir()
        bridge.write(copied, "session.json", first)
        bridge.write(copied, "project.json", {**PROJECT, "title": "Copied lesson"})
        second = self.launch(copied)
        self.assertNotEqual(first["instance"], second["instance"])
        self.assertEqual(bridge.call(first, "/state")["project"]["title"], "Original lesson")
        self.assertEqual(bridge.call(second, "/state")["project"]["title"], "Copied lesson")

    @unittest.skipUnless(sys.platform == "win32", "Windows file sharing semantics")
    def test_copied_session_can_start_while_an_existing_reader_finishes(self):
        original = self.folder / "original"
        original.mkdir()
        first = self.launch(original)
        copied = self.folder / "copied"
        copied.mkdir()
        bridge.write(copied, "session.json", first)
        reader = (copied / "session.json").open("rb")
        finished, observed_snapshot = threading.Event(), threading.Event()

        def finish_reading():
            try:
                deadline = time.monotonic() + 5
                while not finished.is_set() and time.monotonic() < deadline:
                    if any(copied.glob("session.json.*.tmp")):
                        observed_snapshot.set()
                        time.sleep(0.15)
                        return
                    finished.wait(0.01)
            finally:
                reader.close()

        reading = threading.Thread(target=finish_reading, daemon=True)
        reading.start()
        try:
            second = self.launch(copied)
        finally:
            finished.set()
            reading.join(timeout=6)
            reader.close()
        self.assertTrue(observed_snapshot.is_set(), "Reader must overlap the real startup snapshot")
        self.assertNotEqual(first["instance"], second["instance"])
        self.assertEqual(bridge.call(second, "/health")["workspace"], str(copied))

    def test_stopping_a_copied_session_does_not_stop_original_workspace(self):
        original = self.folder / "original"
        original.mkdir()
        first = self.launch(original)
        copied = self.folder / "copied"
        copied.mkdir()
        bridge.write(copied, "session.json", first)
        subprocess.run([sys.executable, str(SCRIPT), "stop", "--workspace", str(copied)], check=True, capture_output=True)
        self.assertEqual(bridge.call(first, "/health")["instance"], first["instance"])
        (copied / "session.json").unlink()

    def test_launch_does_not_destroy_a_damaged_course(self):
        (self.folder / "project.json").write_bytes(b"{unfinished")
        session = self.launch(self.folder)
        with self.assertRaises(urllib.error.HTTPError) as caught:
            bridge.call(session, "/state")
        self.assertEqual(caught.exception.code, 409)
        caught.exception.close()
        self.assertEqual((self.folder / "project.json").read_bytes(), b"{unfinished")

    def test_complete_course_schedule_survives_stop_and_new_server(self):
        first = self.launch(self.folder)
        course = json.loads((ROOT / "examples/maths-zh.course.json").read_text(encoding="utf-8"))
        self.assertTrue(course["schedule"])
        bridge.call(first, "/save", {"course": course})
        bridge.call(first, "/stop", {})
        for _ in range(100):
            if not (self.folder / "session.json").exists():
                break
            time.sleep(0.02)
        self.assertFalse((self.folder / "session.json").exists())
        self.sessions.remove(first)
        # A malformed legacy file cannot override the authoritative complete course.
        (self.folder / "project.json").write_bytes(b"{old-and-incomplete")
        second = self.launch(self.folder)
        self.assertNotEqual(first["instance"], second["instance"])
        state = bridge.call(second, "/state")
        self.assertEqual(state["course"], course)
        self.assertEqual(state["project"], course["project"])


if __name__ == "__main__":
    unittest.main()
