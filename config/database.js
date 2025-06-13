const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(path.join(__dirname, '../classgpt.db'), (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('📁 Connected to SQLite database');
          this.createTables().then(resolve).catch(reject);
        }
      });
    });
  }

  async createTables() {
    return new Promise((resolve, reject) => {
      const createTopicsTable = `
        CREATE TABLE IF NOT EXISTS topics (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          subject TEXT,
          difficulty TEXT,
          content_type TEXT,
          generated_content TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `;

      this.db.run(createTopicsTable, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('✅ Topics table ready');
          resolve();
        }
      });
    });
  }

  getDb() {
    return this.db;
  }
}

module.exports = new Database();