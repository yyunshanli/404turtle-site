// /var/www/404turtle.site/api/db.cjs
const mysql = require("mysql2/promise");
require("dotenv").config(); // <-- use require, not import

const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  user: process.env.DB_USER || "cse135",
  password: process.env.DB_PASS || "YOUR_STRONG_PW",
  database: process.env.DB_NAME || "cse135",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
