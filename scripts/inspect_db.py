import sqlite3

for path in ['prisma/dev.db', 'prisma/prisma/dev.db']:
    print('DB:', path)
    try:
        conn = sqlite3.connect(path)
        cur = conn.cursor()
        print('tables:', cur.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall())
        if 'AdminOtpCode' in [row[0] for row in cur.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]:
            print('pragma AdminOtpCode:', cur.execute("PRAGMA table_info(AdminOtpCode)").fetchall())
            print('row count:', cur.execute("SELECT COUNT(*) FROM AdminOtpCode").fetchone()[0])
        conn.close()
    except Exception as e:
        print('error:', e)

