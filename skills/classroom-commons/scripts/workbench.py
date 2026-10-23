"""Local workbench bridge. Python standard library only; never calls an AI API."""
import argparse
import json
import math
import os
from pathlib import Path
import secrets
import subprocess
import sys
import threading
import time
import urllib.request
from urllib.parse import urlsplit
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

LIMIT = 1_000_000
ASSET = Path(__file__).resolve().parents[1] / "assets" / "workbench.html"


def invalid_number(_):
    raise ValueError("JSON numbers must be finite")


def read(folder, name):
    target = folder / name
    if not target.exists():
        return None
    if target.stat().st_size > LIMIT:
        raise ValueError("Saved file exceeds 1 MB")
    return json.loads(target.read_text(encoding="utf-8-sig"), parse_constant=invalid_number)


def write(folder, name, data):
    text = json.dumps(data, ensure_ascii=False, indent=2, allow_nan=False)
    if len(text.encode("utf-8")) > LIMIT:
        raise ValueError("File exceeds 1 MB")
    temporary = folder / (name + "." + secrets.token_hex(6) + ".tmp")
    try:
        temporary.write_text(text, encoding="utf-8")
        # Windows readers briefly prevent replacement; keep the same atomic snapshot.
        for attempt in range(21):
            try:
                temporary.replace(folder / name)
                break
            except PermissionError as error:
                if os.name != "nt" or error.winerror not in (5, 32, 33) or attempt == 20:
                    raise
                time.sleep(0.05)
    finally:
        temporary.unlink(missing_ok=True)


def number(value):
    if not isinstance(value, (int, float)) or isinstance(value, bool):
        return False
    try:
        return math.isfinite(value)
    except OverflowError:
        return False


def project_shape(value, editable=False):
    # Detailed classroom constraints are validated in the workbench before use.
    if not isinstance(value, dict) or value.get("version") != 1:
        raise ValueError("Expected a version 1 project")
    duration = value.get("duration")
    duration_ok = (duration is None or number(duration)) if editable else isinstance(duration, int) and not isinstance(duration, bool)
    if (not isinstance(value.get("title"), str) or len(value["title"]) > 2000
            or "duration" not in value or not duration_ok):
        raise ValueError("Expected a project title and duration")
    for key, maximum in (("groups", 6), ("resources", 30), ("tasks", 24)):
        if (not isinstance(value.get(key), list) or len(value[key]) > maximum
                or not all(isinstance(item, dict) for item in value[key])):
            raise ValueError("Invalid " + key)
    return {key: value[key] for key in ("version", "title", "duration", "groups", "resources", "tasks")}


def course_shape(value):
    # Preserve editor data and a checked schedule together; the browser checks constraints.
    if (not isinstance(value, dict) or value.get("format") != "classroom-commons-course"
            or value.get("fileVersion") != 1):
        raise ValueError("Expected a version 1 course file")
    project = project_shape(value.get("project"), editable=True)
    schedule = value.get("schedule")
    if not isinstance(schedule, list) or len(schedule) > 24:
        raise ValueError("Invalid schedule")
    entries = []
    for entry in schedule:
        if (not isinstance(entry, dict) or not isinstance(entry.get("taskId"), str)
                or not 1 <= len(entry["taskId"]) <= 2000
                or not number(entry.get("start")) or not number(entry.get("end"))):
            raise ValueError("Invalid schedule entry")
        entries.append({key: entry[key] for key in ("taskId", "start", "end")})
    return {"format": "classroom-commons-course", "fileVersion": 1, "project": project, "schedule": entries}


