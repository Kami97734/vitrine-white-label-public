from pathlib import Path
import sqlite3

for path in [Path('prisma/dev.db'), Path('prisma/prisma/dev.db')]:
    print('PATH:', path)
    print('exists:', path.exists())
    if path.exists():
        print('size:', path.stat().st_size)
        try:
            conn = sqlite3.connect(path)
            cur = conn.cursor()
            tables = cur.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
            print('tables:', [t[0] for t in tables])
            conn.close()
        except Exception as e:
            print('error reading sqlite:', e)
    print('---')
