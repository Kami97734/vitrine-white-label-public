import sqlite3

db_path = "prisma/dev.db"
print(f"Opening database: {db_path}")
conn = sqlite3.connect(db_path)
c = conn.cursor()
try:
    c.execute(
        """
        CREATE TABLE IF NOT EXISTS AdminOtpCode (
            id TEXT PRIMARY KEY,
            email TEXT NOT NULL,
            codeHash TEXT NOT NULL,
            expiresAt TEXT NOT NULL,
            used INTEGER NOT NULL DEFAULT 0,
            attempts INTEGER NOT NULL DEFAULT 0,
            adminId TEXT,
            createdAt TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY(adminId) REFERENCES Admin(id) ON DELETE SET NULL
        )
        """
    )
    c.execute("CREATE INDEX IF NOT EXISTS AdminOtpCode_email_idx ON AdminOtpCode(email)")
    c.execute("CREATE INDEX IF NOT EXISTS AdminOtpCode_expiresAt_idx ON AdminOtpCode(expiresAt)")
    conn.commit()
    print("AdminOtpCode table ensured")
finally:
    conn.close()
