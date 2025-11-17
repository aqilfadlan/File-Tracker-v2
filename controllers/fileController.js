const { db1 } = require("../db");

// =========================
// GET all files
// =========================
exports.getAllFiles = async (req, res) => {
  try {
    const [results] = await db1.query(`
      SELECT 
        f.file_id,
        f.file_name,
        f.uploaded_at,
        u.usr_name AS created_by,
        fo.folder_name
      FROM file f
      LEFT JOIN infracit_sharedb.users u ON f.user_id = u.user_id
      LEFT JOIN folder_files ff ON f.file_id = ff.file_id
      LEFT JOIN folder fo ON ff.folder_id = fo.folder_id
      ORDER BY f.file_id DESC
    `);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



// =====================================
// GET FILES AVAILABLE FOR FOLDER CREATION
// =====================================
exports.getAvailableFilesForFolder = async (req, res) => {
  try {
    const [files] = await db1.query(`
      SELECT 
        f.file_id,
        f.file_name,
        f.uploaded_at,
        f.user_id,
        CASE 
          WHEN ff.file_id IS NOT NULL THEN 1 
          ELSE 0 
        END AS is_disabled
      FROM file f
      LEFT JOIN folder_files ff ON f.file_id = ff.file_id
      ORDER BY f.file_id DESC
    `);

    res.json(files);
  } catch (err) {
    console.error("❌ Error fetching available files:", err);
    res.status(500).json({ error: "Database error", details: err.message });
  }
};


// =========================
// GET file by ID
// =========================
exports.getFileById = async (req, res) => {
  const { id } = req.params;
  try {
    const [results] = await db1.query("SELECT * FROM file WHERE file_id = ?", [id]);
    if (results.length === 0)
      return res.status(404).json({ message: "File not found" });
    res.json(results[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =========================
// CREATE file
// =========================
exports.createFile = async (req, res) => {
  const { file_name, folder_id } = req.body;
  const sessionUser = req.session.user; // ✅ get from session

  if (!sessionUser) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!file_name) {
    return res.status(400).json({ error: "file_name is required" });
  }

  try {
    const [result] = await db1.query(
      `INSERT INTO file (file_name, uploaded_at, user_id, folder_id) 
       VALUES (?, NOW(), ?, ?)`,
      [file_name, sessionUser.id, folder_id || null]
    );

    res.status(201).json({
      message: "✅ File added successfully",
      file_id: result.insertId,
      created_by: sessionUser.name,
    });
  } catch (err) {
    console.error("❌ Error adding file:", err);
    res.status(500).json({ error: err.message });
  }
};


// =========================
// UPDATE file
// =========================
exports.updateFile = async (req, res) => {
  const { id } = req.params;
  const { file_name, folder_id } = req.body;

  if (!file_name) {
    return res.status(400).json({ error: "file_name is required" });
  }

  try {
    let query, values;

    // If folder_id is provided, update both
    if (folder_id !== undefined) {
      query = "UPDATE file SET file_name = ?, folder_id = ? WHERE file_id = ?";
      values = [file_name, folder_id, id];
    } else {
      // Otherwise only update file_name
      query = "UPDATE file SET file_name = ? WHERE file_id = ?";
      values = [file_name, id];
    }

    const [result] = await db1.query(query, values);

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "File not found" });

    res.json({ message: "File updated successfully" });
  } catch (err) {
    console.error("Error updating file:", err);
    res.status(500).json({ error: err.message });
  }
};


// =========================
// DELETE file
// =========================
exports.deleteFile = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db1.query("DELETE FROM file WHERE file_id = ?", [id]);
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "File not found" });
    res.json({ message: "File deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
