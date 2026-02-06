// controllers/fileMovementController.js
const { db1, db2 } = require("../db");
const { fetchUsersMap, fetchDepartmentsMap } = require("../helpers/dbHelpers");

// ============================
// Helper: Check Session
// ============================
function requireSession(req, res) {
  const user = req.session?.user;
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  return user;
}

// ============================
// Helper: Validate Files by Department
// ============================
async function validateFilesInUserDepartment(files, userDept) {
  if (!Array.isArray(files) || files.length === 0) {
    return { ok: false, message: "At least one file must be selected." };
  }

  try {
    const placeholders = files.map(() => "?").join(",");
    const [rows] = await db1.query(
      `SELECT ff.file_id, ff.folder_id, f.department_id
       FROM folder_files ff
       JOIN folder f ON ff.folder_id = f.folder_id
       WHERE ff.file_id IN (${placeholders})`,
      files
    );

    const found = new Set(rows.map(r => Number(r.file_id)));
    const missing = files.filter(f => !found.has(Number(f)));
    if (missing.length > 0) {
      return { ok: false, message: `Invalid file(s): ${missing.join(", ")}` };
    }

    const wrong = rows.filter(r => Number(r.department_id) !== Number(userDept));
    if (wrong.length > 0) {
      const bad = [...new Set(wrong.map(r => r.file_id))];
      return { ok: false, message: `You are not allowed to request: ${bad.join(", ")}` };
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, message: err.message };
  }
}

// ============================
// Create File Movement
// ============================
exports.createFileMovement = async (req, res) => {
  const user = requireSession(req, res);
  if (!user) return;

  const { move_type, remark, folder_id, files } = req.body;
  const userDept = user.dept;

  if (!userDept) {
    return res.status(400).json({ error: "User has no department assigned." });
  }

  const validation = await validateFilesInUserDepartment(files, userDept);
  if (!validation.ok) {
    return res.status(400).json({ error: validation.message });
  }

  let conn;
  try {
    conn = await db1.getConnection();
    await conn.beginTransaction();

    const [movement] = await conn.query(
      `INSERT INTO file_movement
       (move_type, move_date, move_time, taken_at, return_at, approved_at,
        status_id, remark, approve_by, user_id, folder_id)
       VALUES (?, CURDATE(), NULL, NULL, NULL, NULL, 1, ?, NULL, ?, ?)`,
      [move_type || "Take Out", remark || null, user.id, folder_id || null]
    );

    const moveId = movement.insertId;
    const fileSQL = `INSERT INTO file_movement_files (move_id, file_id) VALUES (?, ?)`;
    for (const fileId of files) {
      await conn.query(fileSQL, [moveId, fileId]);
    }

    await conn.commit();
    conn.release();

    res.json({ success: true, message: "Movement request submitted", move_id: moveId });
  } catch (err) {
    if (conn) { await conn.rollback(); conn.release(); }
    console.error("createFileMovement error:", err);
    res.status(500).json({ error: "Failed to create movement" });
  }
};

