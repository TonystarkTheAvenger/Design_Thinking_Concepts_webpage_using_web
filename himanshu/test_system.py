import sqlite3
import os
import json
import urllib.request
import threading
import time
from http.server import HTTPServer
from server import MaintenanceApiHandler

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "maintenance.db")

def test_sqlite_database():
    assert os.path.exists(DB_PATH), "Database file does not exist"
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [row[0] for row in cursor.fetchall()]
    assert "users" in tables, "Users table missing"
    assert "tickets" in tables, "Tickets table missing"
    assert "activity_logs" in tables, "Activity logs table missing"

    cursor.execute("SELECT COUNT(*) FROM users")
    user_count = cursor.fetchone()[0]
    assert user_count >= 7, f"Expected at least 7 users, got {user_count}"

    cursor.execute("SELECT COUNT(*) FROM tickets")
    ticket_count = cursor.fetchone()[0]
    assert ticket_count >= 5, f"Expected at least 5 tickets, got {ticket_count}"

    conn.close()
    print("[PASS] Database schema and seed verification passed!")

def test_api_server():
    server = HTTPServer(("127.0.0.1", 8765), MaintenanceApiHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    time.sleep(0.5)

    try:
        # Test /api/health
        with urllib.request.urlopen("http://127.0.0.1:8765/api/health") as res:
            assert res.status == 200
            data = json.loads(res.read().decode())
            assert data["status"] == "ok"
            assert data["db"] == "sqlite3"
        print("[PASS] /api/health test passed!")

        # Test /api/tickets
        with urllib.request.urlopen("http://127.0.0.1:8765/api/tickets") as res:
            assert res.status == 200
            data = json.loads(res.read().decode())
            assert "tickets" in data
            assert len(data["tickets"]) >= 5
        print("[PASS] /api/tickets test passed!")

        # Test /api/stats
        with urllib.request.urlopen("http://127.0.0.1:8765/api/stats") as res:
            assert res.status == 200
            data = json.loads(res.read().decode())
            assert "total" in data
            assert data["total"] >= 5
        print("[PASS] /api/stats test passed!")

        # Test /api/activity
        with urllib.request.urlopen("http://127.0.0.1:8765/api/activity") as res:
            assert res.status == 200
            data = json.loads(res.read().decode())
            assert "logs" in data
            assert len(data["logs"]) >= 1
        print("[PASS] /api/activity test passed!")

        # Test /api/export
        with urllib.request.urlopen("http://127.0.0.1:8765/api/export") as res:
            assert res.status == 200
            data = json.loads(res.read().decode())
            assert "users" in data
            assert "tickets" in data
            assert "logs" in data
        print("[PASS] /api/export test passed!")

        # Test POST /api/tickets
        new_ticket_req = urllib.request.Request(
            "http://127.0.0.1:8765/api/tickets",
            data=json.dumps({
                "title": "Automated Test Request",
                "description": "Checking system endpoint directly",
                "category": "Plumbing",
                "priority": "High",
                "unit": "Unit 999",
                "created_by_user_id": 1,
                "created_by_name": "Aarav Mehta"
            }).encode(),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(new_ticket_req) as res:
            assert res.status == 201
            created = json.loads(res.read().decode())["ticket"]
            created_id = created["id"]
            assert created["title"] == "Automated Test Request"
        print("[PASS] POST /api/tickets test passed!")

        # Test PUT /api/tickets/<id>
        update_req = urllib.request.Request(
            f"http://127.0.0.1:8765/api/tickets/{created_id}",
            data=json.dumps({
                "status": "In_Progress",
                "log_action": "Test Update",
                "log_user": "Tester",
                "log_note": "Starting test work"
            }).encode(),
            headers={"Content-Type": "application/json"},
            method="PUT"
        )
        with urllib.request.urlopen(update_req) as res:
            assert res.status == 200
            updated = json.loads(res.read().decode())["ticket"]
            assert updated["status"] == "In_Progress"
        print("[PASS] PUT /api/tickets/<id> test passed!")

        # Clean up created test ticket
        del_req = urllib.request.Request(
            f"http://127.0.0.1:8765/api/tickets/{created_id}",
            method="DELETE"
        )
        with urllib.request.urlopen(del_req) as res:
            assert res.status == 200
        print("[PASS] DELETE /api/tickets/<id> test passed!")

    finally:
        server.shutdown()
        server.server_close()
        print("[PASS] All API endpoint assertions passed successfully!")

if __name__ == "__main__":
    test_sqlite_database()
    test_api_server()
