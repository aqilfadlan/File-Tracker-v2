const { db1, db2 } = require("../db"); // db1 = filetracker, db2 = infracit_sharedb

// ✅ CREATE FILE MOVEMENT
exports.createFileMovement = async (req, res) => {
  console.log("📦 Incoming body:", req.body);
  console.log("👤 Session user:", req.session.user);

  const {
    move_type,
    move_date,
    move_time,
    taken_at,
    return_at,
    approved_at,
    status_id,
    remark,
    approve_by,
    folder_id,
  } = req.body;

  const sessionUser = req.session.user;

  if (!sessionUser) return res.status(401).json({ error: "Unauthorized" });
  if (!folder_id) return res.status(400).json({ error: "folder_id is required" });

  try {
    const [result] = await db1.query(
      `
      INSERT INTO file_movement 
      (move_type, move_date, move_time, taken_at, return_at, approved_at, 
       status_id, remark, approve_by, user_id, folder_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        move_type || null,
        move_date || new Date(),
        move_time || null,
        taken_at || null,
        return_at || null,
        approved_at || null,
        status_id || 1,
        remark || null,
        approve_by || null,
        sessionUser.id,
        folder_id,
      ]
    );

    console.log("✅ File movement created:", result);
    res.json({
      success: true,
      message: "File movement created successfully",
      move_id: result.insertId,
    });
  } catch (err) {
    console.error("❌ POST /api/file_movement error:", err);
    res.status(500).json({ error: "Failed to create file movement", details: err.message });
  }
};

// ✅ GET ALL FILE MOVEMENTS
exports.getFileMovements = async (req, res) => {
  try {
    const [rows] = await db1.query(`
      SELECT 
        fm.move_id,
        fm.move_type,
        fm.move_date,
        fm.move_time,
        fm.taken_at,
        fm.return_at,
        fm.approved_at,
        fm.status_id,
        s.status_name,
        fm.remark,
        fm.approve_by,
        a.usr_name AS approved_by_name,
        fm.user_id,
        u.usr_name AS moved_by_name,
        fm.folder_id,
        f.folder_name
      FROM file_movement fm
      LEFT JOIN folder f ON fm.folder_id = f.folder_id
      LEFT JOIN filetracker.status s ON fm.status_id = s.status_id
      LEFT JOIN infracit_sharedb.users u ON fm.user_id = u.user_id
      LEFT JOIN infracit_sharedb.users a ON fm.approve_by = a.user_id
      ORDER BY fm.move_id DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error("❌ GET /api/file_movement error:", err);
    res.status(500).json({ error: "Failed to fetch file movements", details: err.message });
  }
};

// ✅ GET FILE MOVEMENT BY ID
exports.getFileMovementById = async (req, res) => {
  const { move_id } = req.params;

  try {
    const [rows] = await db1.query(
      `
      SELECT 
        fm.move_id,
        fm.move_type,
        fm.move_date,
        fm.move_time,
        fm.taken_at,
        fm.return_at,
        fm.approved_at,
        fm.status_id,
        s.status_name,
        fm.remark,
        fm.approve_by,
        a.usr_name AS approved_by_name,
        fm.user_id,
        u.usr_name AS moved_by_name,
        fm.folder_id,
        f.folder_name
      FROM file_movement fm
      LEFT JOIN folder f ON fm.folder_id = f.folder_id
      LEFT JOIN filetracker.status s ON fm.status_id = s.status_id
      LEFT JOIN infracit_sharedb.users u ON fm.user_id = u.user_id
      LEFT JOIN infracit_sharedb.users a ON fm.approve_by = a.user_id
      WHERE fm.move_id = ?
      `,
      [move_id]
    );

    if (rows.length === 0)
      return res.status(404).json({ error: "File movement not found" });

    res.json(rows[0]);
  } catch (err) {
    console.error("❌ GET /api/file_movement/:id error:", err);
    res.status(500).json({ error: "Failed to fetch file movement", details: err.message });
  }
};

// ✅ UPDATE FILE MOVEMENT
exports.updateFileMovement = async (req, res) => {
  const { move_id } = req.params;
  const {
    move_type,
    move_date,
    move_time,
    taken_at,
    return_at,
    approved_at,
    status_id,
    remark,
    approve_by,
    folder_id,
  } = req.body;

  try {
    const [result] = await db1.query(
      `
      UPDATE file_movement 
      SET 
        move_type = ?, 
        move_date = ?, 
        move_time = ?, 
        taken_at = ?, 
        return_at = ?, 
        approved_at = ?, 
        status_id = ?, 
        remark = ?, 
        approve_by = ?, 
        folder_id = ?
      WHERE move_id = ?
      `,
      [
        move_type || null,
        move_date || null,
        move_time || null,
        taken_at || null,
        return_at || null,
        approved_at || null,
        status_id || null,
        remark || null,
        approve_by || null,
        folder_id || null,
        move_id,
      ]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ error: "File movement not found" });

    res.json({ success: true, message: "File movement updated successfully" });
  } catch (err) {
    console.error("❌ PUT /api/file_movement/:id error:", err);
    res.status(500).json({ error: "Failed to update file movement", details: err.message });
  }
};

// ✅ DELETE FILE MOVEMENT
exports.deleteFileMovement = async (req, res) => {
  const { move_id } = req.params;

  try {
    const [result] = await db1.query(
      "DELETE FROM file_movement WHERE move_id = ?",
      [move_id]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ error: "File movement not found" });

    res.json({ success: true, message: "File movement deleted successfully" });
  } catch (err) {
    console.error("❌ DELETE /api/file_movement/:id error:", err);
    res.status(500).json({ error: "Failed to delete file movement", details: err.message });
  }
};
