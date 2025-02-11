import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.resolve('sync_data.db'));


db.exec(`
  CREATE TABLE IF NOT EXISTS sync_meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )
`);

export function getLastSyncTime() {
  const row = db.prepare('SELECT value FROM sync_meta WHERE key = ?').get('last_sync_time');
  return row ? row.value : null;
}


export function setLastSyncTime(timestamp) {
  db.prepare(`
    INSERT INTO sync_meta (key, value)
    VALUES ('last_sync_time', ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(timestamp);
}
