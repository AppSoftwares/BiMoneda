import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';

class StorageService {
  private sqlite: SQLiteConnection = new SQLiteConnection(CapacitorSQLite);
  private db: SQLiteDBConnection | null = null;

  async initialize() {
    try {
      // Usando 'secret' para habilitar cifrado SQLCipher
      this.db = await this.sqlite.createConnection('bimoneda_local', true, 'secret', 1, false);
      await this.db.open();

      // Schema for local 80% processing
      const schema = `
        CREATE TABLE IF NOT EXISTS local_invoices (
          id TEXT PRIMARY KEY,
          data TEXT,
          synced INTEGER DEFAULT 0,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS local_clients (
          id TEXT PRIMARY KEY,
          data TEXT,
          synced INTEGER DEFAULT 0
        );
      `;
      await this.db.execute(schema);
      console.log('Local DB Initialized (80% Local Strategy)');
    } catch (err) {
      console.error('SQLite init error:', err);
    }
  }

  async saveData(table: string, id: string, data: any) {
    if (!this.db) return;
    const query = `INSERT OR REPLACE INTO ${table} (id, data, synced) VALUES (?, ?, 0)`;
    await this.db.run(query, [id, JSON.stringify(data)]);
  }

  async getLocalData(table: string) {
    if (!this.db) return [];
    const res = await this.db.query(`SELECT * FROM ${table}`);
    return res.values?.map(row => JSON.parse(row.data)) || [];
  }
}

export const storage = new StorageService();
