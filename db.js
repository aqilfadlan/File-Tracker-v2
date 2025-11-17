const mysql = require("mysql2");
const dotenv = require("dotenv");
dotenv.config();

// DB1: filetracker
const db1 = mysql
  .createPool({
    host: process.env.DB1_HOST,
    user: process.env.DB1_USER,
    password: process.env.DB1_PASSWORD,
    database: process.env.DB1_NAME,
  })
  .promise();

// DB2: infracit_sharedb
const db2 = mysql
  .createPool({
    host: process.env.DB2_HOST,
    user: process.env.DB2_USER,
    password: process.env.DB2_PASSWORD,
    database: process.env.DB2_NAME,
  })
  .promise();

(async () => {
  try {
    await db1.query("SELECT 1");
    console.log("✅ Connected to DB1 (filetracker)");
    await db2.query("SELECT 1");
    console.log("✅ Connected to DB2 (infracit_sharedb)");
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
  }
})();

module.exports = { db1, db2 };
