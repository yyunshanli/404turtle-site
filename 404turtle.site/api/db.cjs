// /var/www/404turtle.site/api/db.cjs
const mysql = require("mysql2/promise");
const fs = require("fs");
require("dotenv").config();

const wantSSL = /^(1|true|yes)$/i.test(process.env.DB_SSL || "");
const ssl = wantSSL
  ? {
      rejectUnauthorized: true,
      ca: process.env.DB_SSL_CA
        ? fs.readFileSync(process.env.DB_SSL_CA, "utf8")
        : undefined,
    }
  : undefined;

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 25060,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  ssl,
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = pool;