def call(session, route, data=None):
    if (not isinstance(session, dict) or not isinstance(session.get("url"), str)
            or not isinstance(session.get("token"), str)):
        raise ValueError("Expected a local workbench session")
    target = urlsplit(session["url"])
    if (target.scheme != "http" or target.hostname != "127.0.0.1"
            or target.username or target.password or target.query
            or target.path != "/" or not target.port):
        raise ValueError("Expected a loopback workbench session")
    request = urllib.request.Request(
        session["url"].split("#")[0].rstrip("/") + route,
        data=json.dumps(data).encode() if data is not None else None,
        headers={"X-Classroom-Token": session["token"], "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(request, timeout=2) as response:
        return json.load(response)


def matches(session, folder):
    try:
        state = call(session, "/health")
        return (state["instance"] == session["instance"]
                and Path(state["workspace"]).resolve() == folder)
    except (OSError, ValueError, KeyError, TypeError):
        return False


def serve(folder, minutes):
    token, instance = secrets.token_urlsafe(32), secrets.token_hex(16)
    last_active = [time.monotonic()]

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *_):
            pass

        def send(self, status, data):
            body = json.dumps(data, ensure_ascii=False).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def authorized(self):
            origin = "http://" + address
            return (self.headers.get("Host") == address
                    and secrets.compare_digest(self.headers.get("X-Classroom-Token", ""), token)
                    and self.headers.get("Origin", origin) == origin)

        def do_GET(self):
            if self.path == "/" and self.headers.get("Host") == address:
                try:
                    body = ASSET.read_bytes()
                except OSError:
                    self.send(503, {"error": "Workbench file unavailable"})
                    return
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Cache-Control", "no-store")
                self.send_header("X-Frame-Options", "DENY")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
                return
            if not self.authorized():
                self.send(403, {"error": "Local session token required"})
                return
            last_active[0] = time.monotonic()
            if self.path == "/health":
                self.send(200, {"instance": instance, "workspace": str(folder)})
            elif self.path == "/state":
                course = self.saved("course.json")
                if course is False:
                    return
                project = course["project"] if course is not None else self.saved("project.json")
                if project is False:
                    return
                request = self.saved("request.json")
                if request is False:
                    return
                self.send(200, {"instance": instance, "workspace": str(folder), "course": course, "project": project, "request": request})
            elif self.path == "/reply":
                reply = self.saved("reply.json")
                if reply is not False:
                    self.send(200, reply)
            else:
                self.send(404, {"error": "Unknown route"})

        def saved(self, name):
            try:
                value = read(folder, name)
                if value is not None and not isinstance(value, dict):
                    raise ValueError("Expected a saved object")
                if name == "course.json" and (value is not None or (folder / name).exists()):
                    return course_shape(value)
                return value
            except (OSError, ValueError, UnicodeError):
                self.send(409, {"error": "Saved file could not be read; original kept", "file": name})
                return False

        def do_POST(self):
            if not self.authorized():
                self.send(403, {"error": "Local session token required"})
                return
            try:
                length = int(self.headers.get("Content-Length", "0"))
                if not 0 < length <= LIMIT:
                    raise ValueError("Expected JSON smaller than 1 MB")
                value = json.loads(self.rfile.read(length), parse_constant=invalid_number)
                if not isinstance(value, dict):
                    raise ValueError("Expected a JSON object")
                last_active[0] = time.monotonic()
                if self.path == "/save":
                    if self.saved("course.json") is False:
                        return
                    course = (course_shape(value["course"]) if "course" in value else
                              {"format": "classroom-commons-course", "fileVersion": 1,
                               "project": project_shape(value["project"], editable=True), "schedule": []})
                    write(folder, "course.json", course)
                elif self.path == "/request":
                    if not isinstance(value.get("id"), str) or not 1 <= len(value["id"]) <= 100:
                        raise ValueError("Request ID required")
                    if not isinstance(value.get("notes"), str) or len(value["notes"]) > 20000:
                        raise ValueError("Notes must be text, up to 20000 characters")
                    write(folder, "request.json", {"id": value["id"], "notes": value["notes"], "language": value.get("language", "en"), "project": project_shape(value["project"])})
                elif self.path == "/stop":
                    threading.Thread(target=server.shutdown, daemon=True).start()
                else:
                    self.send(404, {"error": "Unknown route"})
                    return
                self.send(200, {"ok": True})
            except (ValueError, KeyError, TypeError):
                self.send(400, {"error": "Invalid request"})
            except OSError:
                self.send(503, {"error": "Could not save; previous file kept"})

    server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    address = "127.0.0.1:" + str(server.server_port)
    server.daemon_threads = True
    write(folder, "session.json", {"url": "http://" + address + "/#" + token, "token": token, "instance": instance})

    def expire():
        while time.monotonic() - last_active[0] < minutes * 60:
            time.sleep(10)
        server.shutdown()

    threading.Thread(target=expire, daemon=True).start()
    try:
        server.serve_forever()
    finally:
        server.server_close()
        try:
            current = read(folder, "session.json")
        except (OSError, ValueError, UnicodeError):
            current = None
        if isinstance(current, dict) and current.get("instance") == instance:
            (folder / "session.json").unlink(missing_ok=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=("launch", "serve", "deliver", "stop"))
    parser.add_argument("--workspace", type=Path, required=True)
    parser.add_argument("--no-browser", action="store_true")
    parser.add_argument("--idle-minutes", type=int, default=60)
    parser.add_argument("--project", type=Path)
    parser.add_argument("--request-id")
    args = parser.parse_args()
    folder = args.workspace.resolve()
    folder.mkdir(parents=True, exist_ok=True)
    if args.command == "serve":
        serve(folder, max(1, args.idle_minutes))
    elif args.command == "launch":
        try:
            session = read(folder, "session.json")
        except (OSError, ValueError, UnicodeError):
            session = None
        if not matches(session, folder):
            session = None
        if not session:
            command = [sys.executable, str(Path(__file__).resolve()), "serve", "--workspace", str(folder), "--idle-minutes", str(args.idle_minutes)]
            options = {"creationflags": subprocess.CREATE_NO_WINDOW} if os.name == "nt" else {"start_new_session": True}
            child = subprocess.Popen(command, stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, **options)
            for _ in range(100):
                time.sleep(0.1)
                try:
                    session = read(folder, "session.json")
                except (OSError, ValueError, UnicodeError):
                    session = None
                if matches(session, folder):
                    break
                if child.poll() is not None:
                    raise RuntimeError("Local bridge could not start")
            else:
                raise RuntimeError("Local bridge startup timed out")
        if not args.no_browser:
            webbrowser.open(session["url"])
        print(json.dumps({"url": session["url"], "workspace": str(folder)}))
    elif args.command == "deliver":
        if not args.project or not args.request_id:
            parser.error("deliver requires --project and --request-id")
        request = read(folder, "request.json")
        if not isinstance(request, dict) or request.get("id") != args.request_id:
            raise ValueError("Request changed; read the latest request before drafting again")
        if args.project.stat().st_size > LIMIT:
            raise ValueError("Project exceeds 1 MB")
        project = project_shape(json.loads(args.project.read_text(encoding="utf-8-sig")))
        write(folder, "reply.json", {"requestId": args.request_id, "project": project})
        print(json.dumps({"status": "delivered_for_teacher_review", "constraint_checks": "pending_in_workbench"}))
    else:
        try:
            session = read(folder, "session.json")
        except (OSError, ValueError, UnicodeError):
            session = None
        if matches(session, folder):
            call(session, "/stop", {})
        print(json.dumps({"status": "stopped"}))


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, RuntimeError) as error:
        raise SystemExit(str(error))
