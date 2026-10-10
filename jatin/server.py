import http.server
import json
import os
import sqlite3
import sys
import urllib.parse
from datetime import datetime

PORT = int(os.environ.get("PORT", 8001))
JATIN_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(JATIN_DIR, "maintenance_jatin.db")

def ensure_db():
    if not os.path.exists(DB_PATH):
        from init_db import init_db
        init_db()

ensure_db()

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

class JatinIndependentServerHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=JATIN_DIR, **kwargs)

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
            self._send_json({
                "status": "ok",
                "mode": "independent",
                "app": "FixFlow Jatin Independent Edition",
                "db": "sqlite3",
                "port": PORT,
                "timestamp": datetime.now().isoformat()
            })
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

                cursor.execute("""
                    SELECT id, ticket_id, user_name, action, note, created_at
                    FROM activity_logs WHERE ticket_id = ? ORDER BY id DESC
                """, (ticket_id,))
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
            cursor.execute("SELECT COUNT(*) FROM tickets WHERE status IN ('Open', 'Assigned')")
            active = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM tickets WHERE status = 'In_Progress'")
            in_progress = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM tickets WHERE status = 'Resolved'")
            resolved = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM tickets WHERE priority = 'Emergency' AND status != 'Resolved'")
            emergency = cursor.fetchone()[0]
            conn.close()
            self._send_json({
                "total": total,
                "active": active,
                "in_progress": in_progress,
                "resolved": resolved,
                "emergency": emergency
            })
            return

        if path == "/api/export":
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users")
            users = [dict(r) for r in cursor.fetchall()]
            cursor.execute("SELECT * FROM tickets")
            tickets = [dict(r) for r in cursor.fetchall()]
            cursor.execute("SELECT * FROM activity_logs")
            logs = [dict(r) for r in cursor.fetchall()]
            conn.close()
            self._send_json({
                "exported_at": datetime.now().isoformat(),
                "users": users,
                "tickets": tickets,
                "activity_logs": logs
            })
            return

        super().do_GET()

    def do_POST(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path

        if path == "/api/tickets":
            data = self._read_json()
            title = data.get("title", "").strip()
            desc = data.get("description", "").strip()
            category = data.get("category", "General")
            priority = data.get("priority", "Medium")
            unit = data.get("unit", "Unit 402").strip()
            created_by_id = data.get("created_by_user_id")
            created_by_name = data.get("created_by_name", "Resident")

            if not title or not desc:
                self._send_json({"error": "Title and description required"}, status=400)
                return

            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM tickets")
            next_num = 1001 + cursor.fetchone()[0]
            ticket_number = f"TKT-{next_num}"
            now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            cursor.execute("""
                INSERT INTO tickets (
                    ticket_number, title, description, category, priority, status, unit,
                    created_by_user_id, created_by_name, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, 'Open', ?, ?, ?, ?, ?)
            """, (ticket_number, title, desc, category, priority, unit, created_by_id, created_by_name, now, now))
            ticket_id = cursor.lastrowid

            cursor.execute("""
                INSERT INTO activity_logs (ticket_id, user_name, action, note, created_at)
                VALUES (?, ?, 'Ticket Created', ?, ?)
            """, (ticket_id, created_by_name, f"Created {priority} issue: {title}", now))

            conn.commit()
            cursor.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,))
            created_ticket = dict(cursor.fetchone())
            conn.close()

            self._send_json({"ticket": created_ticket}, status=201)
            return

        if path.startswith("/api/tickets/") and path.endswith("/log"):
            parts = path.strip("/").split("/")
            if len(parts) == 4 and parts[2].isdigit():
                ticket_id = int(parts[2])
                data = self._read_json()
                user_name = data.get("user_name", "Staff")
                action = data.get("action", "Note Added")
                note = data.get("note", "")
                now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

                conn = get_db()
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO activity_logs (ticket_id, user_name, action, note, created_at)
                    VALUES (?, ?, ?, ?, ?)
                """, (ticket_id, user_name, action, note, now))
                conn.commit()
                conn.close()
                self._send_json({"status": "logged", "created_at": now})
                return

        if path == "/api/reset":
            from init_db import init_db
            init_db(force_reset=True)
            self._send_json({"status": "database_reset_success"})
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
                current = cursor.fetchone()
                if not current:
                    conn.close()
                    self._send_json({"error": "Ticket not found"}, status=404)
                    return

                now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                fields = []
                values = []

                if "status" in data:
                    fields.append("status = ?")
                    values.append(data["status"])
                    if data["status"] in ("Resolved", "Closed"):
                        fields.append("resolved_at = ?")
                        values.append(now)

                if "assigned_to_user_id" in data:
                    fields.append("assigned_to_user_id = ?")
                    values.append(data["assigned_to_user_id"])
                if "assigned_to_name" in data:
                    fields.append("assigned_to_name = ?")
                    values.append(data["assigned_to_name"])
                if "technician_notes" in data:
                    fields.append("technician_notes = ?")
                    values.append(data["technician_notes"])
                if "parts_used" in data:
                    fields.append("parts_used = ?")
                    values.append(data["parts_used"])
                if "rating" in data:
                    fields.append("rating = ?")
                    values.append(data["rating"])
                if "feedback" in data:
                    fields.append("feedback = ?")
                    values.append(data["feedback"])
                if "priority" in data:
                    fields.append("priority = ?")
                    values.append(data["priority"])

                fields.append("updated_at = ?")
                values.append(now)
                values.append(ticket_id)

                cursor.execute(f"UPDATE tickets SET {', '.join(fields)} WHERE id = ?", values)

                # Add log entry
                log_action = data.get("log_action", "Ticket Updated")
                log_user = data.get("log_user", "System")
                log_note = data.get("log_note", f"Updated fields: {', '.join(data.keys())}")
                cursor.execute("""
                    INSERT INTO activity_logs (ticket_id, user_name, action, note, created_at)
                    VALUES (?, ?, ?, ?, ?)
                """, (ticket_id, log_user, log_action, log_note, now))

                conn.commit()
                cursor.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,))
                updated_ticket = dict(cursor.fetchone())
                conn.close()

                self._send_json({"ticket": updated_ticket})
                return

        self._send_json({"error": "Endpoint not found"}, status=404)

def run_server():
    server_address = ("", PORT)
    httpd = http.server.HTTPServer(server_address, JatinIndependentServerHandler)
    print(f"=========================================================")
    print(f" FixFlow Jatin Independent Edition Running on Port {PORT} ")
    print(f" http://localhost:{PORT}/                                ")
    print(f" Standalone Database: {DB_PATH}                          ")
    print(f"=========================================================")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server.")
        httpd.server_close()

if __name__ == "__main__":
    run_server()
