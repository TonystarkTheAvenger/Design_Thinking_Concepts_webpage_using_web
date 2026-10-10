import http.server
import json
import os
import sqlite3
import sys
import urllib.parse
from datetime import datetime

PORT = 8000
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
HIMANSHU_DIR = os.path.join(ROOT_DIR, "himanshu")
DB_PATH = os.path.join(HIMANSHU_DIR, "maintenance.db")

def ensure_db():
    if not os.path.exists(DB_PATH):
        sys.path.insert(0, HIMANSHU_DIR)
        from init_db import init_db
        init_db()

ensure_db()

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

class ProjectServerHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT_DIR, **kwargs)

    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _send_json(self, data, status=200):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self._send_cors_headers()
        self.end_headers()
        self.wfile.write(body)

    def _read_json(self):
        content_length = int(self.headers.get("Content-Length", 0))
        if content_length > 0:
            raw_body = self.rfile.read(content_length)
            return json.loads(raw_body.decode("utf-8"))
        return {}

    def do_OPTIONS(self):
        self.send_response(204)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path

        if path == "/api/health":
            self._send_json({"status": "ok", "db": "sqlite3", "timestamp": datetime.now().isoformat()})
            return

        if path == "/api/users":
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("SELECT id, name, email, role, unit, phone, specialty FROM users ORDER BY id ASC")
            users = [dict(row) for row in cursor.fetchall()]
            conn.close()
            self._send_json({"users": users})
            return

        if path == "/api/tickets":
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, ticket_number, title, description, category, priority, status, unit,
                       created_by_user_id, created_by_name, assigned_to_user_id, assigned_to_name,
                       technician_notes, parts_used, rating, feedback, created_at, updated_at, resolved_at
                FROM tickets ORDER BY id DESC
            """)
            tickets = [dict(row) for row in cursor.fetchall()]
            conn.close()
            self._send_json({"tickets": tickets})
            return

        if path.startswith("/api/tickets/"):
            parts = path.strip("/").split("/")
            if len(parts) == 3 and parts[2].isdigit():
                ticket_id = int(parts[2])
                conn = get_db()
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,))
                ticket_row = cursor.fetchone()
                if not ticket_row:
                    conn.close()
                    self._send_json({"error": "Ticket not found"}, status=404)
                    return
                ticket = dict(ticket_row)

                cursor.execute("SELECT * FROM activity_logs WHERE ticket_id = ? ORDER BY id DESC", (ticket_id,))
                logs = [dict(row) for row in cursor.fetchall()]
                ticket["logs"] = logs
                conn.close()
                self._send_json({"ticket": ticket})
                return

        if path == "/api/stats":
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM tickets")
            total = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM tickets WHERE status = 'Open'")
            open_count = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM tickets WHERE status IN ('Assigned', 'In_Progress')")
            active_count = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM tickets WHERE status = 'Resolved'")
            resolved_count = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM tickets WHERE priority = 'Emergency'")
            emergency_count = cursor.fetchone()[0]

            conn.close()
            self._send_json({
                "total": total,
                "open": open_count,
                "active": active_count,
                "resolved": resolved_count,
                "emergency": emergency_count
            })
            return

        if path == "/api/activity":
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM activity_logs ORDER BY id DESC LIMIT 50")
            logs = [dict(row) for row in cursor.fetchall()]
            conn.close()
            self._send_json({"logs": logs})
            return

        if path == "/api/export":
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users")
            users = [dict(row) for row in cursor.fetchall()]
            cursor.execute("SELECT * FROM tickets")
            tickets = [dict(row) for row in cursor.fetchall()]
            cursor.execute("SELECT * FROM activity_logs")
            logs = [dict(row) for row in cursor.fetchall()]
            conn.close()
            self._send_json({
                "exported_at": datetime.now().isoformat(),
                "users": users,
                "tickets": tickets,
                "logs": logs
            })
            return

        # Fallback to standard file serving from workspace root
        return super().do_GET()

    def do_POST(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path

        if path == "/api/tickets":
            data = self._read_json()
            title = data.get("title", "").strip()
            description = data.get("description", "").strip()
            category = data.get("category", "General")
            priority = data.get("priority", "Medium")
            unit = data.get("unit", "Unit 402").strip()
            user_id = data.get("created_by_user_id", 1)
            user_name = data.get("created_by_name", "Aarav Mehta")

            if not title or not description:
                self._send_json({"error": "Title and description are required"}, status=400)
                return

            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("SELECT MAX(id) FROM tickets")
            max_id = cursor.fetchone()[0] or 1000
            ticket_number = f"TKT-{max_id + 1}"

            now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            cursor.execute("""
                INSERT INTO tickets (
                    ticket_number, title, description, category, priority, status, unit,
                    created_by_user_id, created_by_name, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, 'Open', ?, ?, ?, ?, ?)
            """, (ticket_number, title, description, category, priority, unit, user_id, user_name, now_str, now_str))
            new_id = cursor.lastrowid

            cursor.execute("""
                INSERT INTO activity_logs (ticket_id, user_name, action, note, created_at)
                VALUES (?, ?, 'Ticket Created', ?, ?)
            """, (new_id, user_name, f"Submitted: {title}", now_str))

            conn.commit()

            cursor.execute("SELECT * FROM tickets WHERE id = ?", (new_id,))
            created_ticket = dict(cursor.fetchone())
            conn.close()

            self._send_json({"ticket": created_ticket}, status=201)
            return

        if path.startswith("/api/tickets/") and path.endswith("/log"):
            parts = path.strip("/").split("/")
            if len(parts) == 4 and parts[2].isdigit():
                ticket_id = int(parts[2])
                data = self._read_json()
                user_name = data.get("user_name", "System")
                action = data.get("action", "Comment Added")
                note = data.get("note", "").strip()

                now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                conn = get_db()
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO activity_logs (ticket_id, user_name, action, note, created_at)
                    VALUES (?, ?, ?, ?, ?)
                """, (ticket_id, user_name, action, note, now_str))
                conn.commit()
                conn.close()
                self._send_json({"status": "success", "timestamp": now_str})
                return

        if path == "/api/reset":
            sys.path.insert(0, HIMANSHU_DIR)
            from init_db import init_db
            try:
                os.remove(DB_PATH)
            except OSError:
                pass
            init_db()
            self._send_json({"status": "reset_complete"})
            return

        self._send_json({"error": "Endpoint not found"}, status=404)

    def do_PUT(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path

        if path.startswith("/api/tickets/"):
            parts = path.strip("/").split("/")
            if len(parts) == 3 and parts[2].isdigit():
                ticket_id = int(parts[2])
                data = self._read_json()
                conn = get_db()
                cursor = conn.cursor()

                cursor.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,))
                existing = cursor.fetchone()
                if not existing:
                    conn.close()
                    self._send_json({"error": "Ticket not found"}, status=404)
                    return

                now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                status = data.get("status", existing["status"])
                assigned_to_user_id = data.get("assigned_to_user_id", existing["assigned_to_user_id"])
                assigned_to_name = data.get("assigned_to_name", existing["assigned_to_name"])
                priority = data.get("priority", existing["priority"])
                tech_notes = data.get("technician_notes", existing["technician_notes"])
                parts_used = data.get("parts_used", existing["parts_used"])
                rating = data.get("rating", existing["rating"])
                feedback = data.get("feedback", existing["feedback"])
                
                resolved_at = existing["resolved_at"]
                if status == "Resolved" and not resolved_at:
                    resolved_at = now_str

                cursor.execute("""
                    UPDATE tickets SET
                        status = ?,
                        assigned_to_user_id = ?,
                        assigned_to_name = ?,
                        priority = ?,
                        technician_notes = ?,
                        parts_used = ?,
                        rating = ?,
                        feedback = ?,
                        resolved_at = ?,
                        updated_at = ?
                    WHERE id = ?
                """, (status, assigned_to_user_id, assigned_to_name, priority, tech_notes, parts_used, rating, feedback, resolved_at, now_str, ticket_id))

                log_action = data.get("log_action", "Ticket Updated")
                log_user = data.get("log_user", "System")
                log_note = data.get("log_note", f"Updated status to {status}")

                cursor.execute("""
                    INSERT INTO activity_logs (ticket_id, user_name, action, note, created_at)
                    VALUES (?, ?, ?, ?, ?)
                """, (ticket_id, log_user, log_action, log_note, now_str))

                conn.commit()
                cursor.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,))
                updated_ticket = dict(cursor.fetchone())
                conn.close()

                self._send_json({"ticket": updated_ticket})
                return

        self._send_json({"error": "Endpoint not found"}, status=404)

    def do_DELETE(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path

        if path.startswith("/api/tickets/"):
            parts = path.strip("/").split("/")
            if len(parts) == 3 and parts[2].isdigit():
                ticket_id = int(parts[2])
                conn = get_db()
                cursor = conn.cursor()
                cursor.execute("DELETE FROM activity_logs WHERE ticket_id = ?", (ticket_id,))
                cursor.execute("DELETE FROM tickets WHERE id = ?", (ticket_id,))
                conn.commit()
                conn.close()
                self._send_json({"status": "deleted", "id": ticket_id})
                return

        self._send_json({"error": "Endpoint not found"}, status=404)

def run_server(port=PORT):
    server_address = ("", port)
    httpd = http.server.HTTPServer(server_address, ProjectServerHandler)
    print(f"FixFlow Full-Stack Server running at http://localhost:{port}/")
    print(f" -> Root Case Study: http://localhost:{port}/")
    print(f" -> FixFlow Dashboard: http://localhost:{port}/himanshu/")
    print(f" -> API Health: http://localhost:{port}/api/health")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server.")
        httpd.server_close()

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else PORT
    run_server(port)
