import Database from 'better-sqlite3';
import type { MatchRecord } from '../../shared/types';
import * as fs from 'fs';

export function initializeStorage(dbPath: string) {
  const dir = require('path').dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY,
      opponent_class TEXT,
      started_at INTEGER,
      data TEXT
    );
  `);

  return {
    saveMatch: (match: MatchRecord) => {
      const stmt = db.prepare('INSERT OR REPLACE INTO matches (id, opponent_class, started_at, data) VALUES (?, ?, ?, ?)');
      stmt.run(match.id, match.opponentClass, match.startedAt, JSON.stringify(match));
    },
    listMatches: () => {
      const stmt = db.prepare('SELECT id, opponent_class, started_at, data FROM matches ORDER BY started_at DESC');
      return stmt.all().map((r: any) => ({ id: r.id, opponentClass: r.opponent_class, startedAt: r.started_at, data: JSON.parse(r.data) }));
    }
  };
}