// ============================
// Get Files by Department
// ============================
exports.getFilesByDepartment = async (req, res) => {
  const user = requireSession(req, res);
  if (!user) return;

  const userDept = user.dept;
  if (!userDept) return res.status(400).json({ error: "No department assigned" });

  try {
    const [files] = await db1.query(
      `SELECT f.file_id, f.file_name, fol.folder_id, fol.folder_name
       FROM file f
       JOIN folder_files ff ON ff.file_id = f.file_id
       JOIN folder fol ON fol.folder_id = ff.folder_id
       WHERE fol.department_id = ?
       ORDER BY fol.folder_name, f.file_name`,
      [userDept]
    );
    res.json(files);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// ============================
// Get Folders by Department
// ============================
exports.getFoldersByDepartment = async (req, res) => {
  const user = requireSession(req, res);
  if (!user) return;

  const userDept = user.dept;
  if (!userDept) return res.status(400).json({ error: "No department assigned" });

  try {
    const [folders] = await db1.query(
      "SELECT folder_id, folder_name FROM folder WHERE department_id = ?",
      [userDept]
    );
    res.json(folders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// ============================
// Get Pending Movements
// ============================
exports.getPendingMovements = async (req, res) => {
  const [rows] = await db1.query(`
    SELECT fm.move_id, fm.move_type, fm.move_date, fm.user_id
    FROM file_movement fm
    WHERE fm.status_id = 1
    ORDER BY fm.move_date DESC
  `);

  // Fetch user names from remote db2
  const userMap = await fetchUsersMap(rows.map(r => r.user_id));
  for (const r of rows) {
    r.moved_by_name = userMap.get(r.user_id)?.usr_name || null;
  }

  for (const r of rows) {
    const [files] = await db1.query(`
      SELECT f.file_name
      FROM file_movement_files mm
      JOIN file f ON f.file_id = mm.file_id
      WHERE mm.move_id = ?
    `, [r.move_id]);
    r.files = files;
  }

  res.json(rows);
};

// ============================
// Get All File Movements
// ============================
// ============================
// Get All File Movements
// ============================
exports.getFileMovements = async (req, res) => {
  const user = requireSession(req, res);
  if (!user) return;

  try {
    let rows;
    if (["admin", "super_admin","HR"].includes(user.role)) {
      [rows] = await db1.query(`
        SELECT fm.*, s.status_name
        FROM file_movement fm
        LEFT JOIN status s ON s.status_id = fm.status_id
        ORDER BY fm.move_id DESC
      `);
    } else {
      [rows] = await db1.query(`
        SELECT fm.*, s.status_name
        FROM file_movement fm
        LEFT JOIN status s ON s.status_id = fm.status_id
        WHERE fm.user_id = ?
        ORDER BY fm.move_id DESC
      `, [user.id]);
    }

    // Fetch users and departments from remote db2
    const userIds = rows.flatMap(r => [r.user_id, r.approve_by]);
    const userMap = await fetchUsersMap(userIds);

    const deptIds = [];
    for (const r of rows) {
      const user_record = userMap.get(r.user_id);
      r.user_name = user_record?.usr_name || null;
      r.department_id = user_record?.usr_dept || null;
      if (user_record?.usr_dept) deptIds.push(user_record.usr_dept);
      r.approved_by_name = userMap.get(r.approve_by)?.usr_name || null;
    }

    const deptMap = await fetchDepartmentsMap(deptIds);
    for (const r of rows) {
      r.department_name = deptMap.get(r.department_id)?.department || null;
    }

    for (const r of rows) {
      const [files] = await db1.query(`
        SELECT f.file_id, f.file_name, fol.folder_id, fol.folder_name
        FROM file_movement_files m
        JOIN file f ON f.file_id = m.file_id
        JOIN folder_files ff ON ff.file_id = f.file_id
        JOIN folder fol ON fol.folder_id = ff.folder_id
        WHERE m.move_id = ?
        ORDER BY fol.folder_name, f.file_name
      `, [r.move_id]);
      r.files = files;
    }

    res.json(rows);
  } catch (err) {
    console.error("❌ getFileMovements error:", err);
    res.status(500).json({ error: "Internal server error", details: err.message });
  }
};


// ============================
// Get File Movement by ID
// ============================
exports.getFileMovementById = async (req, res) => {
  const { move_id } = req.params;
  const [rows] = await db1.query(`
    SELECT fm.*, s.status_name
    FROM file_movement fm
    LEFT JOIN status s ON s.status_id = fm.status_id
    WHERE fm.move_id = ?
  `, [move_id]);

  if (rows.length === 0) return res.status(404).json({ error: "File movement not found" });

  const movement = rows[0];

  // Fetch user names from remote db2
  const userMap = await fetchUsersMap([movement.user_id, movement.approve_by]);
  movement.moved_by_name = userMap.get(movement.user_id)?.usr_name || null;
  movement.approved_by_name = userMap.get(movement.approve_by)?.usr_name || null;
  const [files] = await db1.query(`
    SELECT f.file_id, f.file_name, fol.folder_id, fol.folder_name
    FROM file_movement_files mm
    JOIN file f ON f.file_id = mm.file_id
    JOIN folder_files ff ON ff.file_id = f.file_id
    JOIN folder fol ON fol.folder_id = ff.folder_id
    WHERE mm.move_id = ?
    ORDER BY fol.folder_name, f.file_name
  `, [move_id]);

  movement.files = files;
  res.json(movement);
};

// ============================
// Approve / Reject / Take / Return
// ============================
exports.approveMovement = async (req, res) => {
  const user = requireSession(req, res);
  if (!user) return;
  if (!["admin", "super_admin"].includes(user.role)) return res.status(403).json({ error: "Only admin can approve" });

  const { move_id } = req.params;
  const [result] = await db1.query(
    `UPDATE file_movement SET status_id=3, approve_by=?, approved_at=NOW() WHERE move_id=?`,
    [user.id, move_id]
  );

  if (result.affectedRows === 0) return res.status(404).json({ error: "Not found" });
  res.json({ success: true, message: "Approved" });
};

exports.rejectMovement = async (req, res) => {
  const user = requireSession(req, res);
  if (!user) return;
  if (!["admin", "super_admin"].includes(user.role)) return res.status(403).json({ error: "Only admin can reject" });

  const { move_id } = req.params;
  const [result] = await db1.query(
    `UPDATE file_movement SET status_id=2, approve_by=?, approved_at=NOW() WHERE move_id=?`,
    [user.id, move_id]
  );

  if (result.affectedRows === 0) return res.status(404).json({ error: "Not found" });
  res.json({ success: true, message: "Rejected" });
};

exports.takeOutFile = async (req, res) => {
  const user = requireSession(req, res);
  if (!user) return;

  const { move_id } = req.params;
  const [check] = await db1.query("SELECT status_id FROM file_movement WHERE move_id=?", [move_id]);

  if (check.length === 0) return res.status(404).json({ error: "Movement not found" });
  if (check[0].status_id !== 3) return res.status(400).json({ error: "Only approved requests can be taken out" });

  const [result] = await db1.query("UPDATE file_movement SET status_id=5, taken_at=NOW() WHERE move_id=?", [move_id]);
  if (result.affectedRows === 0) return res.status(404).json({ error: "Not found" });

  res.json({ success: true, message: "File taken out" });
};

exports.returnFile = async (req, res) => {
  const user = requireSession(req, res);
  if (!user) return;

  const { move_id } = req.params;
  const [check] = await db1.query("SELECT status_id FROM file_movement WHERE move_id=?", [move_id]);

  if (check.length === 0) return res.status(404).json({ error: "Movement not found" });
  if (check[0].status_id !== 5) return res.status(400).json({ error: "Only taken out files can be returned" });

  const [result] = await db1.query("UPDATE file_movement SET status_id=4, return_at=NOW() WHERE move_id=?", [move_id]);
  if (result.affectedRows === 0) return res.status(404).json({ error: "Not found" });

  res.json({ success: true, message: "File returned" });
};

// ============================
// My Requests / Notifications
// ============================
exports.getMyRequests = async (req, res) => {
  const user = requireSession(req, res);
  if (!user) return;

  const [rows] = await db1.query(`
    SELECT fm.*, s.status_name
    FROM file_movement fm
    LEFT JOIN status s ON s.status_id = fm.status_id
    WHERE fm.user_id = ?
    ORDER BY fm.move_id DESC
  `, [user.id]);

  // Fetch user names from remote db2
  const userIds = rows.flatMap(r => [r.user_id, r.approve_by]);
  const userMap = await fetchUsersMap(userIds);
  for (const r of rows) {
    r.user_name = userMap.get(r.user_id)?.usr_name || null;
    r.approved_by_name = userMap.get(r.approve_by)?.usr_name || null;
  }

  for (const r of rows) {
    const [files] = await db1.query(`
      SELECT f.file_id, f.file_name, fol.folder_id, fol.folder_name
      FROM file_movement_files m
      JOIN file f ON f.file_id = m.file_id
      JOIN folder_files ff ON ff.file_id = f.file_id
      JOIN folder fol ON fol.folder_id = ff.folder_id
      WHERE m.move_id = ?
      ORDER BY fol.folder_name, f.file_name
    `, [r.move_id]);
    r.files = files;
  }

  res.json(rows);
};

exports.getMyNotifications = async (req, res) => {
  const user = requireSession(req, res);
  if (!user) return;

  const [rows] = await db1.query(`
    SELECT fm.*
    FROM file_movement fm
    WHERE fm.user_id = ? AND fm.status_id IN (2,3)
    ORDER BY fm.move_date DESC
  `, [user.id]);

  // Fetch user names from remote db2
  const userMap = await fetchUsersMap(rows.map(r => r.user_id));
  for (const r of rows) {
    r.user_name = userMap.get(r.user_id)?.usr_name || null;
  }

  for (const r of rows) {
    const [files] = await db1.query(`
      SELECT f.file_id, f.file_name, fol.folder_id, fol.folder_name
      FROM file_movement_files m
      JOIN file f ON f.file_id = m.file_id
      JOIN folder_files ff ON ff.file_id = f.file_id
      JOIN folder fol ON fol.folder_id = ff.folder_id
      WHERE m.move_id = ?
      ORDER BY fol.folder_name, f.file_name
    `, [r.move_id]);
    r.files = files;
  }

  res.json(rows);
};

// ============================
// Update / Delete
// ============================
exports.updateFileMovement = async (req, res) => {
  try {
    const { move_id } = req.params;
    const { file_id, from_department, to_department, moved_by } = req.body;

    const [result] = await db1.query(
      `UPDATE file_movement 
       SET file_id=?, from_department=?, to_department=?, moved_by=?
       WHERE move_id=?`,
      [file_id, from_department, to_department, moved_by, move_id]
    );

    if (result.affectedRows === 0) return res.status(404).json({ error: "Not found" });
    res.json({ message: "File movement updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.deleteFileMovement = async (req, res) => {
  try {
    const { move_id } = req.params;
    const [result] = await db1.query("DELETE FROM file_movement WHERE move_id=?", [move_id]);

    if (result.affectedRows === 0) return res.status(404).json({ error: "Not found" });
    res.json({ message: "File movement deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};




/* -----------------------------------------------------------
   CHECK FOR DUPLICATE PENDING REQUEST
----------------------------------------------------------- */
exports.checkDuplicateRequest = async (req, res) => {
  try {
    const { user_id, file_id } = req.query;

    if (!user_id || !file_id) {
      return res.status(400).json({ error: "user_id and file_id are required" });
    }

    const [rows] = await db1.query(
      `
      SELECT COUNT(*) as count
      FROM file_movement fm
      INNER JOIN file_movement_files fmf ON fm.move_id = fmf.move_id
      WHERE fm.user_id = ? 
        AND fmf.file_id = ?
        AND fm.status_id = 1
      `,
      [user_id, file_id]
    );

    const hasPendingRequest = rows[0].count > 0;

    res.json({ hasPendingRequest });

  } catch (err) {
    console.error("Error checking duplicate request:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};