const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') })
const DATABASE_URL = process.env.DATABASE_URL
console.log('cwd:', process.cwd())
console.log('DATABASE_URL:', DATABASE_URL)

function resolveDatabaseUrl(url) {
  if (!url?.startsWith('file:')) return url
  const [filePath, query] = url.slice(5).split('?', 2)
  if (path.isAbsolute(filePath)) return url
  const absolutePath = path.join(process.cwd(), filePath)
  return query ? `file:${absolutePath}?${query}` : `file:${absolutePath}`
}

const resolved = resolveDatabaseUrl(DATABASE_URL)
console.log('resolved:', resolved)

const sqlite3 = require('sqlite3').verbose()
const filePath = resolved.startsWith('file:') ? resolved.slice(5).split('?')[0] : resolved
console.log('filePath:', filePath)
console.log('exists:', fs.existsSync(filePath))

const db = new sqlite3.Database(filePath)
db.serialize(() => {
  db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
    if (err) {
      console.error('tables err', err)
    } else {
      console.log('tables', rows.map((r) => r.name))
    }
  })
})
db.close()