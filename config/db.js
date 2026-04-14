const mysql = require('mysql2/promise');
require('dotenv').config();

let pool;

if (process.env.DATABASE_URL) {
  // Use connection URI provided by cloud hosts like Aiven
  pool = mysql.createPool(process.env.DATABASE_URL);
} else {
  // Local fallback
  pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
}

module.exports = pool;
