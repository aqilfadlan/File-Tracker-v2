const { db2 } = require("../db");

/**
 * Fetch user records from db2 (infracit_sharedb) by user_ids.
 * Returns a Map of user_id -> { user_id, usr_name, usr_email, usr_dept }
 */
async function fetchUsersMap(userIds) {
  const ids = [...new Set(userIds.filter(id => id != null))];
  if (ids.length === 0) return new Map();

  const placeholders = ids.map(() => "?").join(",");
  const [rows] = await db2.query(
    `SELECT user_id, usr_name, usr_email, usr_dept FROM users WHERE user_id IN (${placeholders})`,
    ids
  );

  const map = new Map();
  for (const row of rows) map.set(row.user_id, row);
  return map;
}

/**
 * Fetch department records from db2 (infracit_sharedb) by department_ids.
 * Returns a Map of department_id -> { department_id, department }
 */
async function fetchDepartmentsMap(deptIds) {
  const ids = [...new Set(deptIds.filter(id => id != null))];
  if (ids.length === 0) return new Map();

  const placeholders = ids.map(() => "?").join(",");
  const [rows] = await db2.query(
    `SELECT department_id, department FROM tref_department WHERE department_id IN (${placeholders})`,
    ids
  );

  const map = new Map();
  for (const row of rows) map.set(row.department_id, row);
  return map;
}

module.exports = { fetchUsersMap, fetchDepartmentsMap };
