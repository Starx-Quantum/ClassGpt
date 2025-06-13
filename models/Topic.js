const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Topic {
  static async create(topicData) {
    return new Promise((resolve, reject) => {
      const id = uuidv4();
      const { title, subject, difficulty, content_type, generated_content } = topicData;
      
      const sql = `
        INSERT INTO topics (id, title, subject, difficulty, content_type, generated_content)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      db.getDb().run(sql, [id, title, subject, difficulty, content_type, JSON.stringify(generated_content)], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id, ...topicData });
        }
      });
    });
  }

  static async findAll(limit = 50) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM topics ORDER BY created_at DESC LIMIT ?`;
      
      db.getDb().all(sql, [limit], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const topics = rows.map(row => ({
            ...row,
            generated_content: JSON.parse(row.generated_content)
          }));
          resolve(topics);
        }
      });
    });
  }

  static async findById(id) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM topics WHERE id = ?`;
      
      db.getDb().get(sql, [id], (err, row) => {
        if (err) {
          reject(err);
        } else if (row) {
          resolve({
            ...row,
            generated_content: JSON.parse(row.generated_content)
          });
        } else {
          resolve(null);
        }
      });
    });
  }

  static async delete(id) {
    return new Promise((resolve, reject) => {
      const sql = `DELETE FROM topics WHERE id = ?`;
      
      db.getDb().run(sql, [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ deleted: this.changes > 0 });
        }
      });
    });
  }
}

module.exports = Topic;