import os
from pathlib import Path
import sqlite3

root = Path.cwd()
print('cwd=', root)

env_path = root / '.env'
print('.env exists=', env_path.exists())
if env_path.exists():
    with env_path.open('r', encoding='utf-8') as f:
        lines = [line.strip() for line in f if line.strip() and not line.strip().startswith('#')]
    env = {}
    for line in lines:
        if '=' in line:
            key, value = line.split('=', 1)
            env[key.strip()] = value.strip().strip('"').strip("'")
    print('DATABASE_URL=', env.get('DATABASE_URL'))
    db_url = env.get('DATABASE_URL')
    if db_url and db_url.startswith('file:'):
        file_path = db_url[5:].split('?', 1)[0]
        resolved = Path(file_path)
        if not resolved.is_absolute():
            resolved = (root / resolved).resolve()
        print('resolved file path=', resolved)
        print('exists=', resolved.exists())
        if resolved.exists():
            conn = sqlite3.connect(resolved)
            cur = conn.cursor()
            tables = cur.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
            print('tables=', [row[0] for row in tables])
            if 'SiteSettings' in (row[0] for row in tables):
                print('SiteSettings exists')
            conn.close()
else:
    print('No .env found')
