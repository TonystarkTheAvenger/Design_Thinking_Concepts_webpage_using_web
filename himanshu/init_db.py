import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "maintenance.db")
SCHEMA_PATH = os.path.join(os.path.dirname(__file__), "schema.sql")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Load and execute schema
    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        cursor.executescript(f.read())

    # Check if users exist
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        # Seed users
        users = [
            ("Aarav Mehta", "aarav.mehta@example.com", "resident", "Unit 402", "+91 98765 43210", None),
            ("Neha Gupta", "neha.gupta@example.com", "resident", "Unit 205", "+91 98765 43211", None),
            ("Rohit Verma", "rohit.verma@example.com", "resident", "Unit 108", "+91 98765 43212", None),
            ("Rajesh Kumar", "rajesh.tech@example.com", "technician", None, "+91 98765 11111", "Electrical & HVAC"),
            ("Suresh Patil", "suresh.tech@example.com", "technician", None, "+91 98765 22222", "Plumbing & Sanitization"),
            ("Vikram Singh", "vikram.tech@example.com", "technician", None, "+91 98765 33333", "Carpentry & General"),
            ("Priya Sharma", "priya.manager@example.com", "manager", "Admin Office", "+91 98765 99999", "Facilities Management"),
        ]
        cursor.executemany(
            "INSERT INTO users (name, email, role, unit, phone, specialty) VALUES (?, ?, ?, ?, ?, ?)",
            users
        )

        # Seed sample tickets
        tickets = [
            (
                "TKT-1001", "Severe Bathroom Pipe Leakage", "Persistent water dripping from joint below sink pipe, pooling on floor.",
                "Plumbing", "High", "In_Progress", "Unit 402",
                1, "Aarav Mehta", 5, "Suresh Patil",
                "Replaced worn Teflon seal and tightened primary elbow joint.", "1x Teflon tape, 1x rubber O-ring",
                None, "", "2026-10-03 09:30:00", "2026-10-04 11:00:00", None
            ),
            (
                "TKT-1002", "Main Circuit Breaker Tripping Constantly", "Kitchen appliances tripping master MCB repeatedly whenever microwave turns on.",
                "Electrical", "Emergency", "Assigned", "Unit 205",
                2, "Neha Gupta", 4, "Rajesh Kumar",
                "Initial inspection scheduled. Suspected overload or faulty 16A breaker.", "",
                None, "", "2026-10-04 08:15:00", "2026-10-04 09:45:00", None
            ),
            (
                "TKT-1003", "Balcony Sliding Door Jammed", "Sliding glass door roller slipped out of lower channel; hard to close completely.",
                "Carpentry", "Low", "Resolved", "Unit 108",
                3, "Rohit Verma", 6, "Vikram Singh",
                "Re-aligned bottom nylon rollers and lubricated track with silicone spray.", "2x stainless screws, silicone lube",
                5, "Super quick fix, sliding very smoothly now. Thank you!", "2026-10-01 14:00:00", "2026-10-02 16:30:00", "2026-10-02 16:30:00"
            ),
            (
                "TKT-1004", "AC Drain Line Clogged & Dripping Water", "Master bedroom AC leaking water down interior wall inside the bedroom.",
                "HVAC", "High", "Open", "Unit 402",
                1, "Aarav Mehta", None, None,
                "", "",
                None, "", "2026-10-04 13:20:00", "2026-10-04 13:20:00", None
            ),
            (
                "TKT-1005", "Intercom Handset Not Ringing", "Security gate calls not connecting to the indoor buzzer speaker.",
                "General", "Medium", "Open", "Unit 205",
                2, "Neha Gupta", None, None,
                "", "",
                None, "", "2026-10-04 14:45:00", "2026-10-04 14:45:00", None
            )
        ]
        cursor.executemany(
            """INSERT INTO tickets (
                ticket_number, title, description, category, priority, status, unit,
                created_by_user_id, created_by_name, assigned_to_user_id, assigned_to_name,
                technician_notes, parts_used, rating, feedback, created_at, updated_at, resolved_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            tickets
        )

        # Seed activity logs
        logs = [
            (1, "Aarav Mehta", "Ticket Created", "Reported severe bathroom pipe leakage.", "2026-10-03 09:30:00"),
            (1, "Priya Sharma", "Assigned", "Assigned Suresh Patil (Plumbing Specialist).", "2026-10-03 10:15:00"),
            (1, "Suresh Patil", "Status Changed", "Started diagnosis in Unit 402.", "2026-10-04 10:45:00"),
            (2, "Neha Gupta", "Ticket Created", "Reported emergency circuit breaker trip.", "2026-10-04 08:15:00"),
            (2, "Priya Sharma", "Priority Flagged", "Marked as Emergency. Dispatched Rajesh Kumar.", "2026-10-04 09:45:00"),
            (3, "Rohit Verma", "Ticket Created", "Reported jammed balcony door.", "2026-10-01 14:00:00"),
            (3, "Vikram Singh", "Resolved", "Re-aligned rollers and greased track.", "2026-10-02 16:30:00"),
            (3, "Rohit Verma", "Feedback Added", "Gave 5-star rating: Super quick fix!", "2026-10-02 17:00:00"),
            (4, "Aarav Mehta", "Ticket Created", "Reported bedroom AC condensation drip.", "2026-10-04 13:20:00"),
            (5, "Neha Gupta", "Ticket Created", "Reported intercom buzzing malfunction.", "2026-10-04 14:45:00"),
        ]
        cursor.executemany(
            "INSERT INTO activity_logs (ticket_id, user_name, action, note, created_at) VALUES (?, ?, ?, ?, ?)",
            logs
        )

    conn.commit()
    conn.close()
    print("Database initialized successfully at:", DB_PATH)

if __name__ == "__main__":
    init_db()
