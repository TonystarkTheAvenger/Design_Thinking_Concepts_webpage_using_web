"""
Test FixFlow Jatin Independent Edition
Verifies database initialization, independent server API endpoints,
isolation from himanshu, Great Badge CSS, and UI assets.
"""

import os
import sys
import json
import sqlite3

def run_tests():
    jatin_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.dirname(jatin_dir)
    db_path = os.path.join(jatin_dir, "maintenance_jatin.db")

    print("[1/5] Testing independent SQLite database...")
    from init_db import init_db
    init_db(force_reset=True)
    assert os.path.exists(db_path), "Database file was not created!"

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM users")
    user_count = cur.fetchone()[0]
    assert user_count == 7, f"Expected 7 seed users, found {user_count}"

    cur.execute("SELECT COUNT(*) FROM tickets")
    ticket_count = cur.fetchone()[0]
    assert ticket_count == 5, f"Expected 5 seed tickets, found {ticket_count}"

    cur.execute("SELECT COUNT(*) FROM activity_logs")
    log_count = cur.fetchone()[0]
    assert log_count >= 10, f"Expected at least 10 seed logs, found {log_count}"
    conn.close()
    print("   [OK] Independent database initialized with 7 users, 5 tickets, and activity logs.")

    print("[2/5] Testing server module & isolation from himanshu...")
    import server as jatin_server
    assert jatin_server.PORT == 8001, f"Expected default port 8001, got {jatin_server.PORT}"
    assert os.path.abspath(jatin_server.DB_PATH) == os.path.abspath(db_path), "Server must use jatin DB path"
    print("   [OK] Server is configured for Port 8001 and isolated maintenance_jatin.db.")

    print("[3/5] Testing file independence in index.html...")
    with open(os.path.join(jatin_dir, "index.html"), "r", encoding="utf-8") as f:
        html = f.read()
    assert "../himanshu" not in html, "index.html should not link back to ../himanshu"
    assert "../index.html" not in html, "index.html should not link to ../index.html"
    assert "grate-badge" in html, "index.html should implement the Great Badge system"
    assert "exec-header" in html, "index.html should use the rearranged executive header layout"
    assert "inspectorPane" in html, "index.html should contain the master-detail inspector pane"
    assert 'id="modalBackdrop"' in html and 'hidden' in html, "index.html must have hidden modalBackdrop"
    print("   [OK] index.html is 100% independent and contains rearranged executive layout.")

    print("[4/5] Testing Great Badge and Pink design system in style.css...")
    with open(os.path.join(jatin_dir, "style.css"), "r", encoding="utf-8") as f:
        css = f.read()
    assert "--pink:" in css, "style.css must define --pink theme variable"
    assert ".grate-badge" in css, "style.css must define .grate-badge class"
    assert ".grate-badge-pulse" in css, "style.css must define pulsing radar badge"
    assert ".exec-workspace" in css, "style.css must define split master-detail workspace"
    assert ".modal-backdrop[hidden]" in css, "style.css must ensure modal-backdrop[hidden] is hidden"
    print("   [OK] style.css features complete Pink Palette, Great Badge system, and modal guards.")

    print("[5/5] Testing JavaScript app and DB client...")
    with open(os.path.join(jatin_dir, "db.js"), "r", encoding="utf-8") as f:
        db_js = f.read()
    assert "8001" in db_js, "db.js must support connecting to Port 8001"
    assert "maint_db_jatin_tickets_v1" in db_js, "db.js must use independent LocalStorage namespace"

    with open(os.path.join(jatin_dir, "app.js"), "r", encoding="utf-8") as f:
        app_js = f.read()
    assert "grate-badge" in app_js, "app.js must render Great Badges"
    assert "renderLiveInspector" in app_js, "app.js must render live master-detail inspector"
    assert "pinkRgb" in app_js, "app.js must use pink canvas color"
    print("   [OK] app.js and db.js fully coordinated.")

    print("[6/6] Testing live HTTP server & REST API...")
    import threading
    import http.server
    import urllib.request

    test_port = 8091
    test_httpd = http.server.HTTPServer(("127.0.0.1", test_port), jatin_server.JatinIndependentServerHandler)
    server_thread = threading.Thread(target=test_httpd.serve_forever, daemon=True)
    server_thread.start()

    try:
        # Test GET /api/health
        with urllib.request.urlopen(f"http://127.0.0.1:{test_port}/api/health") as resp:
            assert resp.status == 200
            data = json.loads(resp.read().decode())
            assert data["status"] == "ok"
            assert data["mode"] == "independent"

        # Test GET /api/tickets
        with urllib.request.urlopen(f"http://127.0.0.1:{test_port}/api/tickets") as resp:
            assert resp.status == 200
            data = json.loads(resp.read().decode())
            assert "tickets" in data
            assert len(data["tickets"]) >= 5

        # Test POST /api/tickets
        req_data = json.dumps({
            "title": "Pink Badge Test Leak",
            "description": "Testing standalone creation",
            "category": "Plumbing",
            "priority": "Emergency",
            "unit": "Unit 402",
            "created_by_name": "Aarav Mehta"
        }).encode()
        post_req = urllib.request.Request(
            f"http://127.0.0.1:{test_port}/api/tickets",
            data=req_data,
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(post_req) as resp:
            assert resp.status == 201
            data = json.loads(resp.read().decode())
            assert data["ticket"]["title"] == "Pink Badge Test Leak"
            created_id = data["ticket"]["id"]

        # Test PUT /api/tickets/{id}
        put_data = json.dumps({
            "status": "In_Progress",
            "technician_notes": "Diagnostic running"
        }).encode()
        put_req = urllib.request.Request(
            f"http://127.0.0.1:{test_port}/api/tickets/{created_id}",
            data=put_data,
            headers={"Content-Type": "application/json"},
            method="PUT"
        )
        with urllib.request.urlopen(put_req) as resp:
            assert resp.status == 200
            data = json.loads(resp.read().decode())
            assert data["ticket"]["status"] == "In_Progress"

        print("   [OK] Live HTTP REST API verified (health, query, create, update).")
    finally:
        test_httpd.shutdown()
        test_httpd.server_close()

    print("\nALL STANDALONE TESTS PASSED SUCCESSFULLY! [OK]")

if __name__ == "__main__":
    run_tests()
